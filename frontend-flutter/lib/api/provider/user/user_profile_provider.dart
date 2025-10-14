import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/core/config/config_provider.dart';
import 'package:murmli/api/models/user_models.dart';

part 'user_profile_provider.g.dart';

/// Provider für User Profile Management
@Riverpod(keepAlive: true)
class UserProfile extends _$UserProfile {
  @override
  Future<UserProfileResponse?> build() async {
    // Automatisch das User Profile laden
    try {
      final userApi = ref.read(userApiProvider);
      final token = await _getAuthToken();
      final response = await userApi.getUserProfile(
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

  /// Lädt das User Profile vom Backend
  Future<UserProfileResponse?> loadProfile() async {
    try {
      final userApi = ref.read(userApiProvider);
      final token = await _getAuthToken();
      final response = await userApi.getUserProfile(
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

  /// Aktualisiert das User Profile
  Future<UserProfileResponse?> updateProfile(
    UpdateUserProfileRequest request,
  ) async {
    try {
      final userApi = ref.read(userApiProvider);
      final token = await _getAuthToken();
      final response = await userApi.updateUserProfile(
        apiConfig.secretKey,
        'Bearer $token',
        request,
      );

      // Profile neu laden nach Update
      await loadProfile();
      return response.data;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  /// Löscht das User Profile (Account)
  Future<bool> deleteProfile() async {
    try {
      final userApi = ref.read(userApiProvider);
      final token = await _getAuthToken();
      await userApi.deleteUser(
        apiConfig.secretKey,
        'Bearer $token',
      );

      // State zurücksetzen
      state = const AsyncValue.data(null);
      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }
}
