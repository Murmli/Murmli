import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/core/storage/preferences_provider.dart';
import 'package:murmli/components/language_selector.dart';
import 'package:murmli/core/i18n/current_locale_provider.dart';
import 'package:murmli/i18n/translations.g.dart';
import 'package:murmli/core/routes/app_router.gr.dart';

@RoutePage()
class OnboardingPage extends ConsumerWidget {
  const OnboardingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Überwache die aktuelle Sprache, um bei Änderungen neu zu bauen
    ref.watch(currentLocaleProvider);

    Future<void> choose(String lang) async {
      await ref.read(preferredLanguageProvider.notifier).set(lang);
      // Aktualisiere die aktuelle Locale sofort für UI-Update
      ref.read(currentLocaleProvider.notifier).updateLocaleFromString(lang);
      // Backend wird jetzt lazy geladen, nicht mehr beim Onboarding
      if (context.mounted) {
        context.router.replaceAll([const HomeRoute()]);
      }
    }

    return Scaffold(
      appBar: AppBar(title: Text(t.onboarding.title)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(t.onboarding.choose_language),
            const SizedBox(height: 16),
            LanguageSelector(
              currentLanguage: 'de', // Default language
              onLanguageChanged: (String newLanguage) {
                choose(newLanguage);
              },
              showTitle: false,
              showSnackbar: false,
              compact: true,
              searchable: true,
            ),
          ],
        ),
      ),
    );
  }
}
