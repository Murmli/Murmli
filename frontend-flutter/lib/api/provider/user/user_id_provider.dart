import 'dart:async';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/user_api.dart';
import 'package:murmli/api/models/user_models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/core/config/config_provider.dart';

part 'user_id_provider.g.dart';

/// Provider für User-ID
@Riverpod(keepAlive: true)
class UserId extends _$UserId {
  @override
  FutureOr<UserIdResponse?> build() async {
    // Automatisch die User-ID laden
    try {
      final token = await _getAuthToken();
      final response = await _api.getUserId(
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

  /// Lädt die ID des Users
  Future<UserIdResponse> loadId() async {
    state = const AsyncLoading();
    try {
      final token = await _getAuthToken();
      final response = await _api.getUserId(
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

  /// Gibt die aktuelle User-ID zurück
  String? getCurrentId() {
    return state.value?.id;
  }
}
