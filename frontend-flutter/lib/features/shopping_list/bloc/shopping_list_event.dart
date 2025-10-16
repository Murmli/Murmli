part of 'shopping_list_bloc.dart';

@immutable
sealed class ShoppingListEvent {}

class ShoppingListRequestListEvent extends ShoppingListEvent {}

class ShoppingListCreateListEvent extends ShoppingListEvent {}

class ShoppingListInitEvent extends ShoppingListEvent {}

class ShoppingListDeleteListEvent extends ShoppingListEvent {}

class ShoppingListCreateItemEvent extends ShoppingListEvent {
  final String text;
  final String? tempId; // Temporary ID for optimistic updates

  ShoppingListCreateItemEvent({
    required this.text,
    this.tempId,
  }) : super();
}

class ShoppingListRetryCreateItemEvent extends ShoppingListEvent {
  final String tempId;
  final String text;

  ShoppingListRetryCreateItemEvent({
    required this.tempId,
    required this.text,
  }) : super();
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

class ShoppingListDeleteAllCheckedItemsEvent extends ShoppingListEvent {
  ShoppingListDeleteAllCheckedItemsEvent() : super();
}
