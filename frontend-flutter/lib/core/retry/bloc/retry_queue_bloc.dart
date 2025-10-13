import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:meta/meta.dart';
import 'package:murmli/api/shopping_list_api.dart';
import 'package:murmli/core/env/env.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import '../retry_operation.dart';
import '../retry_queue_storage.dart';
import 'retry_queue_state.dart';

part 'retry_queue_event.dart';

class RetryQueueBloc extends Bloc<RetryQueueEvent, RetryQueueState> {
  final RetryQueueStorage _storage;
  final ShoppingListApi _shoppingListApi;
  final Connectivity _connectivity;
  Timer? _processingTimer;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _hasInternet = false; // Start pessimistic, check connectivity before processing
  ConnectivityResult _connectionType = ConnectivityResult.none;
  
  // Stream for notifying external listeners about successful operations
  final _operationSuccessController = StreamController<RetryOperationType>.broadcast();
  Stream<RetryOperationType> get operationSuccessStream => _operationSuccessController.stream;

  static const int maxRetries = 5;
  static const Duration initialBackoff = Duration(seconds: 2);
  
  // Different processing intervals based on connectivity
  static const Duration processingIntervalWifi = Duration(seconds: 5);
  static const Duration processingIntervalMobile = Duration(seconds: 10);
  static const Duration processingIntervalOffline = Duration(seconds: 30);

  RetryQueueBloc(
    this._storage,
    this._shoppingListApi, [
    Connectivity? connectivity,
  ])  : _connectivity = connectivity ?? Connectivity(),
        super(const RetryQueueState.initial()) {
    on<RetryQueueInitEvent>(_onInit);
    on<RetryQueueAddOperationEvent>(_onAddOperation);
    on<RetryQueueProcessEvent>(_onProcess);
    on<RetryQueueRemoveOperationEvent>(_onRemoveOperation);
    on<RetryQueueClearEvent>(_onClear);
    on<RetryQueueOperationSucceededEvent>(_onOperationSucceeded);

    // Initialize connectivity monitoring first, then start processing
    _initConnectivityMonitoring().then((_) {
      _startPeriodicProcessing();
    });
  }

  void _startPeriodicProcessing([Duration? interval]) {
    _processingTimer?.cancel();
    
    final processingInterval = interval ?? _getProcessingInterval();
    _processingTimer = Timer.periodic(processingInterval, (timer) {
      add(RetryQueueProcessEvent());
    });
    
    print('Retry queue processing interval set to: ${processingInterval.inSeconds}s');
  }

  Duration _getProcessingInterval() {
    switch (_connectionType) {
      case ConnectivityResult.wifi:
      case ConnectivityResult.ethernet:
        return processingIntervalWifi;
      case ConnectivityResult.mobile:
        return processingIntervalMobile;
      case ConnectivityResult.none:
      case ConnectivityResult.bluetooth:
      case ConnectivityResult.vpn:
      case ConnectivityResult.other:
        return processingIntervalOffline;
    }
  }

