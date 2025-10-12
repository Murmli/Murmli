import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/i18n/translations.g.dart';
import 'package:murmli/api/provider/user/user_providers.dart';

part 'locale_sync_provider.g.dart';

/// Provider für die Synchronisation zwischen Backend-Sprache und Slang-Locale
@Riverpod(keepAlive: true)
class LocaleSync extends _$LocaleSync {
  @override
  FutureOr<void> build() async {
    // Initialisierung - lade Backend-Sprache und setze Slang-Locale
    await _syncFromBackend();
  }

  /// Synchronisiert die Slang-Locale mit der Backend-Sprache
  Future<void> _syncFromBackend() async {
    try {
      final userLanguage = ref.read(userLanguageProvider);
      await userLanguage.when(
        data: (languageResponse) async {
          if (languageResponse?.language != null) {
            try {
              final appLocale = AppLocaleUtils.parse(languageResponse!.language);
              LocaleSettings.setLocale(appLocale);
            } catch (e) {
              // Ungültiger Locale-Code, ignorieren
            }
          }
        },
        loading: () async {},
        error: (_, __) async {},
      );
    } catch (e) {
      // Fehler ignorieren - verwende Standard-Locale
    }
  }

  /// Synchronisiert die Backend-Sprache mit der Slang-Locale
  Future<void> syncToBackend(String localeKey) async {
    try {
      // Backend aktualisieren
      await ref.read(userLanguageProvider.notifier).updateLanguage(localeKey);

      // Slang-Locale setzen
      final appLocale = AppLocaleUtils.parse(localeKey);
      LocaleSettings.setLocale(appLocale);
    } catch (e) {
      rethrow;
    }
  }

  /// Lädt die aktuelle Slang-Locale
  AppLocale getCurrentSlangLocale() => LocaleSettings.currentLocale;

  /// Lädt die aktuelle Slang-Locale als String
  String getCurrentSlangLocaleString() => getCurrentSlangLocale().languageCode;
}
