import 'package:auto_route/auto_route.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/core/routes/guards/startup_guard.dart';

@AutoRouterConfig()
class AppRouter extends RootStackRouter {
  AppRouter({super.navigatorKey, required this.startupGuard});

  final StartupGuard startupGuard;
  @override
  List<AutoRoute> get routes => [
    // Initialer Einstieg über Dashboard, geschützt durch StartupGuard
    AutoRoute(page: DashboardRoute.page, initial: true, guards: [startupGuard]),
    AutoRoute(page: HomeRoute.page, guards: [startupGuard]),
    AutoRoute(page: OnboardingRoute.page),
    AutoRoute(page: OnboardingNavigationRoute.page),
    // Optional weitere Views schützen, falls sie Sprache voraussetzen
    AutoRoute(page: SettingsRoute.page, guards: [startupGuard]),
    AutoRoute(page: ShoppingListRoute.page, guards: [startupGuard]),
    AutoRoute(page: RecipesRoute.page, guards: [startupGuard]),
    AutoRoute(page: PlannerRoute.page, guards: [startupGuard]),
    AutoRoute(page: TrackerRoute.page, guards: [startupGuard]),
    AutoRoute(page: TrainingPlanRoute.page, guards: [startupGuard]),
    AutoRoute(page: TrainingLogRoute.page, guards: [startupGuard]),
  ];
}
