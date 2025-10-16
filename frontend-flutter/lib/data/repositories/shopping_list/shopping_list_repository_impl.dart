import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/api/shopping_list_api.dart';
import 'package:murmli/core/env/env.dart';
import 'package:murmli/core/storage/app_secure_storage.dart';
import 'package:murmli/data/repositories/shopping_list/shopping_list_repository.dart';

/// Implementation of [ShoppingListRepository] using the REST API
/// 
/// This implementation handles:
/// - Authentication token management
/// - API communication
/// - Data transformation between API and domain models
class ShoppingListRepositoryImpl implements ShoppingListRepository {
  final ShoppingListApi _apiService;
  final AppSecureStorage _storage;

  ShoppingListRepositoryImpl(this._apiService, this._storage);

  @override
  Future<ShoppingList> createShoppingList() async {
    final sessionToken = await _storage.getSessionToken();
    
    final response = await _apiService.createShoppingList(
      Env.secretKey,
      'Bearer $sessionToken',
    );
    
    return response.list;
  }

  @override
  Future<ShoppingList> getShoppingList(String listId) async {
    final sessionToken = await _storage.getSessionToken();
    
    final response = await _apiService.readShoppingList(
      Env.secretKey,
      'Bearer $sessionToken',
      listId,
    );
    
    return response.list;
  }

  @override
  Future<ShoppingList> createShoppingListItem(
    String listId,
    String text,
  ) async {
    final sessionToken = await _storage.getSessionToken();
    
    final response = await _apiService.createShoppingListItem(
      Env.secretKey,
      'Bearer $sessionToken',
      listId,
      text,
    );
    
    return response.list;
  }

  @override
  Future<void> deleteShoppingListItem(String listId, String itemId) async {
    final sessionToken = await _storage.getSessionToken();
    
    await _apiService.deleteShoppingListItem(
      Env.secretKey,
      'Bearer $sessionToken',
      listId,
      itemId,
    );
  }

  @override
  Future<void> updateShoppingListItemActive(
    String listId,
    String itemId,
    String name,
    double quantity,
    int unit,
    int category,
    bool active,
  ) async {
    final sessionToken = await _storage.getSessionToken();
    
    await _apiService.updateShoppingListItemActive(
      Env.secretKey,
      'Bearer $sessionToken',
      listId,
      itemId,
      name,
      quantity,
      unit,
      category,
      active,
    );
  }

  @override
  Future<void> deleteAllCheckedItems(String listId) async {
    final sessionToken = await _storage.getSessionToken();
    
    await _apiService.deleteAllCheckedShoppingListItems(
      Env.secretKey,
      'Bearer $sessionToken',
      listId,
    );
  }
}

