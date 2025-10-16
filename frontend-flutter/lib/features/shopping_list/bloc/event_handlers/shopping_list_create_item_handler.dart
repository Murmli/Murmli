import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/data/repositories/shopping_list/shopping_list_repository.dart';
import 'package:uuid/uuid.dart';

class ShoppingListCreateItemHandler {
  final ShoppingListRepository repository;
  final RetryQueueBloc retryQueueBloc;

  ShoppingListCreateItemHandler(this.repository, this.retryQueueBloc);

  Future<void> handle(
    String text,
    Emitter<ShoppingListState> emit,
  ) async {
    try {
      final shoppingListId = await AppSecureStorage().getShoppingListId();
      if (shoppingListId == null) {
        emit(ShoppingListState.error('Shopping list id not found'));
        return;
      }
      print(text);

      final shoppingList = await repository.createShoppingListItem(
        shoppingListId,
        text,
      );
      emit(ShoppingListState.loaded(shoppingList));
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
            'text': text,
          },
          createdAt: DateTime.now(),
        );

        retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
      }
    }
  }
}

