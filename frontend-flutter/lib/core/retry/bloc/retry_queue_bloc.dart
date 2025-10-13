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
  bool _hasInternet =
      false; // Start pessimistic, check connectivity before processing
  ConnectivityResult _connectionType = ConnectivityResult.none;

  // Stream for notifying external listeners about successful operations
  final _operationSuccessController =
      StreamController<RetryOperationType>.broadcast();
  Stream<RetryOperationType> get operationSuccessStream =>
      _operationSuccessController.stream;

  static const int maxRetries = 5;
  static const Duration initialBackoff = Duration(seconds: 2);
  static const Duration processingIntervalOffline = Duration(seconds: 30);

  // Configuration maps for cleaner lookups
  static const _intervalsByConnection = {
    ConnectivityResult.wifi: Duration(seconds: 5),
    ConnectivityResult.ethernet: Duration(seconds: 5),
    ConnectivityResult.mobile: Duration(seconds: 10),
  };

  static const _multipliersByConnection = {
    ConnectivityResult.wifi: 0.7,
    ConnectivityResult.ethernet: 0.7,
    ConnectivityResult.mobile: 1.0,
    ConnectivityResult.vpn: 1.5,
    ConnectivityResult.bluetooth: 1.5,
    ConnectivityResult.other: 1.5,
  };

  RetryQueueBloc(
    this._storage,
    this._shoppingListApi, [
    Connectivity? connectivity,
  ]) : _connectivity = connectivity ?? Connectivity(),
       super(const RetryQueueState.initial()) {
    on<RetryQueueInitEvent>(_onInit);
    on<RetryQueueAddOperationEvent>(_onAddOperation);
    on<RetryQueueProcessEvent>(_onProcess);
    on<RetryQueueRemoveOperationEvent>(_onRemoveOperation);
    on<RetryQueueClearEvent>(_onClear);

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

    print(
      'Retry queue processing interval set to: ${processingInterval.inSeconds}s',
    );
  }

  Duration _getProcessingInterval() =>
      _intervalsByConnection[_connectionType] ?? processingIntervalOffline;

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
      print(
        'Internet connection restored ($_connectionType), processing retry queue immediately',
      );
      add(RetryQueueProcessEvent());
    } else if (hadInternet && !_hasInternet) {
      print('Internet connection lost, slowing down retry queue');
    }

    // Connection type changed (e.g., WiFi to mobile or vice versa)
    if (_connectionType != previousConnectionType) {
      print(
        'Connection type changed: $previousConnectionType -> $_connectionType',
      );
      _startPeriodicProcessing(); // Restart timer with new interval
    }
  }

  bool _hasInternetConnection(List<ConnectivityResult> results) {
    // Consider we have internet if we have any connection other than none
    return results.any((result) => result != ConnectivityResult.none);
  }

  ConnectivityResult _getBestConnectionType(List<ConnectivityResult> results) {
    // Priority: WiFi/Ethernet > Mobile > Others > None
    const priority = [
      ConnectivityResult.wifi,
      ConnectivityResult.ethernet,
      ConnectivityResult.mobile,
      ConnectivityResult.vpn,
      ConnectivityResult.bluetooth,
      ConnectivityResult.other,
    ];

    return priority.firstWhere(
      results.contains,
      orElse: () => ConnectivityResult.none,
    );
  }

  double _getConnectivityBackoffMultiplier() =>
      _multipliersByConnection[_connectionType] ?? 2.0; // Default for offline

  Future<void> _onInit(
    RetryQueueInitEvent event,
    Emitter<RetryQueueState> emit,
  ) async {
    try {
      final operations = await _storage.loadOperations();
      emit(RetryQueueState.loaded(operations: operations));

      // Only process immediately if we have internet
      if (_hasInternet && operations.isNotEmpty) {
        print(
          'Retry queue initialized with ${operations.length} pending operations, processing...',
        );
        add(RetryQueueProcessEvent());
      } else if (operations.isNotEmpty) {
        print(
          'Retry queue initialized with ${operations.length} pending operations, but no internet. Will process when connection is available.',
        );
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
    final currentOperations = state.maybeWhen(
      loaded: (ops, _) => ops,
      orElse: () => <RetryOperation>[],
    );

    final currentProcessing = state.maybeWhen(
      loaded: (_, isProcessing) => isProcessing,
      orElse: () => false,
    );

    final updatedOperations = [...currentOperations, event.operation];

    emit(
      RetryQueueState.loaded(
        operations: updatedOperations,
        isProcessing: currentProcessing,
      ),
    );

    await _storage.saveOperations(updatedOperations);

    if (_hasInternet) {
      print('New operation added, triggering immediate processing');
      add(RetryQueueProcessEvent());
    } else {
      print('Operation queued, waiting for internet connection');
    }
  }

  Future<void> _onProcess(
    RetryQueueProcessEvent event,
    Emitter<RetryQueueState> emit,
  ) async {
    await state.maybeWhen(
      loaded: (operations, isProcessing) async {
        if (isProcessing || operations.isEmpty || !_hasInternet) {
          if (!_hasInternet && operations.isNotEmpty) {
            print('No internet connection, skipping retry queue processing');
          }
          return;
        }

        emit(
          RetryQueueState.loaded(operations: operations, isProcessing: true),
        );

        final updatedOperations = await _processOperations(operations);

        emit(
          RetryQueueState.loaded(
            operations: updatedOperations,
            isProcessing: false,
          ),
        );
        await _storage.saveOperations(updatedOperations);
      },
      orElse: () {},
    );
  }

  Future<List<RetryOperation>> _processOperations(
    List<RetryOperation> operations,
  ) async {
    final results = <RetryOperation>[];

    for (final operation in operations) {
      final processed = await _processOperation(operation);
      if (processed != null) {
        results.add(processed);
      }
    }

    return results;
  }

  Future<RetryOperation?> _processOperation(RetryOperation operation) async {
    // Skip if already retrying
    if (operation.isRetrying) return operation;

    // Remove if max retries reached
    if (operation.retryCount >= maxRetries) {
      print('Max retries reached for operation ${operation.id}, removing');
      return null;
    }

    // Check if enough time has passed
    if (!_shouldRetryNow(operation)) return operation;

    // Execute the operation
    final success = await _executeOperation(
      operation.copyWith(isRetrying: true),
    );

    if (success) {
      // Notify external listeners via stream
      _operationSuccessController.add(operation.type);
      return null; // Remove from queue
    }

    // Update retry count and schedule next retry
    return operation.copyWith(
      retryCount: operation.retryCount + 1,
      lastRetryAt: DateTime.now(),
      isRetrying: false,
    );
  }

  bool _shouldRetryNow(RetryOperation operation) {
    if (operation.lastRetryAt == null) return true;

    final backoffDelay = _calculateBackoff(operation.retryCount);
    final timeSinceLastRetry = DateTime.now().difference(
      operation.lastRetryAt!,
    );

    return timeSinceLastRetry >= backoffDelay;
  }

  Duration _calculateBackoff(int retryCount) {
    final baseMultiplier = retryCount == 0 ? 1 : (1 << retryCount);
    final connectivityMultiplier = _getConnectivityBackoffMultiplier();
    return initialBackoff * baseMultiplier * connectivityMultiplier;
  }

  Future<bool> _executeOperation(RetryOperation operation) async {
    try {
      final sessionToken = await AppSecureStorage().getSessionToken();
      final authHeader = 'Bearer $sessionToken';

      await _executeOperationWithAuth(operation, authHeader);
      print('Successfully executed ${operation.type.name}');
      return true;
    } catch (e) {
      print('Failed to execute operation ${operation.id}: $e');
      return false;
    }
  }

  Future<void> _executeOperationWithAuth(
    RetryOperation operation,
    String authHeader,
  ) async {
    switch (operation.type) {
      case RetryOperationType.deleteShoppingListItem:
        await _shoppingListApi.deleteShoppingListItem(
          Env.secretKey,
          authHeader,
          operation.data['listId'] as String,
          operation.data['itemId'] as String,
        );

      case RetryOperationType.deleteShoppingList:
        await _shoppingListApi.deleteShoppingList(
          Env.secretKey,
          authHeader,
          operation.data['listId'] as String,
        );

      case RetryOperationType.createShoppingListItem:
        await _shoppingListApi.createShoppingListItem(
          Env.secretKey,
          authHeader,
          operation.data['listId'] as String,
          operation.data['text'] as String,
        );

      case RetryOperationType.readShoppingList:
        await _shoppingListApi.readShoppingList(
          Env.secretKey,
          authHeader,
          operation.data['listId'] as String,
        );

      case RetryOperationType.createShoppingList:
        final response = await _shoppingListApi.createShoppingList(
          Env.secretKey,
          authHeader,
        );

        if (response.list.id != null) {
          await AppSecureStorage().setShoppingListId(response.list.id!);
        }
      case RetryOperationType.toggleShoppingListItem:
        await _shoppingListApi.updateShoppingListItemActive(
          Env.secretKey,
          authHeader,
          operation.data['listId'] as String,
          operation.data['itemId'] as String,
          operation.data['name'] as String,
          operation.data['quantity'] as double,
          operation.data['unit'] as int,
          operation.data['category'] as int,
          operation.data['active'] as bool,
        );
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
        emit(
          RetryQueueState.loaded(
            operations: updatedOperations,
            isProcessing: isProcessing,
          ),
        );
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

  @override
  Future<void> close() {
    _processingTimer?.cancel();
    _connectivitySubscription?.cancel();
    _operationSuccessController.close();
    return super.close();
  }
}