  Future<void> _initConnectivityMonitoring() async {
    // Check initial connectivity synchronously
    try {
      final results = await _connectivity.checkConnectivity();
      _updateConnectivity(results);
    } catch (e) {
      print('Failed to check initial connectivity: $e');
      _hasInternet = false;
      _connectionType = ConnectivityResult.none;
    }

    // Listen to connectivity changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      (List<ConnectivityResult> results) {
        _updateConnectivity(results);
      },
    );
  }

  void _updateConnectivity(List<ConnectivityResult> results) {
    final hadInternet = _hasInternet;
    final previousConnectionType = _connectionType;
    
    _hasInternet = _hasInternetConnection(results);
    _connectionType = _getBestConnectionType(results);
    
    // Connection state changed
    if (!hadInternet && _hasInternet) {
      print('Internet connection restored ($_connectionType), processing retry queue immediately');
      add(RetryQueueProcessEvent());
    } else if (hadInternet && !_hasInternet) {
      print('Internet connection lost, slowing down retry queue');
    }
    
    // Connection type changed (e.g., WiFi to mobile or vice versa)
    if (_connectionType != previousConnectionType) {
      print('Connection type changed: $previousConnectionType -> $_connectionType');
      _startPeriodicProcessing(); // Restart timer with new interval
    }
  }

  bool _hasInternetConnection(List<ConnectivityResult> results) {
    // Consider we have internet if we have any connection other than none
    return results.any((result) => result != ConnectivityResult.none);
  }

  ConnectivityResult _getBestConnectionType(List<ConnectivityResult> results) {
    // Priority: WiFi/Ethernet > Mobile > Others > None
    if (results.contains(ConnectivityResult.wifi)) {
      return ConnectivityResult.wifi;
    }
    if (results.contains(ConnectivityResult.ethernet)) {
      return ConnectivityResult.ethernet;
    }
    if (results.contains(ConnectivityResult.mobile)) {
      return ConnectivityResult.mobile;
    }
    if (results.contains(ConnectivityResult.vpn)) {
      return ConnectivityResult.vpn;
    }
    if (results.contains(ConnectivityResult.bluetooth)) {
      return ConnectivityResult.bluetooth;
    }
    if (results.contains(ConnectivityResult.other)) {
      return ConnectivityResult.other;
    }
    return ConnectivityResult.none;
  }

  double _getConnectivityBackoffMultiplier() {
    // Adjust retry backoff based on connection quality
    switch (_connectionType) {
      case ConnectivityResult.wifi:
      case ConnectivityResult.ethernet:
        return 0.7; // Faster retries on good connections (30% faster)
      case ConnectivityResult.mobile:
        return 1.0; // Normal retries on mobile
      case ConnectivityResult.vpn:
      case ConnectivityResult.bluetooth:
      case ConnectivityResult.other:
        return 1.5; // Slower retries on unstable connections (50% slower)
      case ConnectivityResult.none:
        return 2.0; // Much slower when offline (2x slower)
    }
  }

  Future<void> _onInit(
    RetryQueueInitEvent event,
    Emitter<RetryQueueState> emit,
  ) async {
    try {
      final operations = await _storage.loadOperations();
      emit(RetryQueueState.loaded(operations: operations));
      
      // Only process immediately if we have internet
      if (_hasInternet && operations.isNotEmpty) {
        print('Retry queue initialized with ${operations.length} pending operations, processing...');
        add(RetryQueueProcessEvent());
      } else if (operations.isNotEmpty) {
        print('Retry queue initialized with ${operations.length} pending operations, but no internet. Will process when connection is available.');
      }
    } catch (e) {
      print('Failed to initialize retry queue: $e');
      emit(RetryQueueState.error(e.toString()));
    }
  }

  Future<void> _onAddOperation(
    RetryQueueAddOperationEvent event,
    Emitter<RetryQueueState> emit,
  ) async {
    await state.maybeWhen(
      loaded: (operations, isProcessing) async {
        final updatedOperations = [...operations, event.operation];
        emit(RetryQueueState.loaded(
          operations: updatedOperations,
          isProcessing: isProcessing,
        ));
        await _storage.saveOperations(updatedOperations);
        
        // Only trigger immediate processing if we have internet
        if (_hasInternet) {
          print('New operation added to retry queue, triggering immediate processing');
          add(RetryQueueProcessEvent());
        } else {
          print('New operation added to retry queue, but no internet. Will process when connection is available.');
        }
      },
      orElse: () async {
        emit(RetryQueueState.loaded(operations: [event.operation]));
        await _storage.saveOperations([event.operation]);
        
        if (_hasInternet) {
          add(RetryQueueProcessEvent());
        } else {
          print('Operation queued, waiting for internet connection');
        }
      },
    );
  }

  Future<void> _onProcess(
    RetryQueueProcessEvent event,
    Emitter<RetryQueueState> emit,
  ) async {
    await state.maybeWhen(
      loaded: (operations, isProcessing) async {
        if (isProcessing || operations.isEmpty) return;

        // Check internet connectivity before processing
        if (!_hasInternet) {
          print('No internet connection, skipping retry queue processing');
          return;
        }

        emit(RetryQueueState.loaded(
          operations: operations,
          isProcessing: true,
        ));

        final updatedOperations = <RetryOperation>[];
        
        for (final operation in operations) {
          if (operation.isRetrying) {
            updatedOperations.add(operation);
            continue;
          }

          // Check if we should retry this operation
          if (operation.retryCount >= maxRetries) {
            // Max retries reached, remove from queue
            print('Max retries reached for operation ${operation.id}, removing from queue');
            continue;
          }

          // Calculate backoff delay with connectivity-aware adjustment
          final baseBackoffMultiplier = operation.retryCount == 0 ? 1 : (1 << operation.retryCount);
          final connectivityMultiplier = _getConnectivityBackoffMultiplier();
          final backoffDelay = initialBackoff * baseBackoffMultiplier * connectivityMultiplier;
          
          // Check if enough time has passed since last retry
          if (operation.lastRetryAt != null) {
            final timeSinceLastRetry = DateTime.now().difference(operation.lastRetryAt!);
            if (timeSinceLastRetry < backoffDelay) {
              updatedOperations.add(operation);
              continue;
            }
          }

          // Mark as retrying
          final retryingOperation = operation.copyWith(isRetrying: true);
          updatedOperations.add(retryingOperation);
          
          // Update state immediately to show retrying status
          emit(RetryQueueState.loaded(
            operations: updatedOperations,
            isProcessing: true,
          ));

          // Execute the operation
          final success = await _executeOperation(retryingOperation);

          if (success) {
            // Remove from queue if successful
            updatedOperations.removeWhere((op) => op.id == operation.id);
            
            // Notify external listeners via stream
            _operationSuccessController.add(operation.type);
            
            // Also emit event for any internal handlers
            add(RetryQueueOperationSucceededEvent(operationType: operation.type));
          } else {
            // Update retry count and timestamp
            final index = updatedOperations.indexWhere((op) => op.id == operation.id);
            if (index != -1) {
              updatedOperations[index] = operation.copyWith(
                retryCount: operation.retryCount + 1,
                lastRetryAt: DateTime.now(),
                isRetrying: false,
              );
            }
          }
        }

        emit(RetryQueueState.loaded(
          operations: updatedOperations,
          isProcessing: false,
        ));
        await _storage.saveOperations(updatedOperations);
      },
      orElse: () {},
    );
  }

  Future<bool> _executeOperation(RetryOperation operation) async {
    try {
      final sessionToken = await AppSecureStorage().getSessionToken();
      
      switch (operation.type) {
        case RetryOperationType.deleteShoppingListItem:
          final listId = operation.data['listId'] as String;
          final itemId = operation.data['itemId'] as String;
          
          await _shoppingListApi.deleteShoppingListItem(
            Env.secretKey,
            'Bearer $sessionToken',
            listId,
            itemId,
          );
          print('Successfully deleted shopping list item: $itemId');
          return true;

        case RetryOperationType.deleteShoppingList:
          final listId = operation.data['listId'] as String;
          
          await _shoppingListApi.deleteShoppingList(
            Env.secretKey,
            'Bearer $sessionToken',
            listId,
          );
          print('Successfully deleted shopping list: $listId');
          return true;

        case RetryOperationType.createShoppingListItem:
          final listId = operation.data['listId'] as String;
          final text = operation.data['text'] as String;
          
          await _shoppingListApi.createShoppingListItem(
            Env.secretKey,
            'Bearer $sessionToken',
            listId,
            text,
          );
          print('Successfully created shopping list item: $text');
          return true;

        case RetryOperationType.readShoppingList:
          final listId = operation.data['listId'] as String;
          
          await _shoppingListApi.readShoppingList(
            Env.secretKey,
            'Bearer $sessionToken',
            listId,
          );
          print('Successfully read shopping list: $listId');
          return true;

        case RetryOperationType.createShoppingList:
          final response = await _shoppingListApi.createShoppingList(
            Env.secretKey,
            'Bearer $sessionToken',
          );
          
          // Save the list ID if we created a new one
          if (response.list.id != null) {
            await AppSecureStorage().setShoppingListId(response.list.id!);
            print('Successfully created shopping list: ${response.list.id}');
          }
          return true;
      }
    } catch (e) {
      print('Failed to execute operation ${operation.id}: $e');
      return false;
    }
  }

  Future<void> _onRemoveOperation(
    RetryQueueRemoveOperationEvent event,
    Emitter<RetryQueueState> emit,
  ) async {
    await state.maybeWhen(
      loaded: (operations, isProcessing) async {
        final updatedOperations = operations
            .where((op) => op.id != event.operationId)
            .toList();
        emit(RetryQueueState.loaded(
          operations: updatedOperations,
          isProcessing: isProcessing,
        ));
        await _storage.saveOperations(updatedOperations);
      },
      orElse: () {},
    );
  }

  Future<void> _onClear(
    RetryQueueClearEvent event,
    Emitter<RetryQueueState> emit,
  ) async {
    emit(const RetryQueueState.loaded(operations: []));
    await _storage.clearOperations();
  }

  void _onOperationSucceeded(
    RetryQueueOperationSucceededEvent event,
    Emitter<RetryQueueState> emit,
  ) {
    // This event is mainly for external listeners (like shopping list page)
    // No state changes needed here
    print('Operation succeeded event emitted: ${event.operationType}');
  }

  @override
  Future<void> close() {
    _processingTimer?.cancel();
    _connectivitySubscription?.cancel();
    _operationSuccessController.close();
    return super.close();
  }
}

