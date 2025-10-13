import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/api/shopping_list_api.dart';
import 'package:murmli/core/env/env.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';

part 'shopping_list_event.dart';

class ShoppingListBloc extends Bloc<ShoppingListEvent, ShoppingListState> {
  final ShoppingListApi _apiService;
  ShoppingListBloc(this._apiService) : super(ShoppingListState.loading()) {
    on<ShoppingListInitEvent>((event, emit) async {
      await _init(event, emit);
    });
    on<ShoppingListCreateItemEvent>((event, emit) async {
      await _createItem(event, emit);
    });
    on<ShoppingListDeleteItemEvent>((event, emit) async {
      await _deleteItem(event, emit);
    });
  }

  Future<void> _init(
    ShoppingListInitEvent event,
    Emitter<ShoppingListState> emit,
  ) async {
    final sessionToken = await AppSecureStorage().getSessionToken();
    var shoppingListId = await AppSecureStorage().getShoppingListId();
    if (shoppingListId == null) {
      emit(ShoppingListState.loading());
      final response = await _apiService.createShoppingList(
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
      final response = await _apiService.readShoppingList(
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

    // final response = await _apiService.readShoppingList(
    //   Env.secretKey,
    //   'Bearer $sessionToken',
    // );
    // print(response);
  }

  Future<void> _createItem(
    ShoppingListCreateItemEvent event,
    Emitter<ShoppingListState> emit,
  ) async {
    final sessionToken = await AppSecureStorage().getSessionToken();
    final shoppingListId = await AppSecureStorage().getShoppingListId();
    if (shoppingListId == null) {
      emit(ShoppingListState.error('Shopping list id not found'));
      return;
    }
    print(event.text);
    final response = await _apiService.createShoppingListItem(
      Env.secretKey,
      'Bearer $sessionToken',
      shoppingListId,
      event.text,
    );
    emit(ShoppingListState.loaded(response.list));
  }

  Future<void> _deleteItem(
    ShoppingListDeleteItemEvent event,
    Emitter<ShoppingListState> emit,
  ) async {
    final sessionToken = await AppSecureStorage().getSessionToken();
    final shoppingListId = await AppSecureStorage().getShoppingListId();
    if (shoppingListId == null) {
      emit(ShoppingListState.error('Shopping list id not found'));
      return;
    }
    state.maybeWhen(
      loaded: (shoppingList) {
        final newList = shoppingList.copyWith(
          items: shoppingList.items
              .where((item) => item.id != event.itemId)
              .toList(),
        );
        emit(ShoppingListState.loaded(newList));
      },
      orElse: () => state,
    );
    await Future<void>.delayed(const Duration(seconds: 2));
    final response = await _apiService.deleteShoppingListItem(
      Env.secretKey,
      'Bearer $sessionToken',
      shoppingListId,
      event.itemId,
    );
    emit(ShoppingListState.loaded(response.list));
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
}
