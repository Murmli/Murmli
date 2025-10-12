import 'dart:async';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/user_api.dart';
import 'package:murmli/api/models/user_models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/core/config/config_provider.dart';

part 'shopping_list_categories_provider.g.dart';

/// Provider für Einkaufsliste-Kategorien
@Riverpod(keepAlive: true)
class ShoppingListCategories extends _$ShoppingListCategories {
  @override
  FutureOr<ShoppingCategoriesResponse?> build() async {
    // Automatisch die Einkaufsliste-Kategorien laden
    try {
      final token = await _getAuthToken();
      final response = await _api.readShoppingListCategories(
        apiConfig.secretKey,
        'Bearer $token',
      );

      return response.data;
    } catch (err) {
      rethrow;
    }
  }

  UserApi get _api => ref.read(userApiProvider);

  /// Holt die aktuelle Session für API-Aufrufe
  Future<String> _getAuthToken() async {
    final session = ref.read(sessionProvider.future);
    return await session ?? (throw StateError('No valid session'));
  }

  /// Lädt die Einkaufsliste-Kategorien
  Future<ShoppingCategoriesResponse> loadCategories() async {
    state = const AsyncLoading();
    try {
      final token = await _getAuthToken();
      final response = await _api.readShoppingListCategories(
        apiConfig.secretKey,
        'Bearer $token',
      );

      state = AsyncData(response.data);
      return response.data;
    } catch (err, st) {
      state = AsyncError(err, st);
      rethrow;
    }
  }

  /// Lädt die Kategorien neu
  Future<void> refreshCategories() async {
    await loadCategories();
  }

  /// Gibt die aktuelle Kategorien-Liste zurück
  List<ShoppingCategory>? getCurrentCategories() {
    return state.value?.categories;
  }

  /// Sucht eine Kategorie nach ID
  ShoppingCategory? findCategoryById(String id) {
    final categories = getCurrentCategories();
    if (categories == null) return null;

    try {
      return categories.firstWhere((cat) => cat.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Sucht eine Kategorie nach Name
  ShoppingCategory? findCategoryByName(String name) {
    final categories = getCurrentCategories();
    if (categories == null) return null;

    try {
      return categories.firstWhere((cat) => cat.name == name);
    } catch (e) {
      return null;
    }
  }
}
