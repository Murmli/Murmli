import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:murmli/api/shopping_list_api.dart';
import 'package:murmli/core/env/env.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:uuid/uuid.dart';

class ShoppingListInitHandler {
  final ShoppingListApi apiService;
  final RetryQueueBloc retryQueueBloc;

  ShoppingListInitHandler(this.apiService, this.retryQueueBloc);

  Future<void> handle(Emitter<ShoppingListState> emit) async {
    try {
      final sessionToken = await AppSecureStorage().getSessionToken();
      var shoppingListId = await AppSecureStorage().getShoppingListId();

      if (shoppingListId == null) {
        emit(ShoppingListState.loading());
        final response = await apiService.createShoppingList(
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
        final response = await apiService.readShoppingList(
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

      retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
    }
  }
}

