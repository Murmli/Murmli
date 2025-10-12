import 'dart:async';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/user_api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/core/config/config_provider.dart';

part 'user_delete_provider.g.dart';

/// Provider für User-Account-Löschung
@Riverpod(keepAlive: true)
class UserDelete extends _$UserDelete {
  @override
  FutureOr<bool> build() async {
    // Delete Provider startet mit false, da Löschung nur bei Bedarf ausgeführt wird
    return false;
  }

  UserApi get _api => ref.read(userApiProvider);

  /// Holt die aktuelle Session für API-Aufrufe
  Future<String> _getAuthToken() async {
    final session = ref.read(sessionProvider.future);
    return await session ?? (throw StateError('No valid session'));
  }

  /// Löscht den User-Account
  Future<bool> deleteAccount() async {
    state = const AsyncLoading();
    try {
      final token = await _getAuthToken();
      await _api.deleteUser(
        apiConfig.secretKey,
        'Bearer $token',
      );

      state = AsyncData(true);
      return true;
    } catch (err, st) {
      state = AsyncError(err, st);
      return false;
    }
  }
}
