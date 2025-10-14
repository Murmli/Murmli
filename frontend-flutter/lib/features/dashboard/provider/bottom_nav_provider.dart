import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/features/dashboard/presentation/dashboard_page.dart';
import 'package:murmli/core/storage/preferences_provider.dart';
import 'dart:convert';

part 'bottom_nav_provider.g.dart';

const _kBottomNavConfig = 'bottom_nav_config';
const _kBottomNavActiveIndex = 'bottom_nav_active_index';

// Providers für Bottom Navigation
@Riverpod(keepAlive: true)
class BottomNavConfig extends _$BottomNavConfig {
  @override
  Future<List<BottomNavItem>> build() async {
    try {
      final prefs = ref.read(sharedPrefsProvider);
      final configJson = await prefs.getString(_kBottomNavConfig);
      
      if (configJson != null) {
        try {
          final List<dynamic> configList = json.decode(configJson) as List<dynamic>;
          
          // Check if old format with icon/activeIcon fields exists
          final firstItem = configList.firstOrNull as Map<String, dynamic>?;
          if (firstItem != null && (firstItem.containsKey('icon') || firstItem.containsKey('activeIcon'))) {
            // Old format detected - clear and use default
            await prefs.remove(_kBottomNavConfig);
            await prefs.remove(_kBottomNavActiveIndex);
            return defaultBottomNavConfig;
          }
          
          final loadedConfig = configList.map((item) => BottomNavItem.fromJson(item as Map<String, dynamic>)).toList();
          
          // Prüfe ob die geladene Konfiguration noch Settings enthält (alte Version)
          final hasSettings = loadedConfig.any((item) => item.route.name == 'settings');
          if (hasSettings) {
            // Alte Konfiguration mit Settings gefunden - zurücksetzen
            await prefs.remove(_kBottomNavConfig);
            await prefs.remove(_kBottomNavActiveIndex);
            return defaultBottomNavConfig;
          }
          
          return loadedConfig;
        } catch (e) {
          // Fallback zu default config bei Parsing-Fehler
          await prefs.remove(_kBottomNavConfig);
          await prefs.remove(_kBottomNavActiveIndex);
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
    final prefs = ref.read(sharedPrefsProvider);
    final configJson = json.encode(newConfig.map((item) => item.toJson()).toList());
    await prefs.setString(_kBottomNavConfig, configJson);
    state = AsyncData(newConfig);
  }
  
  Future<void> resetToDefault() async {
    final prefs = ref.read(sharedPrefsProvider);
    await prefs.remove(_kBottomNavConfig);
    await prefs.remove(_kBottomNavActiveIndex);
    state = AsyncData(defaultBottomNavConfig);
  }
}

@Riverpod(keepAlive: true)
class BottomNavActiveIndex extends _$BottomNavActiveIndex {
  @override
  Future<int> build() async {
    final prefs = ref.read(sharedPrefsProvider);
    return await prefs.getInt(_kBottomNavActiveIndex) ?? 0;
  }
  
  Future<void> setIndex(int index) async {
    final prefs = ref.read(sharedPrefsProvider);
    await prefs.setInt(_kBottomNavActiveIndex, index);
    state = AsyncData(index);
  }
}
