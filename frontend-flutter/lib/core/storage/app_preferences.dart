import 'package:shared_preferences/shared_preferences.dart';

const _kPreferredLanguage = 'preferred_language';
const _kOnboardingCompleted = 'onboarding_completed';
const _kBottomNavConfig = 'bottom_nav_config';
const _kBottomNavActiveIndex = 'bottom_nav_active_index';

class AppPreferences {
  final SharedPreferencesAsync _sharedPreferences = SharedPreferencesAsync();

  AppPreferences();

  // Language
  Future<String?> getLanguage() async {
    return await _sharedPreferences.getString(_kPreferredLanguage);
  }

  Future<void> setLanguage(String language) async {
    await _sharedPreferences.setString(_kPreferredLanguage, language);
  }

  Future<void> clearLanguage() async {
    await _sharedPreferences.remove(_kPreferredLanguage);
  }

  // Onboarding Completed
  Future<bool> getOnboardingCompleted() async {
    return await _sharedPreferences.getBool(_kOnboardingCompleted) ?? false;
  }

  Future<void> setOnboardingCompleted(bool completed) async {
    await _sharedPreferences.setBool(_kOnboardingCompleted, completed);
  }
  
  Future<void> clearOnboardingCompleted() async {
    await _sharedPreferences.remove(_kOnboardingCompleted);
  }

  // Bottom Navigation Config
  Future<String?> getBottomNavConfig() async {
    return await _sharedPreferences.getString(_kBottomNavConfig);
  }

  Future<void> setBottomNavConfig(String configJson) async {
    await _sharedPreferences.setString(_kBottomNavConfig, configJson);
  }

  Future<void> clearBottomNavConfig() async {
    await _sharedPreferences.remove(_kBottomNavConfig);
  }

  // Bottom Navigation Active Index
  Future<int?> getBottomNavActiveIndex() async {
    return await _sharedPreferences.getInt(_kBottomNavActiveIndex);
  }

  Future<void> setBottomNavActiveIndex(int index) async {
    await _sharedPreferences.setInt(_kBottomNavActiveIndex, index);
  }

  Future<void> clearBottomNavActiveIndex() async {
    await _sharedPreferences.remove(_kBottomNavActiveIndex);
  }

  // Clear all
  Future<void> clearAll() async {
    await _sharedPreferences.clear();
  }
}
