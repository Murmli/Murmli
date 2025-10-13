import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'models/shopping_list_models.dart';

part 'shopping_list_api.g.dart';

@RestApi(baseUrl: "https://murmli.de/api/v2/")
abstract class ShoppingListApi {
  factory ShoppingListApi(Dio dio, {String? baseUrl}) = _ShoppingListApi;

  @GET('shoppingList/create')
  Future<ShoppingListResponse> createShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @POST('shoppingList/read')
  Future<ShoppingListResponse> readShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  @DELETE('shoppingList/delete')
  Future<ShoppingListResponse> deleteShoppingList(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
  );

  @POST('shoppingList/item/create/text')
  Future<ShoppingListResponse> createShoppingListItem(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("text") String text,
  );

  @DELETE('shoppingList/item/delete')
  Future<ShoppingListResponse> deleteShoppingListItem(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @BodyExtra("listId") String listId,
    @BodyExtra("itemId") String itemId,
  );

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
}
