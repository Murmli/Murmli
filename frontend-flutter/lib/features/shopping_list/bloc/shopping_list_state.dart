import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/features/shopping_list/bloc/models/shopping_list_item_ui.dart';

part 'shopping_list_state.freezed.dart';
part 'shopping_list_state.g.dart';

@freezed
abstract class ShoppingListState with _$ShoppingListState {
  factory ShoppingListState.loading() = ShoppingListLoadingState;
  
  factory ShoppingListState.loaded(
    ShoppingList shoppingList, {
    /// Map of item IDs to their UI status (for loading/error states)
    @Default({}) Map<String, ShoppingListItemStatus> itemStatuses,
  }) = ShoppingListLoadedState;
  
  factory ShoppingListState.error(String message) = ShoppingListErrorState;

  factory ShoppingListState.fromJson(Map<String, dynamic> json) =>
      _$ShoppingListStateFromJson(json);
}
