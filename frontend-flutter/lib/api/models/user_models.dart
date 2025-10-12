import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_models.freezed.dart';
part 'user_models.g.dart';

@freezed
abstract class UserLanguageResponse with _$UserLanguageResponse {
  const factory UserLanguageResponse({
    required String language,
  }) = _UserLanguageResponse;

  factory UserLanguageResponse.fromJson(Map<String, Object?> json) =>
      _$UserLanguageResponseFromJson(json);
}

@freezed
abstract class SetLanguageRequest with _$SetLanguageRequest {
  const factory SetLanguageRequest({
    required String language,
    String? timezone,
  }) = _SetLanguageRequest;

  factory SetLanguageRequest.fromJson(Map<String, Object?> json) =>
      _$SetLanguageRequestFromJson(json);
}

@freezed
abstract class UserRoleResponse with _$UserRoleResponse {
  const factory UserRoleResponse({
    required String role,
  }) = _UserRoleResponse;

  factory UserRoleResponse.fromJson(Map<String, Object?> json) =>
      _$UserRoleResponseFromJson(json);
}

@freezed
abstract class UserIdResponse with _$UserIdResponse {
  const factory UserIdResponse({
    required String id,
  }) = _UserIdResponse;

  factory UserIdResponse.fromJson(Map<String, Object?> json) =>
      _$UserIdResponseFromJson(json);
}

@freezed
abstract class ShoppingListSortingResponse with _$ShoppingListSortingResponse {
  const factory ShoppingListSortingResponse({
    required List<ShoppingCategorySort> categories,
  }) = _ShoppingListSortingResponse;

  factory ShoppingListSortingResponse.fromJson(Map<String, Object?> json) =>
      _$ShoppingListSortingResponseFromJson(json);
}

@freezed
abstract class ShoppingCategorySort with _$ShoppingCategorySort {
  const factory ShoppingCategorySort({
    required int id,
    required String name,
  }) = _ShoppingCategorySort;

  factory ShoppingCategorySort.fromJson(Map<String, Object?> json) =>
      _$ShoppingCategorySortFromJson(json);
}

@freezed
abstract class SetShoppingListSortingRequest
    with _$SetShoppingListSortingRequest {
  const factory SetShoppingListSortingRequest({
    required List<int> sort,
  }) = _SetShoppingListSortingRequest;

  factory SetShoppingListSortingRequest.fromJson(Map<String, Object?> json) =>
      _$SetShoppingListSortingRequestFromJson(json);
}

@freezed
abstract class ShoppingCategory with _$ShoppingCategory {
  const factory ShoppingCategory({
    required int id,
    required String name,
    String? description,
    String? icon,
    String? color,
  }) = _ShoppingCategory;

  factory ShoppingCategory.fromJson(Map<String, Object?> json) =>
      _$ShoppingCategoryFromJson(json);
}

@freezed
abstract class ShoppingCategoriesResponse with _$ShoppingCategoriesResponse {
  const factory ShoppingCategoriesResponse({
    required List<ShoppingCategory> categories,
  }) = _ShoppingCategoriesResponse;

  factory ShoppingCategoriesResponse.fromJson(Map<String, Object?> json) =>
      _$ShoppingCategoriesResponseFromJson(json);
}

@freezed
abstract class MessageResponse with _$MessageResponse {
  const factory MessageResponse({
    required String message,
  }) = _MessageResponse;

  factory MessageResponse.fromJson(Map<String, Object?> json) =>
      _$MessageResponseFromJson(json);
}

@freezed
abstract class ExportLinkResponse with _$ExportLinkResponse {
  const factory ExportLinkResponse({
    required String link,
  }) = _ExportLinkResponse;

  factory ExportLinkResponse.fromJson(Map<String, Object?> json) =>
      _$ExportLinkResponseFromJson(json);
}

@freezed
abstract class ImportUserDataResponse with _$ImportUserDataResponse {
  const factory ImportUserDataResponse({
    String? message,
    int? importedItems,
    String? token,
    Map<String, dynamic>? shoppingList,
    List<int>? shoppingListSort,
    String? language,
  }) = _ImportUserDataResponse;

  factory ImportUserDataResponse.fromJson(Map<String, Object?> json) {
    return ImportUserDataResponse(
      message: json['message'] as String? ?? 'Import completed successfully',
      importedItems: json['importedItems'] as int? ?? 1, // Default to 1 if not specified
      token: json['token'] as String?,
      shoppingList: json['shoppingList'] as Map<String, dynamic>?,
      shoppingListSort: (json['shoppingListSort'] as List<dynamic>?)?.map((e) => e as int).toList(),
      language: json['language'] as String?,
    );
  }
}

@freezed
abstract class UserProfileResponse with _$UserProfileResponse {
  const factory UserProfileResponse({
    required String id,
    required String email,
    String? name,
    String? avatar,
    String? timezone,
    String? language,
    Map<String, dynamic>? preferences,
  }) = _UserProfileResponse;

  factory UserProfileResponse.fromJson(Map<String, Object?> json) =>
      _$UserProfileResponseFromJson(json);
}

@freezed
abstract class UpdateUserProfileRequest with _$UpdateUserProfileRequest {
  const factory UpdateUserProfileRequest({
    String? name,
    String? avatar,
    String? timezone,
    String? language,
    Map<String, dynamic>? preferences,
  }) = _UpdateUserProfileRequest;

  factory UpdateUserProfileRequest.fromJson(Map<String, Object?> json) =>
      _$UpdateUserProfileRequestFromJson(json);
}

@freezed
abstract class UserPreferencesResponse with _$UserPreferencesResponse {
  const factory UserPreferencesResponse({
    required String language,
    String? timezone,
    Map<String, dynamic>? theme,
    Map<String, dynamic>? notifications,
    Map<String, dynamic>? privacy,
  }) = _UserPreferencesResponse;

  factory UserPreferencesResponse.fromJson(Map<String, Object?> json) =>
      _$UserPreferencesResponseFromJson(json);
}

@freezed
abstract class UpdateUserPreferencesRequest
    with _$UpdateUserPreferencesRequest {
  const factory UpdateUserPreferencesRequest({
    String? language,
    String? timezone,
    Map<String, dynamic>? theme,
    Map<String, dynamic>? notifications,
    Map<String, dynamic>? privacy,
  }) = _UpdateUserPreferencesRequest;

  factory UpdateUserPreferencesRequest.fromJson(Map<String, Object?> json) =>
      _$UpdateUserPreferencesRequestFromJson(json);
}
