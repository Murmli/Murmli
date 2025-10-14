import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'models/user_models.dart';

part 'user_api.g.dart';

@RestApi(baseUrl: "https://murmli.donodrop.de/api/v2/")
abstract class UserApi {
  factory UserApi(Dio dio) = _UserApi;

  @PUT('user/language/set')
  Future<HttpResponse<MessageResponse>> setLanguage(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @Body() SetLanguageRequest body,
  );

  @POST('user/language/get')
  Future<HttpResponse<UserLanguageResponse>> getLanguage(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @PUT('user/shoppingList/sorting/set')
  Future<HttpResponse<MessageResponse>> setShoppingListSorting(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @Body() SetShoppingListSortingRequest body,
  );

  @POST('user/shoppingList/sorting/get')
  Future<HttpResponse<ShoppingListSortingResponse>> getShoppingListSorting(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @POST('user/shoppingList/categories/read')
  Future<HttpResponse<ShoppingCategoriesResponse>> readShoppingListCategories(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @DELETE('user/delete')
  Future<HttpResponse<MessageResponse>> deleteUser(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @POST('user/data/export')
  Future<HttpResponse<ExportLinkResponse>> exportUserData(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @GET('user/data/download/{token}')
  Future<HttpResponse<dynamic>> downloadExportData(
    @Path('token') String token,
  );

  @POST('user/data/import')
  Future<HttpResponse<ImportUserDataResponse>> importUserData(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @Body() Map<String, dynamic> body,
  );

  @POST('user/role/get')
  Future<HttpResponse<UserRoleResponse>> getUserRole(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @POST('user/id/get')
  Future<HttpResponse<UserIdResponse>> getUserId(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @GET('system/languages')
  Future<HttpResponse<Map<String, String>>> getAvailableLanguages(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @GET('user/profile')
  Future<HttpResponse<UserProfileResponse>> getUserProfile(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @PUT('user/profile')
  Future<HttpResponse<UserProfileResponse>> updateUserProfile(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @Body() UpdateUserProfileRequest body,
  );

  @GET('user/preferences')
  Future<HttpResponse<UserPreferencesResponse>> getUserPreferences(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );

  @PUT('user/preferences')
  Future<HttpResponse<UserPreferencesResponse>> updateUserPreferences(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
    @Body() UpdateUserPreferencesRequest body,
  );
}
