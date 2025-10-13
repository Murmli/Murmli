part of 'shopping_list_bloc.dart';

@immutable
sealed class ShoppingListEvent {}

class ShoppingListRequestListEvent extends ShoppingListEvent {}

class ShoppingListCreateListEvent extends ShoppingListEvent {}

class ShoppingListInitEvent extends ShoppingListEvent {}

class ShoppingListDeleteListEvent extends ShoppingListEvent {}

class ShoppingListCreateItemEvent extends ShoppingListEvent {
  final String text;

  ShoppingListCreateItemEvent({required this.text}) : super();
}

class ShoppingListDeleteItemEvent extends ShoppingListEvent {
  final String itemId;

  ShoppingListDeleteItemEvent({required this.itemId}) : super();
}

class ShoppingListToggleItemActiveEvent extends ShoppingListEvent {
  final String itemId;
  final String name;
  final double? quantity;
  final int? unit;
  final int? category;
  final bool active;

  ShoppingListToggleItemActiveEvent({
    required this.itemId,
    required this.name,
    this.quantity,
    this.unit,
    this.category,
    required this.active,
  }) : super();
}
