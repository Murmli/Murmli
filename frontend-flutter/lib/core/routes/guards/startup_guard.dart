import 'package:auto_route/auto_route.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/core/storage/preferences_provider.dart';
import 'package:riverpod/riverpod.dart';

/// Guard entscheidet anhand der gespeicherten Sprache,
/// ob zur Onboarding- oder Home-Route navigiert wird.
class StartupGuard extends AutoRouteGuard {
  StartupGuard(this._container);
  final ProviderContainer _container;

  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    final lang = await _container.read(preferredLanguageProvider.future);
    print(lang);

    if (lang == null || lang.isEmpty) {
      // Keine Sprache gesetzt -> zum Onboarding leiten
      resolver.redirectUntil(const OnboardingRoute());
      return;
    }

    // Sprache gesetzt -> Navigation fortsetzen
    resolver.next(true);
  }
}
