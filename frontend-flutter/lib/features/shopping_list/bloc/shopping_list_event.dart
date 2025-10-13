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
