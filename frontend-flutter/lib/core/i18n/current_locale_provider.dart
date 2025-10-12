import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/i18n/translations.g.dart';

part 'current_locale_provider.g.dart';

/// Provider für die aktuelle Sprache, der auf Änderungen reagiert
@Riverpod(keepAlive: true)
class CurrentLocale extends _$CurrentLocale {
  @override
  AppLocale build() {
    // Initiale Locale aus Slang laden
    return LocaleSettings.currentLocale;
  }

  /// Aktualisiert die aktuelle Locale und triggert einen Rebuild
  void updateLocale(AppLocale newLocale) {
    LocaleSettings.setLocale(newLocale);
    state = newLocale;
  }

  /// Aktualisiert die aktuelle Locale basierend auf einem String-Code
  void updateLocaleFromString(String localeCode) {
    final appLocale = AppLocaleUtils.parse(localeCode);
    updateLocale(appLocale);
  }
}
