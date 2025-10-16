import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/data/repositories/shopping_list/shopping_list_repository.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:uuid/uuid.dart';

class ShoppingListDeleteCheckedItemsHandler {
  final ShoppingListRepository repository;
  final RetryQueueBloc retryQueueBloc;

  ShoppingListDeleteCheckedItemsHandler(this.repository, this.retryQueueBloc);

  Future<void> handle(
    ShoppingListState currentState,
    Emitter<ShoppingListState> emit,
  ) async {
    final listId = await AppSecureStorage().getShoppingListId();
    if (listId == null) {
      return;
    }
    // Optimistically update UI - remove all inactive items
    currentState.maybeWhen(
      loaded: (shoppingList, itemStatuses) {
        // Get IDs of items being deleted
        final checkedItemIds = shoppingList.items
            .where((item) => !item.active)
            .map((item) => item.id)
            .whereType<String>()
            .toList();

        // Filter out inactive items
        final updatedItems = shoppingList.items
            .where((item) => item.active)
            .toList();

        // Remove statuses for deleted items
        final updatedStatuses = {...itemStatuses};
        for (final id in checkedItemIds) {
          updatedStatuses.remove(id);
        }

        emit(
          ShoppingListState.loaded(
            shoppingList.copyWith(items: updatedItems),
            itemStatuses: updatedStatuses,
          ),
        );
      },
      orElse: () => currentState,
    );

    // Try to delete on server
    try {
      await repository.deleteAllCheckedItems(listId);
      print('Successfully deleted all checked items');
    } catch (e) {
      print('Failed to delete checked items, adding to retry queue: $e');

      final operation = RetryOperation(
        id: const Uuid().v4(),
        type: RetryOperationType.deleteAllCheckedShoppingListItems,
        data: {
          'listId': listId,
        },
        createdAt: DateTime.now(),
      );
      retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
    }
  }
}
