import 'package:murmli/api/models/shopping_list_models.dart';

/// Repository interface for shopping list operations
/// 
/// This interface defines the contract for shopping list data operations,
/// abstracting the underlying data sources (API, local cache, etc.)
abstract class ShoppingListRepository {
  /// Creates a new shopping list
  /// 
  /// Returns the created [ShoppingList]
  /// Throws an exception if creation fails
  Future<ShoppingList> createShoppingList();

  /// Reads an existing shopping list by ID
  /// 
  /// [listId] The ID of the shopping list to retrieve
  /// Returns the [ShoppingList] if found
  /// Throws an exception if not found or retrieval fails
  Future<ShoppingList> getShoppingList(String listId);

  /// Creates a new item in the shopping list
  /// 
  /// [listId] The ID of the shopping list
  /// [text] The text/name of the item to create
  /// Returns the updated [ShoppingList] with the new item
  /// Throws an exception if creation fails
  Future<ShoppingList> createShoppingListItem(String listId, String text);

  /// Deletes an item from the shopping list
  /// 
  /// [listId] The ID of the shopping list
  /// [itemId] The ID of the item to delete
  /// Throws an exception if deletion fails
  Future<void> deleteShoppingListItem(String listId, String itemId);

  /// Updates the active state of a shopping list item
  /// 
  /// [listId] The ID of the shopping list
  /// [itemId] The ID of the item to update
  /// [name] The name of the item
  /// [quantity] The quantity of the item
  /// [unit] The unit ID
  /// [category] The category ID
  /// [active] The new active state
  /// Throws an exception if update fails
  Future<void> updateShoppingListItemActive(
    String listId,
    String itemId,
    String name,
    double quantity,
    int unit,
    int category,
    bool active,
  );

  /// Deletes all checked (inactive) items from the shopping list
  /// 
  /// [listId] The ID of the shopping list
  /// Throws an exception if deletion fails
  Future<void> deleteAllCheckedItems(String listId);
}

