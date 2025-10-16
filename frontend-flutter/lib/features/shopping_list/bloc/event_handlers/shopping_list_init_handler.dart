import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/data/repositories/shopping_list/shopping_list_repository.dart';
import 'package:uuid/uuid.dart';

class ShoppingListInitHandler {
  final ShoppingListRepository repository;
  final RetryQueueBloc retryQueueBloc;

  ShoppingListInitHandler(this.repository, this.retryQueueBloc);

  Future<void> handle(Emitter<ShoppingListState> emit) async {
    try {
      var shoppingListId = await AppSecureStorage().getShoppingListId();

      if (shoppingListId == null) {
        emit(ShoppingListState.loading());
        final shoppingList = await repository.createShoppingList();
        
        if (shoppingList.id != null) {
          await AppSecureStorage().setShoppingListId(shoppingList.id!);
        } else {
          emit(ShoppingListState.error('Shopping list id not found'));
          return;
        }
        emit(ShoppingListState.loaded(shoppingList, itemStatuses: {}));
      } else {
        final shoppingList = await repository.getShoppingList(shoppingListId);
        
        if (shoppingList.id == null) {
          emit(ShoppingListState.error('Shopping list id not found'));
          return;
        }
        emit(ShoppingListState.loaded(shoppingList, itemStatuses: {}));
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

      retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
    }
  }
}

