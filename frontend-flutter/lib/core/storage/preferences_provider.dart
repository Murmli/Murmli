import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'preferences_provider.g.dart';

const _kPreferredLanguage = 'preferred_language';

@Riverpod(keepAlive: true)
SharedPreferencesAsync sharedPrefs(Ref ref) {
  return SharedPreferencesAsync();
}

@Riverpod(keepAlive: true)
class PreferredLanguage extends _$PreferredLanguage {
  @override
  Future<String?> build() {
    final prefs = ref.read(sharedPrefsProvider);
    return prefs.getString(_kPreferredLanguage);
  }

  Future<void> set(String language) async {
    final prefs = ref.read(sharedPrefsProvider);
    await prefs.setString(_kPreferredLanguage, language);
    state = AsyncData(language);
  }

  Future<void> clear() async {
    final prefs = ref.read(sharedPrefsProvider);
    // Entfernt die gespeicherte Sprache
    await prefs.remove(_kPreferredLanguage);
    state = const AsyncData(null);
  }
}
