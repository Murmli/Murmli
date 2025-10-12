import 'dart:async';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/user_api.dart';
import 'package:murmli/api/models/user_models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/core/config/config_provider.dart';

part 'user_role_provider.g.dart';

/// Provider für User-Rolle
@Riverpod(keepAlive: true)
class UserRole extends _$UserRole {
  @override
  FutureOr<UserRoleResponse?> build() async {
    // Automatisch die User-Rolle laden
    try {
      final token = await _getAuthToken();
      final response = await _api.getUserRole(
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

  /// Lädt die Rolle des Users
  Future<UserRoleResponse> loadRole() async {
    state = const AsyncLoading();
    try {
      final token = await _getAuthToken();
      final response = await _api.getUserRole(
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

  /// Prüft, ob der User Administrator ist
  bool isAdmin() {
    final role = state.value?.role;
    return role == 'administrator';
  }

  /// Prüft, ob der User Premium ist
  bool isPremium() {
    final role = state.value?.role;
    return role == 'premium' || role == 'administrator';
  }

  /// Prüft, ob der User ein kostenloser User ist
  bool isFreeUser() {
    final role = state.value?.role;
    return role == 'freeuser';
  }
}
