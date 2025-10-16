import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/data/repositories/shopping_list/shopping_list_repository.dart';
import 'package:uuid/uuid.dart';

class ShoppingListToggleItemHandler {
  final ShoppingListRepository repository;
  final RetryQueueBloc retryQueueBloc;

  ShoppingListToggleItemHandler(this.repository, this.retryQueueBloc);

  Future<void> handle(
    String itemId,
    String name,
    double? quantity,
    int? unit,
    int? category,
    bool active,
    ShoppingListState currentState,
    Emitter<ShoppingListState> emit,
  ) async {
    final shoppingListId = await AppSecureStorage().getShoppingListId();
    if (shoppingListId == null) {
      emit(ShoppingListState.error('Shopping list id not found'));
      return;
    }

    // Optimistically update UI
    currentState.maybeWhen(
      loaded: (shoppingList, itemStatuses) {
        final updatedItems = shoppingList.items.map((item) {
          if (item.id == itemId) {
            return item.copyWith(active: !active);
          }
          return item;
        }).toList();

        final newList = shoppingList.copyWith(items: updatedItems);
        emit(ShoppingListState.loaded(newList, itemStatuses: itemStatuses));
      },
      orElse: () => currentState,
    );

    // Try to update on server
    try {
      await repository.updateShoppingListItemActive(
        shoppingListId,
        itemId,
        name,
        quantity ?? 0,
        unit ?? 0,
        category ?? 0,
        !active,
      );
      print('Successfully toggled item: $itemId');
    } catch (e) {
      print('Failed to toggle item, adding to retry queue: $e');

      // Add to retry queue if immediate toggle fails
      final operation = RetryOperation(
        id: const Uuid().v4(),
        type: RetryOperationType.toggleShoppingListItem,
        data: {
          'listId': shoppingListId,
          'itemId': itemId,
          'name': name,
          'quantity': quantity ?? 0,
          'unit': unit ?? 0,
          'category': category ?? 0,
          'active': !active,
        },
        createdAt: DateTime.now(),
      );
      retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
    }
  }
}

