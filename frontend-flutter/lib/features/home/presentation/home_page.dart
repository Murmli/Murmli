import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/core/i18n/current_locale_provider.dart';
import 'package:murmli/i18n/translations.g.dart';

@RoutePage()
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Überwache die aktuelle Sprache, um bei Änderungen neu zu bauen
    ref.watch(currentLocaleProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(t.home.title),
        actions: [
          IconButton(
            icon: Icon(Icons.settings),
            onPressed: () {
              AutoRouter.of(context).push(SettingsRoute());
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.home,
              size: 64,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              t.home.welcome,
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              t.home.welcome_subtitle,
              style: Theme.of(context).textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              icon: const Icon(Icons.settings),
              onPressed: () {
                AutoRouter.of(context).push(SettingsRoute());
              },
              label: Text(t.home.go_to_settings),
            ),
          ],
        ),
      ),
    );
  }
}
