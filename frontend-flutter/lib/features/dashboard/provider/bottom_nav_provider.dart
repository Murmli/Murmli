import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/features/dashboard/presentation/dashboard_page.dart';
import 'package:murmli/core/storage/app_preferences.dart';
import 'dart:convert';

part 'bottom_nav_provider.g.dart';

final _prefs = AppPreferences();

// Providers für Bottom Navigation
@Riverpod(keepAlive: true)
class BottomNavConfig extends _$BottomNavConfig {
  @override
  Future<List<BottomNavItem>> build() async {
    try {
      final configJson = await _prefs.getBottomNavConfig();
      
      if (configJson != null) {
        try {
          final List<dynamic> configList = json.decode(configJson) as List<dynamic>;
          
          // Check if old format with icon/activeIcon fields exists
          final firstItem = configList.firstOrNull as Map<String, dynamic>?;
          if (firstItem != null && (firstItem.containsKey('icon') || firstItem.containsKey('activeIcon'))) {
            // Old format detected - clear and use default
            await _prefs.clearBottomNavConfig();
            await _prefs.clearBottomNavActiveIndex();
            return defaultBottomNavConfig;
          }
          
          final loadedConfig = configList.map((item) => BottomNavItem.fromJson(item as Map<String, dynamic>)).toList();
          
          // Prüfe ob die geladene Konfiguration noch Settings enthält (alte Version)
          final hasSettings = loadedConfig.any((item) => item.route.name == 'settings');
          if (hasSettings) {
            // Alte Konfiguration mit Settings gefunden - zurücksetzen
            await _prefs.clearBottomNavConfig();
            await _prefs.clearBottomNavActiveIndex();
            return defaultBottomNavConfig;
          }
          
          return loadedConfig;
        } catch (e) {
          // Fallback zu default config bei Parsing-Fehler
          await _prefs.clearBottomNavConfig();
          await _prefs.clearBottomNavActiveIndex();
          return defaultBottomNavConfig;
        }
      }
      
      return defaultBottomNavConfig;
    } catch (e) {
      // Ultimate fallback - ensure we always return something valid
      return defaultBottomNavConfig;
    }
  }
  
  Future<void> updateConfig(List<BottomNavItem> newConfig) async {
    final configJson = json.encode(newConfig.map((item) => item.toJson()).toList());
    await _prefs.setBottomNavConfig(configJson);
    state = AsyncData(newConfig);
  }
  
  Future<void> resetToDefault() async {
    await _prefs.clearBottomNavConfig();
    await _prefs.clearBottomNavActiveIndex();
    state = AsyncData(defaultBottomNavConfig);
  }
}

@Riverpod(keepAlive: true)
class BottomNavActiveIndex extends _$BottomNavActiveIndex {
  @override
  Future<int> build() async {
    return await _prefs.getBottomNavActiveIndex() ?? 0;
  }
  
  Future<void> setIndex(int index) async {
    await _prefs.setBottomNavActiveIndex(index);
    state = AsyncData(index);
  }
}
