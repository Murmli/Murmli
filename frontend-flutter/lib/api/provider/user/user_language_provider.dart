import 'dart:async';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/user_api.dart';
import 'package:murmli/api/models/user_models.dart';
import 'package:murmli/core/storage/app_preferences.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/core/config/config_provider.dart';

part 'user_language_provider.g.dart';

/// Provider für User-Spracheinstellungen
@Riverpod(keepAlive: true)
class UserLanguage extends _$UserLanguage {
  @override
  FutureOr<UserLanguageResponse?> build() async {
    // Automatisch die User-Sprache laden
    try {
      final token = await _getAuthToken();
      final response = await _api.getLanguage(
        apiConfig.secretKey,
        'Bearer $token',
      );

      // Synchronisiere lokale Sprache mit Server-Sprache
      await _syncLocalLanguage(response.data.language);

      return response.data;
    } catch (err) {
      rethrow;
    }
  }

  UserApi get _api => ref.read(userApiProvider);

  /// Holt die aktuelle Session für API-Aufrufe
  Future<String> _getAuthToken() async {
    // Stelle sicher, dass eine gültige Session vorhanden ist
    final token = await ref.read(sessionProvider.notifier).ensureValidSession();
    if (token == null || token.isEmpty) {
      throw StateError('No valid session');
    }
    return token;
  }

  /// Lädt die aktuelle Sprache des Users
  Future<UserLanguageResponse> loadLanguage() async {
    state = const AsyncLoading();
    try {
      final token = await _getAuthToken();
      final response = await _api.getLanguage(
        apiConfig.secretKey,
        'Bearer $token',
      );

      state = AsyncData(response.data);

      // Synchronisiere lokale Sprache mit Server-Sprache
      await _syncLocalLanguage(response.data.language);

      return response.data;
    } catch (err, st) {
      state = AsyncError(err, st);
      rethrow;
    }
  }

  /// Aktualisiert die Sprache des Users
  Future<void> updateLanguage(String language, {String? timezone}) async {
    try {
      final token = await _getAuthToken();
      final request = SetLanguageRequest(
        language: language,
        timezone: timezone,
      );

      await _api.setLanguage(
        apiConfig.secretKey,
        'Bearer $token',
        request,
      );

      // State aktualisieren mit neuer Sprache
      state = AsyncData(UserLanguageResponse(language: language));

      // Synchronisiere lokale Sprache mit Server-Sprache
      await _syncLocalLanguage(language);
    } catch (err, st) {
      state = AsyncError(err, st);
      rethrow;
    }
  }

  /// Synchronisiert die lokale Sprache mit der Server-Sprache
  Future<void> _syncLocalLanguage(String serverLanguage) async {
    try {
      await AppPreferences().setLanguage(serverLanguage);
    } catch (e) {
      // Fehler bei der lokalen Synchronisation ignorieren
      // da dies nicht kritisch ist
    }
  }
}
