import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/data/repositories/shopping_list/shopping_list_repository.dart';
import 'package:uuid/uuid.dart';

class ShoppingListDeleteItemHandler {
  final ShoppingListRepository repository;
  final RetryQueueBloc retryQueueBloc;

  ShoppingListDeleteItemHandler(this.repository, this.retryQueueBloc);

  Future<void> handle(
    String itemId,
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
      loaded: (shoppingList) {
        final newList = shoppingList.copyWith(
          items: shoppingList.items
              .where((item) => item.id != itemId)
              .toList(),
        );
        emit(ShoppingListState.loaded(newList));
      },
      orElse: () => currentState,
    );

    // Try to delete immediately
    try {
      await repository.deleteShoppingListItem(shoppingListId, itemId);
      print('Successfully deleted item: $itemId');
    } catch (e) {
      print('Failed to delete item immediately, adding to retry queue: $e');

      // Add to retry queue if immediate deletion fails
      final operation = RetryOperation(
        id: const Uuid().v4(),
        type: RetryOperationType.deleteShoppingListItem,
        data: {
          'listId': shoppingListId,
          'itemId': itemId,
        },
        createdAt: DateTime.now(),
      );

      retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
    }
  }
}

