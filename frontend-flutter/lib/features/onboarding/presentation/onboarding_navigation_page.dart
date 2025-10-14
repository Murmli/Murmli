import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/core/storage/app_preferences.dart';
import 'package:murmli/features/dashboard/provider/bottom_nav_provider.dart';
import 'package:murmli/components/bottom_nav_reorderable_list.dart';
import 'package:murmli/i18n/translations.g.dart';
import 'package:murmli/core/routes/app_router.gr.dart';

@RoutePage()
class OnboardingNavigationPage extends ConsumerWidget {
  const OnboardingNavigationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottomNavNotifier = ref.read(bottomNavConfigProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Text(t.onboarding.navigation_setup.title),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.onboarding.navigation_setup.description,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 24),

                  // Wiederverwendbare Reorderable List
                  const BottomNavReorderableList(),
                ],
              ),
            ),
          ),

          // Bottom buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        bottomNavNotifier.resetToDefault();
                      },
                      child: Text(t.onboarding.navigation_setup.reset),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: () async {
                        // Markiere Onboarding als abgeschlossen
                        await AppPreferences().setOnboardingCompleted(true);
                        // Weiter zur Dashboard-Seite
                        if (context.mounted) {
                          context.router.replaceAll([const DashboardRoute()]);
                        }
                      },
                      child: Text(t.onboarding.navigation_setup.continue_button),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
