import 'package:auto_route/auto_route.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/core/storage/app_preferences.dart';

/// Guard entscheidet anhand der gespeicherten Sprache und Onboarding-Status,
/// ob zur Onboarding- oder Dashboard-Route navigiert wird.
class StartupGuard extends AutoRouteGuard {
  StartupGuard();

  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    final lang = await AppPreferences().getLanguage();
    final onboardingCompleted = await AppPreferences().getOnboardingCompleted();

    print(
      'StartupGuard - Language: $lang, Onboarding completed: $onboardingCompleted',
    );

    // Wenn Sprache nicht gesetzt oder Onboarding nicht abgeschlossen -> zum Onboarding
    if (lang == null || lang.isEmpty || !onboardingCompleted) {
      resolver.redirectUntil(const OnboardingRoute());
      return;
    }

    // Alles OK -> Navigation fortsetzen
    resolver.next(true);
  }
}
