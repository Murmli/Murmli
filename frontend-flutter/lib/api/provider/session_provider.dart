import 'dart:async';
import 'package:dio/dio.dart';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/session_api.dart';
import 'package:murmli/core/provider/toast_provider.dart';
import 'package:murmli/i18n/translations.g.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/core/config/config_provider.dart';
import 'package:murmli/core/storage/preferences_provider.dart';
import 'package:murmli/core/storage/secure_storage_provider.dart';

part 'session_provider.g.dart';

/// Hält und (re)erstellt die Session (JWT Token) bei Bedarf.
@Riverpod(keepAlive: true)
class Session extends _$Session {
  @override
  FutureOr<String?> build() async {
    // Token aus Secure Storage laden
    final storage = ref.read(secureStorageProvider);
    final existing = await storage.read(key: sessionTokenKey);
    if (existing != null && existing.isNotEmpty) {
      return existing;
    }
    return null;
  }

  SessionApi get _api => ref.read(sessionApiProvider);

  /// Stellt sicher, dass eine gültige Session vorhanden ist.
  /// - Wenn kein Token vorhanden, wird eines erstellt.
  /// - Wenn ein Token vorhanden ist, wird es via /login validiert.
  ///   Bei 401/404 wird automatisch neu erstellt.
  Future<String?> ensureValidSession({String? language}) async {
    final lang =
        language ??
        await ref.read(preferredLanguageProvider.future) ??
        apiConfig.defaultLanguage;
    final current = state.value;

    // Noch keine Session → erstellen
    if (current == null) {
      return _createSession(lang);
    }

    // Vorhandene Session → validieren (nur wenn nötig)
    try {
      await _api.login(apiConfig.secretKey, 'Bearer $current');
      showToastSuccess(
        t.settings.session_validated,
        t.settings.session_validated_message,
      );
      // 200 OK → gültig
      return current;
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 404) {
        // ungültig → neu erstellen
        print('Session ungültig (${status}), erstelle neue Session');
        return _createSession(lang);
      }
      // andere Fehler → im Status abbilden und null zurückgeben
      print('Session-Validierung fehlgeschlagen: ${e.message}');
      state = AsyncError(e, StackTrace.current);
      return null;
    } catch (e) {
      // Unerwartete Fehler
      print('Unerwarteter Fehler bei Session-Validierung: $e');
      state = AsyncError(e, StackTrace.current);
      return null;
    }
  }

  Future<String?> _createSession(String language) async {
    state = const AsyncLoading();
    try {
      final resp = await _api.createSession(apiConfig.secretKey, {
        'language': language,
      });
      final data = resp.data as Map<String, dynamic>?;
      final newToken = data?['token'] as String?;
      if (newToken == null || newToken.isEmpty) {
        throw StateError('Kein Token in der Antwort erhalten');
      }
      // Token persistieren
      final storage = ref.read(secureStorageProvider);
      await storage.write(key: sessionTokenKey, value: newToken);
      state = AsyncData(newToken);
      return newToken;
    } catch (err, st) {
      state = AsyncError(err, st);
      return null;
    }
  }
}
