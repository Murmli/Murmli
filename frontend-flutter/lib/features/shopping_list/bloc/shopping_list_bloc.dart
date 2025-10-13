import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:meta/meta.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/api/shopping_list_api.dart';
import 'package:murmli/core/env/env.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:uuid/uuid.dart';

part 'shopping_list_event.dart';

class ShoppingListBloc
    extends HydratedBloc<ShoppingListEvent, ShoppingListState> {
  final ShoppingListApi _apiService;
  final RetryQueueBloc _retryQueueBloc;

  ShoppingListBloc(this._apiService, this._retryQueueBloc)
    : super(ShoppingListState.loading()) {
    on<ShoppingListInitEvent>((event, emit) async {
      await _init(event, emit);
    });
    on<ShoppingListCreateItemEvent>((event, emit) async {
      await _createItem(event, emit);
    });
    on<ShoppingListDeleteItemEvent>((event, emit) async {
      await _deleteItem(event, emit);
    });
    on<ShoppingListToggleItemActiveEvent>((event, emit) async {
      await _toggleItemActive(event, emit);
    });
  }

  Future<void> _init(
    ShoppingListInitEvent event,
    Emitter<ShoppingListState> emit,
  ) async {
    try {
      final sessionToken = await AppSecureStorage().getSessionToken();
      var shoppingListId = await AppSecureStorage().getShoppingListId();

      if (shoppingListId == null) {
        emit(ShoppingListState.loading());
        final response = await _apiService.createShoppingList(
          Env.secretKey,
          'Bearer $sessionToken',
        );
        print(response);
        if (response.list.id != null) {
          await AppSecureStorage().setShoppingListId(response.list.id!);
        } else {
          emit(ShoppingListState.error('Shopping list id not found'));
          return;
        }
        emit(ShoppingListState.loaded(response.list));
      } else {
        final request = SetListIdRequest(listId: shoppingListId);
        final response = await _apiService.readShoppingList(
          Env.secretKey,
          'Bearer $sessionToken',
          request.listId,
        );
        if (response.list.id == null) {
          emit(ShoppingListState.error('Shopping list id not found'));
          return;
        }
        emit(ShoppingListState.loaded(response.list));
      }
    } catch (e) {
      print('Failed to initialize shopping list: $e');
      emit(
        ShoppingListState.error(
          'Unable to load shopping list. Please check your internet connection.',
        ),
      );

      // Queue the init operation for retry
      final shoppingListId = await AppSecureStorage().getShoppingListId();
      final operation = RetryOperation(
        id: const Uuid().v4(),
        type: shoppingListId == null
            ? RetryOperationType.createShoppingList
            : RetryOperationType.readShoppingList,
        data: shoppingListId != null ? {'listId': shoppingListId} : {},
        createdAt: DateTime.now(),
      );

      _retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
    }
  }

  Future<void> _createItem(
    ShoppingListCreateItemEvent event,
    Emitter<ShoppingListState> emit,
  ) async {
    try {
      final sessionToken = await AppSecureStorage().getSessionToken();
      final shoppingListId = await AppSecureStorage().getShoppingListId();
      if (shoppingListId == null) {
        emit(ShoppingListState.error('Shopping list id not found'));
        return;
      }
      print(event.text);

      final response = await _apiService.createShoppingListItem(
        Env.secretKey,
        'Bearer $sessionToken',
        shoppingListId,
        event.text,
      );
      emit(ShoppingListState.loaded(response.list));
    } catch (e) {
      print('Failed to create item: $e');

      // Add to retry queue if creation fails
      final shoppingListId = await AppSecureStorage().getShoppingListId();
      if (shoppingListId != null) {
        final operation = RetryOperation(
          id: const Uuid().v4(),
          type: RetryOperationType.createShoppingListItem,
          data: {
            'listId': shoppingListId,
            'text': event.text,
          },
          createdAt: DateTime.now(),
        );

        _retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
      }
    }
  }

  Future<void> _deleteItem(
    ShoppingListDeleteItemEvent event,
    Emitter<ShoppingListState> emit,
  ) async {
    final shoppingListId = await AppSecureStorage().getShoppingListId();
    if (shoppingListId == null) {
      emit(ShoppingListState.error('Shopping list id not found'));
      return;
    }

    // Optimistically update UI
    state.maybeWhen(
      loaded: (shoppingList) {
        final newList = shoppingList.copyWith(
          items: shoppingList.items
              .where((item) => item.id != event.itemId)
              .toList(),
        );
        emit(ShoppingListState.loaded(newList));
      },
      orElse: () => state,
    );

    // Try to delete immediately
    try {
      final sessionToken = await AppSecureStorage().getSessionToken();
      await _apiService.deleteShoppingListItem(
        Env.secretKey,
        'Bearer $sessionToken',
        shoppingListId,
        event.itemId,
      );
      print('Successfully deleted item: ${event.itemId}');
    } catch (e) {
      print('Failed to delete item immediately, adding to retry queue: $e');

      // Add to retry queue if immediate deletion fails
      final operation = RetryOperation(
        id: const Uuid().v4(),
        type: RetryOperationType.deleteShoppingListItem,
        data: {
          'listId': shoppingListId,
          'itemId': event.itemId,
        },
        createdAt: DateTime.now(),
      );

      _retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
    }
  }

  @override
  void onChange(Change<ShoppingListState> change) {
    // Only trigger onChange if the shopping list has actually changed (excluding timestamps)
    final shouldNotify = change.currentState.maybeWhen(
      loaded: (currentList) {
        return change.nextState.maybeWhen(
          loaded: (nextList) {
            return !currentList.equalsIgnoreUpdatedAt(nextList);
          },
          orElse: () => true,
        );
      },
      orElse: () => true,
    );

    if (shouldNotify) {
      print(change);
      super.onChange(change);
    }
  }

  Future<void> _toggleItemActive(
    ShoppingListToggleItemActiveEvent event,
    Emitter<ShoppingListState> emit,
  ) async {
    final shoppingListId = await AppSecureStorage().getShoppingListId();
    if (shoppingListId == null) {
      emit(ShoppingListState.error('Shopping list id not found'));
      return;
    }

    // Optimistically update UI
    state.maybeWhen(
      loaded: (shoppingList) {
        final updatedItems = shoppingList.items.map((item) {
          if (item.id == event.itemId) {
            return item.copyWith(active: !event.active);
          }
          return item;
        }).toList();

        final newList = shoppingList.copyWith(items: updatedItems);
        emit(ShoppingListState.loaded(newList));
      },
      orElse: () => state,
    );

    // Try to update on server
    try {
      final sessionToken = await AppSecureStorage().getSessionToken();
      await _apiService.updateShoppingListItemActive(
        Env.secretKey,
        'Bearer $sessionToken',
        shoppingListId,
        event.itemId,
        event.name,
        event.quantity ?? 0,
        event.unit ?? 0,
        event.category ?? 0,
        !event.active,
      );
      print('Successfully toggled item: ${event.itemId}');
    } catch (e) {
      print('Failed to toggle item, adding to retry queue: $e');

      // Add to retry queue if immediate toggle fails
      final operation = RetryOperation(
        id: const Uuid().v4(),
        type: RetryOperationType.toggleShoppingListItem,
        data: {
          'listId': shoppingListId,
          'itemId': event.itemId,
          'name': event.name,
          'quantity': event.quantity ?? 0,
          'unit': event.unit ?? 0,
          'category': event.category ?? 0,
          'active': !event.active,
        },
        createdAt: DateTime.now(),
      );
      _retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
    }
  }

  @override
  ShoppingListState? fromJson(Map<String, dynamic> json) {
    return ShoppingListState.fromJson(json);
  }

  @override
  Map<String, dynamic>? toJson(ShoppingListState state) {
    return state.toJson();
  }
}
