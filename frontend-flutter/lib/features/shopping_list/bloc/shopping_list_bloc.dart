import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:meta/meta.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/features/shopping_list/bloc/event_handlers/shopping_list_create_item_handler.dart';
import 'package:murmli/features/shopping_list/bloc/event_handlers/shopping_list_delete_item_handler.dart';
import 'package:murmli/features/shopping_list/bloc/event_handlers/shopping_list_init_handler.dart';
import 'package:murmli/features/shopping_list/bloc/event_handlers/shopping_list_toggle_item_handler.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/data/repositories/shopping_list/shopping_list_repository.dart';

part 'shopping_list_event.dart';

class ShoppingListBloc
    extends HydratedBloc<ShoppingListEvent, ShoppingListState> {
  final ShoppingListRepository _repository;
  final RetryQueueBloc _retryQueueBloc;

  late final ShoppingListInitHandler _initHandler;
  late final ShoppingListCreateItemHandler _createItemHandler;
  late final ShoppingListDeleteItemHandler _deleteItemHandler;
  late final ShoppingListToggleItemHandler _toggleItemHandler;
  late final ShoppingListDeleteCheckedItemsHandler _deleteAllCheckedItemsHandler;

  ShoppingListBloc(this._repository, this._retryQueueBloc)
    : super(ShoppingListState.loading()) {
    _initHandler = ShoppingListInitHandler(_repository, _retryQueueBloc);
    _createItemHandler = ShoppingListCreateItemHandler(_repository, _retryQueueBloc);
    _deleteItemHandler = ShoppingListDeleteItemHandler(_repository, _retryQueueBloc);
    _toggleItemHandler = ShoppingListToggleItemHandler(_repository, _retryQueueBloc);
    _deleteAllCheckedItemsHandler = ShoppingListDeleteCheckedItemsHandler(_repository, _retryQueueBloc);

    on<ShoppingListInitEvent>((event, emit) async {
      await _initHandler.handle(emit);
    });
    on<ShoppingListCreateItemEvent>((event, emit) async {
      await _createItemHandler.handle(event.text, emit);
    });
    on<ShoppingListDeleteItemEvent>((event, emit) async {
      await _deleteItemHandler.handle(event.itemId, state, emit);
    });
    on<ShoppingListToggleItemActiveEvent>((event, emit) async {
      await _toggleItemHandler.handle(
        event.itemId,
        event.name,
        event.quantity,
        event.unit,
        event.category,
        event.active,
        state,
        emit,
      );
    });
    on<ShoppingListDeleteAllCheckedItemsEvent>((event, emit) async {
      await _deleteAllCheckedItemsHandler.handle(state, emit);
    });
  }


  @override
  void onChange(Change<ShoppingListState> change) {
    // Only trigger onChange if the shopping list has actually changed (excluding timestamps)
    final shouldNotify = change.currentState.maybeWhen(
      loaded: (currentList) {
        return change.nextState.maybeWhen(
          loaded: (nextList) {
            return !currentList.equalsIgnoreUpdatedAt(nextList);
          },
          orElse: () => true,
        );
      },
      orElse: () => true,
    );

    if (shouldNotify) {
      print(change);
      super.onChange(change);
    }
  }

  @override
  ShoppingListState? fromJson(Map<String, dynamic> json) {
    return ShoppingListState.fromJson(json);
  }

  @override
  Map<String, dynamic>? toJson(ShoppingListState state) {
    return state.toJson();
  }
}
