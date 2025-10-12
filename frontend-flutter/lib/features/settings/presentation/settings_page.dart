import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/core/i18n/current_locale_provider.dart';
import 'package:murmli/i18n/translations.g.dart';
import 'widgets/user_info_section.dart';
import 'widgets/language_section.dart';
import 'widgets/shopping_list_section.dart';
import 'widgets/data_management_section.dart';
import 'widgets/danger_zone_section.dart';
import 'widgets/collapsible_settings_section.dart';
import 'widgets/bottom_navigation_section.dart';

@RoutePage()
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Überwache die aktuelle Sprache, um bei Änderungen neu zu bauen
    ref.watch(currentLocaleProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(t.settings.title),
        actions: [
          IconButton(
            icon: Icon(Icons.question_mark),
            onPressed: () async {
              showAboutDialog(
                context: context,
                applicationName: t.app.name,
                applicationVersion: "1.0.0",
                applicationIcon: const Icon(Icons.app_registration),
                children: [
                  Text(t.app.description),
                ],
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Benutzer-Informationen
            CollapsibleSettingsSection(
              title: t.settings.user_info,
              icon: Icons.person,
              initiallyExpanded: true,
              child: const UserInfoSection(),
            ),
            const SizedBox(height: 16),

            // Spracheinstellungen
            CollapsibleSettingsSection(
              title: t.settings.language.title,
              icon: Icons.language,
              initiallyExpanded: true,
              child: const LanguageSection(),
            ),
            const SizedBox(height: 16),

            // Einkaufsliste-Einstellungen
            CollapsibleSettingsSection(
              title: t.settings.shopping_list_settings,
              icon: Icons.shopping_cart_outlined,
              initiallyExpanded: false,
              child: const ShoppingListSection(),
            ),
            const SizedBox(height: 16),

            // Bottom Navigation Einstellungen
            CollapsibleSettingsSection(
              title: t.settings.bottom_navigation,
              icon: Icons.navigation,
              initiallyExpanded: false,
              child: const BottomNavigationSection(),
            ),
            const SizedBox(height: 16),

            // Datenexport/-import
            CollapsibleSettingsSection(
              title: t.settings.data_management,
              icon: Icons.storage,
              initiallyExpanded: false,
              child: const DataManagementSection(),
            ),
            const SizedBox(height: 16),

            // Gefährliche Aktionen
            CollapsibleSettingsSection(
              title: t.settings.danger_zone.title,
              icon: Icons.warning,
              initiallyExpanded: false,
              backgroundColor: Theme.of(
                context,
              ).colorScheme.errorContainer.withValues(alpha: 0.1),
              iconColor: Theme.of(context).colorScheme.error,
              child: const DangerZoneSection(),
            ),
          ],
        ),
      ),
    );
  }
}
