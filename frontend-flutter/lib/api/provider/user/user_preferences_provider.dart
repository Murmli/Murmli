import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/core/config/config_provider.dart';
import 'package:murmli/api/models/user_models.dart';

part 'user_preferences_provider.g.dart';

/// Provider für User Preferences Management
@Riverpod(keepAlive: true)
class UserPreferences extends _$UserPreferences {
  @override
  Future<UserPreferencesResponse?> build() async {
    // Automatisch die User Preferences laden
    try {
      final userApi = ref.read(userApiProvider);
      final token = await _getAuthToken();
      final response = await userApi.getUserPreferences(
        apiConfig.secretKey,
        'Bearer $token',
      );

      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  /// Holt die aktuelle Session für API-Aufrufe
  Future<String> _getAuthToken() async {
    // Stelle sicher, dass eine gültige Session vorhanden ist
    final token = await ref.read(sessionProvider.notifier).ensureValidSession();
    if (token == null || token.isEmpty) {
      throw StateError('No valid session');
    }
    return token;
  }

  /// Lädt die User Preferences vom Backend
  Future<UserPreferencesResponse?> loadPreferences() async {
    try {
      final userApi = ref.read(userApiProvider);
      final token = await _getAuthToken();
      final response = await userApi.getUserPreferences(
        apiConfig.secretKey,
        'Bearer $token',
      );

      state = AsyncValue.data(response.data);
      return response.data;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  /// Aktualisiert die User Preferences
  Future<UserPreferencesResponse?> updatePreferences(
    UpdateUserPreferencesRequest request,
  ) async {
    try {
      final userApi = ref.read(userApiProvider);
      final token = await _getAuthToken();
      final response = await userApi.updateUserPreferences(
        apiConfig.secretKey,
        'Bearer $token',
        request,
      );

      // Preferences neu laden nach Update
      await loadPreferences();
      return response.data;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}
