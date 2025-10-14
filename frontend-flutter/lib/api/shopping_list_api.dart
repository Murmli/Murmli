import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'models/shopping_list_models.dart';

part 'shopping_list_api.g.dart';

@RestApi(baseUrl: "https://murmli.donodrop.de/api/v2/")
abstract class ShoppingListApi {
  factory ShoppingListApi(Dio dio, {String? baseUrl}) = _ShoppingListApi;

  /// Create a new shopping list
  @GET('shoppingList/create')
  Future<ShoppingListResponse> createShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  /// Read a shopping list
  @POST('shoppingList/read')
  Future<ShoppingListResponse> readShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Delete a shopping list TO-DO use it
  @DELETE('shoppingList/delete')
  Future<String> deleteShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Create a new shopping list item from text
  @POST('shoppingList/item/create/text')
  Future<ShoppingListResponse> createShoppingListItem(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("text") String text,
  );

  /// Create a new shopping list item audio TO-DO use it
  @POST('shoppingList/item/create/audio')
  Future<String> createShoppingListItemAudio(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("audio") String audio,
  );

  /// Get user's shopping list item sorting preferences TO-DO use it
  @POST('shoppingList/item/sorting')
  Future<String> getShoppingListSorting(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  /// Delete an item from the shopping list
  @DELETE('shoppingList/item/delete')
  Future<ShoppingListResponse> deleteShoppingListItem(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("itemId") String itemId,
  );

  /// Delete all items in a shopping list TO-DO use it
  @DELETE('shoppingList/item/delete/all')
  Future<String> deleteAllShoppingListItems(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Delete all checked items in a shopping list TO-DO use it
  @DELETE('shoppingList/item/delete/checked')
  Future<String> deleteAllCheckedShoppingListItems(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Update an item in the shopping list TO-DO use it more
  @PUT('shoppingList/item/update')
  Future<ShoppingListResponse> updateShoppingListItemActive(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("itemId") String itemId,
    @BodyExtra("name") String name,
    @BodyExtra("quantity") double quantity,
    @BodyExtra("unit") int unit,
    @BodyExtra("category") int category,
    @BodyExtra("active") bool active,
  );

  /// Find alternative items for a shopping list item TO-DO use it
  @POST('shoppingList/item/alternative')
  Future<String> findItemAlternative(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("itemId") String itemId,
  );

  /// Create an invite code for a shopping list TO-DO use it
  @POST('shoppingList/invite/create')
  Future<String> createInviteCode(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Read an invite code for a shopping list TO-DO use it
  @POST('shoppingList/invite/read')
  Future<String> readInviteCode(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Join a shopping list via invite code TO-DO use it
  @POST('shoppingList/invite/join')
  Future<String> joinShoppingListViaInviteCode(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("inviteCode") String inviteCode,
  );

  /// Leave a shared shopping list TO-DO use it
  @POST('shoppingList/invite/leave')
  Future<String> leaveSharedShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Clear all invites for a shopping list TO-DO use it
  @POST('shoppingList/invite/clear')
  Future<String> clearInvites(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("id") String id,
  );

  /// Add a recipe to the shopping list TO-DO use it
  @POST('shoppingList/recipe/add')
  Future<String> addRecipeToShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("recipeId") String recipeId,
    @BodyExtra("servings") int servings,
  );

  /// Remove a recipe from the shopping list TO-DO use it
  @POST('shoppingList/recipe/remove')
  Future<String> removeRecipeFromShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("recipeId") String recipeId,
  );

  /// Remove all recipes from the shopping list TO-DO use it
  @POST('shoppingList/recipe/remove/all')
  Future<String> removeAllRecipesFromShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Remove all ingredients not linked to recipes from the shopping list TO-DO use it
  @POST('shoppingList/recipe/remove/all')
  Future<String> removeAllIngredientsNotLinkedToRecipesFromShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Adds all suggested recipes and their ingredients to the shopping list TO-DO use it
  @POST('shoppingList/suggestions/compile')
  Future<String> compileSuggestedRecipes(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Get last update timestamp of the shopping list TO-DO use it
  @POST('shoppingList/lastUpdate')
  Future<String> getLastUpdate(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  /// Get the user's latest shopping list ID TO-DO use it
  @GET('shoppingList/myShoppingList')
  Future<String> getUserLatestShoppingListId(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );
}
