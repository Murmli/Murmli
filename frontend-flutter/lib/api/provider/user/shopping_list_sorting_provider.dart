import 'dart:async';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/user_api.dart';
import 'package:murmli/api/models/user_models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/core/config/config_provider.dart';

part 'shopping_list_sorting_provider.g.dart';

/// Provider für Einkaufsliste-Sortierung
@Riverpod(keepAlive: true)
class ShoppingListSorting extends _$ShoppingListSorting {
  @override
  FutureOr<ShoppingListSortingResponse?> build() async {
    // Automatisch die Einkaufsliste-Sortierung laden
    try {
      final token = await _getAuthToken();
      final response = await _api.getShoppingListSorting(
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

  /// Lädt die aktuelle Einkaufsliste-Sortierung
  Future<ShoppingListSortingResponse> loadSorting() async {
    state = const AsyncLoading();
    try {
      final token = await _getAuthToken();
      final response = await _api.getShoppingListSorting(
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

  /// Aktualisiert die Einkaufsliste-Sortierung
  Future<void> updateSorting(List<int> sort) async {
    try {
      final token = await _getAuthToken();
      final request = SetShoppingListSortingRequest(sort: sort);

      // API-Aufruf zuerst
      await _api.setShoppingListSorting(
        apiConfig.secretKey,
        'Bearer $token',
        request,
      );

      // Nach erfolgreichem API-Aufruf die neue Sortierung vom Server laden
      await loadSorting();
    } catch (err, st) {
      state = AsyncError(err, st);
      rethrow;
    }
  }

  /// Gibt die aktuelle Sortierung zurück
  List<ShoppingCategorySort>? getCurrentSorting() {
    return state.value?.categories;
  }

  /// Gibt die aktuellen Kategorienamen als String-Liste zurück
  List<String>? getCurrentSortingNames() {
    return state.value?.categories.map((category) => category.name).toList();
  }
}
