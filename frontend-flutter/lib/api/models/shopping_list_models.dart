// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

part 'shopping_list_models.freezed.dart';
part 'shopping_list_models.g.dart';

/// Represents a shopping list with recipes and items
@freezed
abstract class ShoppingList with _$ShoppingList {
  const ShoppingList._();
  
  const factory ShoppingList({
    @JsonKey(name: '_id') String? id,
    required String user,
    @Default([]) List<ShoppingListRecipe> recipes,
    @Default([]) List<ShoppingListItem> items,
    @Default([]) List<String> sharedWith,
    DateTime? createdAt,
     DateTime? updatedAt,
    bool? isOwner,
  }) = _ShoppingList;

  factory ShoppingList.fromJson(Map<String, dynamic> json) =>
      _$ShoppingListFromJson(json);

  /// Compares this shopping list with another, ignoring updatedAt and createdAt fields
  bool equalsIgnoreUpdatedAt(ShoppingList other) {
    return id == other.id &&
        user == other.user &&
        _listEquals(recipes, other.recipes) &&
        _listEquals(items, other.items) &&
        _listEquals(sharedWith, other.sharedWith) &&
        createdAt == other.createdAt &&
        isOwner == other.isOwner;
  }

  /// Helper method to compare lists
  bool _listEquals<T>(List<T> list1, List<T> list2) {
    if (list1.length != list2.length) return false;
    for (int i = 0; i < list1.length; i++) {
      if (list1[i] != list2[i]) return false;
    }
    return true;
  }
}

/// Represents a recipe within a shopping list
@freezed
abstract class ShoppingListRecipe with _$ShoppingListRecipe {
  const factory ShoppingListRecipe({
    @JsonKey(name: '_id') required String id,
    required String title,
    required String image,
    required int servings,
    @Default(false) bool ingredientsAdded,
  }) = _ShoppingListRecipe;

  factory ShoppingListRecipe.fromJson(Map<String, dynamic> json) =>
      _$ShoppingListRecipeFromJson(json);
}

/// Represents a unit with id and name
@freezed
abstract class ItemUnit with _$ItemUnit {
  const factory ItemUnit({
    int? id,
    String? name,
  }) = _ItemUnit;

  factory ItemUnit.fromJson(Map<String, dynamic> json) =>
      _$ItemUnitFromJson(json);
}

/// Represents a category with id and name
@freezed
abstract class ItemCategory with _$ItemCategory {
  const factory ItemCategory({
    required int id,
    String? name,
  }) = _ItemCategory;

  factory ItemCategory.fromJson(Map<String, dynamic> json) =>
      _$ItemCategoryFromJson(json);
}

/// Represents an item within a shopping list
@freezed
abstract class ShoppingListItem with _$ShoppingListItem {
  const factory ShoppingListItem({
    @JsonKey(name: '_id') String? id,
    required String name,
    double? quantity,
    ItemUnit? unit,
    required ItemCategory category,
    @Default(false) bool recipe,
    String? recipeId,
    @Default(true) bool active,
  }) = _ShoppingListItem;

  factory ShoppingListItem.fromJson(Map<String, dynamic> json) =>
      _$ShoppingListItemFromJson(json);
}

/// Response wrapper for shopping list API calls
@freezed
abstract class ShoppingListResponse with _$ShoppingListResponse {
  const factory ShoppingListResponse({
    required ShoppingList list,
  }) = _ShoppingListResponse;

  factory ShoppingListResponse.fromJson(Map<String, dynamic> json) =>
      _$ShoppingListResponseFromJson(json);
}

@freezed
abstract class SetListIdRequest with _$SetListIdRequest {
  const factory SetListIdRequest({
    required String listId,
  }) = _SetListIdRequest;

  factory SetListIdRequest.fromJson(Map<String, Object?> json) =>
      _$SetListIdRequestFromJson(json);
}