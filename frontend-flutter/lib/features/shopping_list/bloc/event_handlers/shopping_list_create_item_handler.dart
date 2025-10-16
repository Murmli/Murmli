import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/features/shopping_list/bloc/models/shopping_list_item_ui.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/data/repositories/shopping_list/shopping_list_repository.dart';
import 'package:uuid/uuid.dart';

class ShoppingListCreateItemHandler {
  final ShoppingListRepository repository;
  final RetryQueueBloc retryQueueBloc;

  ShoppingListCreateItemHandler(this.repository, this.retryQueueBloc);

  Future<void> handle(
    String text,
    String? tempId,
    ShoppingListState currentState,
    Emitter<ShoppingListState> emit,
  ) async {
    final shoppingListId = await AppSecureStorage().getShoppingListId();
    if (shoppingListId == null) {
      emit(ShoppingListState.error('Shopping list id not found'));
      return;
    }

    // Generate temp ID if not provided
    final itemTempId = tempId ?? const Uuid().v4();

    // Optimistically add item with loading state
    currentState.maybeWhen(
      loaded: (shoppingList, itemStatuses) {
        // Create temporary item
        final tempItem = ShoppingListItem(
          id: itemTempId,
          name: text,
          category: const ItemCategory(id: 0), // Default category
          active: true,
        );

        // Add to list with loading status
        final updatedItems = [...shoppingList.items, tempItem];
        final updatedStatuses = {
          ...itemStatuses,
          itemTempId: ShoppingListItemStatus.loading,
        };

        emit(ShoppingListState.loaded(
          shoppingList.copyWith(items: updatedItems),
          itemStatuses: updatedStatuses,
        ));
      },
      orElse: () => null,
    );

    // Try to create on server
    try {
      print('Creating item: $text');
      final updatedList = await repository.createShoppingListItem(
        shoppingListId,
        text,
      );

      // Find the newly created item (should be the last one)
      final newItem = updatedList.items.lastWhere(
        (item) => item.name == text && item.id != itemTempId,
        orElse: () => updatedList.items.last,
      );

      // Update state: remove temp item, add real item with success status
      currentState.maybeWhen(
        loaded: (shoppingList, itemStatuses) {
          final itemsWithoutTemp =
              updatedList.items.where((item) => item.id != itemTempId).toList();

          final updatedStatuses = {...itemStatuses};
          updatedStatuses.remove(itemTempId); // Remove temp status
          updatedStatuses[newItem.id!] = ShoppingListItemStatus.success;

          emit(ShoppingListState.loaded(
            updatedList.copyWith(items: itemsWithoutTemp),
            itemStatuses: updatedStatuses,
          ));
        },
        orElse: () => emit(ShoppingListState.loaded(updatedList)),
      );
    } catch (e) {
      print('Failed to create item: $e');

      // Update item status to error
      currentState.maybeWhen(
        loaded: (shoppingList, itemStatuses) {
          final updatedStatuses = {
            ...itemStatuses,
            itemTempId: ShoppingListItemStatus.error,
          };

          emit(ShoppingListState.loaded(
            shoppingList,
            itemStatuses: updatedStatuses,
          ));
        },
        orElse: () => null,
      );

      // Don't add to retry queue - user will use retry button
    }
  }
}

