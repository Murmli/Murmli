import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/api/provider/api_providers.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/provider/user/user_language_provider.dart';
import 'package:murmli/api/provider/user/shopping_list_sorting_provider.dart';
import 'package:murmli/api/provider/user/user_profile_provider.dart';
import 'package:murmli/core/config/config_provider.dart';
import 'package:murmli/api/models/user_models.dart';
import 'package:murmli/core/storage/secure_storage_provider.dart';

part 'user_data_export_provider.g.dart';

/// Provider für User Data Export/Import Management
@Riverpod(keepAlive: true)
class UserDataExport extends _$UserDataExport {
  @override
  Future<ExportLinkResponse?> build() async {
    // Export Provider startet mit null, da Export nur bei Bedarf gestartet wird
    return null;
  }

  /// Startet den Export der User-Daten
  Future<ExportLinkResponse?> startExport() async {
    try {
      final userApi = ref.read(userApiProvider);
      final response = await userApi.exportUserData(
        apiConfig.secretKey,
        'Bearer ${ref.read(sessionProvider).value ?? ''}',
      );

      state = AsyncValue.data(response.data);
      return response.data;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  /// Lädt die Export-Daten herunter
  Future<dynamic> downloadExportData(String token) async {
    try {
      final userApi = ref.read(userApiProvider);
      final response = await userApi.downloadExportData(token);
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  /// Importiert User-Daten
  Future<ImportUserDataResponse?> importData(Map<String, dynamic> data) async {
    try {
      final userApi = ref.read(userApiProvider);
      final response = await userApi.importUserData(
        apiConfig.secretKey,
        'Bearer ${ref.read(sessionProvider).value ?? ''}',
        data,
      );

      // Handle successful import response
      final importResponse = response.data;
      // Update session token if provided
      if (importResponse.token != null) {
        final storage = ref.read(secureStorageProvider);
        await storage.write(key: sessionTokenKey, value: importResponse.token!);
      }

      // Update language if provided
      if (importResponse.language != null) {
        ref.read(userLanguageProvider.notifier).updateLanguage(importResponse.language!);
      }

      // Update shopping list sorting if provided
      if (importResponse.shoppingListSort != null) {
        ref.read(shoppingListSortingProvider.notifier).updateSorting(importResponse.shoppingListSort!);
      }

      // Invalidate relevant providers to refresh data
      ref.invalidate(sessionProvider);
      ref.invalidate(userLanguageProvider);
      ref.invalidate(shoppingListSortingProvider);
      ref.invalidate(userProfileProvider);
    
      state = AsyncValue.data(null); // Reset nach Import
      return importResponse;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}
