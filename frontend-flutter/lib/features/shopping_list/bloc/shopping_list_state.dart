import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:murmli/api/models/shopping_list_models.dart';

part 'shopping_list_state.freezed.dart';
part 'shopping_list_state.g.dart';

@freezed
abstract class ShoppingListState with _$ShoppingListState {
  factory ShoppingListState.loading() = ShoppingListLoadingState;
  factory ShoppingListState.loaded(ShoppingList shoppingList) = ShoppingListLoadedState;
  factory ShoppingListState.error(String message) = ShoppingListErrorState;

  factory ShoppingListState.fromJson(Map<String, dynamic> json) =>
      _$ShoppingListStateFromJson(json);
}
