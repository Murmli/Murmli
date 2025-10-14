import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/provider/user/user_providers.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/core/storage/preferences_provider.dart';
import 'package:murmli/core/storage/secure_storage_provider.dart';
import 'package:murmli/features/dashboard/provider/bottom_nav_provider.dart';
import 'package:murmli/i18n/translations.g.dart';
import '../dialogs/settings_dialogs.dart';

class DangerZoneSection extends ConsumerWidget {
  const DangerZoneSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ElevatedButton.icon(
          icon: const Icon(Icons.delete_forever),
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.error,
            foregroundColor: Theme.of(context).colorScheme.onError,
          ),
          onPressed: () => SettingsDialogs.showDeleteDataDialog(context, ref),
          label: Text(t.settings.danger_zone.delete_all_data),
        ),
      ],
    );
  }
}

class DangerZoneActions {
  static Future<void> deleteAllData(BuildContext context, WidgetRef ref) async {
    try {
      // 1) Backend-Account löschen
      final deleteSuccess = await ref
          .read(userDeleteProvider.notifier)
          .deleteAccount();

      if (!deleteSuccess) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(t.settings.account_deletion_failed),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
        return;
      }

      // 2) SharedPreferences leeren (Sprache)
      await ref.read(preferredLanguageProvider.notifier).clear();

      // 3) Bottom Navigation Konfiguration zurücksetzen
      await ref.read(bottomNavConfigProvider.notifier).resetToDefault();

      // 4) Secure Storage leeren (Session Token etc.)
      final storage = ref.read(secureStorageProvider);
      await storage.deleteAll();

      // 5) Provider-States zurücksetzen
      ref.invalidate(sessionProvider);
      ref.invalidate(userIdProvider);
      ref.invalidate(userLanguageProvider);
      ref.invalidate(bottomNavConfigProvider);
      ref.invalidate(bottomNavActiveIndexProvider);

      // 6) Zur Onboarding-Route wechseln
      if (context.mounted) {
        try {
          // Verwende replaceAll um alle Routen zu ersetzen
          context.router.replaceAll([const OnboardingRoute()]);
        } catch (navigationError) {
          // Falls AutoRoute Probleme macht, verwende den Standard Navigator
          Navigator.of(context).pushNamedAndRemoveUntil(
            '/onboarding',
            (route) => false,
          );
        }
      }
    } catch (e) {
      // Fehlerbehandlung
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.messages.error_deleting_data.replaceAll(
                '{error}',
                e.toString(),
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
}
