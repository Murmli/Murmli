import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/features/shopping_list/presentation/shopping_list_page.dart';
import 'package:murmli/features/recipes/presentation/recipes_page.dart';
import 'package:murmli/features/planner/presentation/planner_page.dart';
import 'package:murmli/features/tracker/presentation/tracker_page.dart';
import 'package:murmli/features/training_plan/presentation/training_plan_page.dart';
import 'package:murmli/features/training_log/presentation/training_log_page.dart';
import 'package:murmli/features/dashboard/provider/bottom_nav_provider.dart';
import 'package:murmli/i18n/translations.g.dart';

@RoutePage()
class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottomNavConfigAsync = ref.watch(bottomNavConfigProvider);
    final activeIndexAsync = ref.watch(bottomNavActiveIndexProvider);

    return bottomNavConfigAsync.when(
      data: (bottomNavConfig) => activeIndexAsync.when(
        data: (activeIndex) {
          final enabledItems = bottomNavConfig
              .where((BottomNavItem item) => item.enabled)
              .toList();

          // Finde den aktuellen Index basierend auf den aktivierten Items
          final currentIndex = _findCurrentIndex(
            activeIndex,
            bottomNavConfig,
            enabledItems,
          );

          // Bestimme die aktuelle Route
          final currentItem =
              enabledItems[currentIndex.clamp(0, enabledItems.length - 1)];
          final isDashboard = currentItem.route == BottomNavRoute.dashboard;

          return Scaffold(
            appBar: isDashboard
                ? AppBar(
                    title: Text(context.t.dashboard.title),
                    backgroundColor: Theme.of(
                      context,
                    ).colorScheme.inversePrimary,
                    actions: [
                      IconButton(
                        icon: const Icon(Icons.settings),
                        onPressed: () {
                          context.router.push(const SettingsRoute());
                        },
                      ),
                    ],
                  )
                : null,
            body: IndexedStack(
              index: currentIndex.clamp(0, enabledItems.length - 1),
              children: _buildPages(context, bottomNavConfig),
            ),
            bottomNavigationBar: BottomNavigationBar(
              currentIndex: currentIndex.clamp(0, enabledItems.length - 1),
              onTap: (int index) {
                // Konvertiere den UI-Index zurück zum ursprünglichen Index
                final originalIndex = _convertUIToOriginalIndex(
                  index,
                  bottomNavConfig,
                );
                ref
                    .read(bottomNavActiveIndexProvider.notifier)
                    .setIndex(originalIndex);
              },
              type: BottomNavigationBarType.fixed,
              items: _buildBottomNavItems(context, bottomNavConfig),
            ),
          );
        },
        loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
        error: (error, stack) => Scaffold(
          body: Center(child: Text('Error loading navigation: $error')),
        ),
      ),
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stack) => Scaffold(
        body: Center(child: Text('Error loading navigation: $error')),
      ),
    );
  }

  List<Widget> _buildPages(BuildContext context, List<BottomNavItem> config) {
    final pages = <Widget>[];

    for (final BottomNavItem item in config.where(
      (BottomNavItem item) => item.enabled,
    )) {
      switch (item.route) {
        case BottomNavRoute.dashboard:
          pages.add(
            const SingleChildScrollView(
              child: Column(
                children: [
                  // TODO: Weitere Dashboard-Komponenten hinzufügen
                  // RecipeCard(),
                  // PlannerCard(),
                  // TrackerCard(),
                ],
              ),
            ),
          );
          break;
        case BottomNavRoute.shoppingList:
          pages.add(const ShoppingListPage());
          break;
        case BottomNavRoute.recipes:
          pages.add(const RecipesPage());
          break;
        case BottomNavRoute.planner:
          pages.add(const PlannerPage());
          break;
        case BottomNavRoute.tracker:
          pages.add(const TrackerPage());
          break;
        case BottomNavRoute.trainingPlan:
          pages.add(const TrainingPlanPage());
          break;
        case BottomNavRoute.trainingLog:
          pages.add(const TrainingLogPage());
          break;
      }
    }

    return pages;
  }

  List<BottomNavigationBarItem> _buildBottomNavItems(
    BuildContext context,
    List<BottomNavItem> config,
  ) {
    return config.where((BottomNavItem item) => item.enabled).map((
      BottomNavItem item,
    ) {
      return BottomNavigationBarItem(
        icon: Icon(item.icon),
        activeIcon: Icon(item.activeIcon),
        label: _getLabel(context, item.route),
      );
    }).toList();
  }

  String _getLabel(BuildContext context, BottomNavRoute route) {
    switch (route) {
      case BottomNavRoute.dashboard:
        return context.t.dashboard.title;
      case BottomNavRoute.shoppingList:
        return context.t.shopping_list.title;
      case BottomNavRoute.recipes:
        return context.t.recipes.title;
      case BottomNavRoute.planner:
        return context.t.planner.title;
      case BottomNavRoute.tracker:
        return context.t.tracker.title;
      case BottomNavRoute.trainingPlan:
        return context.t.training_plan.title;
      case BottomNavRoute.trainingLog:
        return context.t.training_log.title;
    }
  }

  /// Findet den aktuellen Index basierend auf dem gespeicherten Index und den aktivierten Items
  int _findCurrentIndex(
    int savedIndex,
    List<BottomNavItem> config,
    List<BottomNavItem> enabledItems,
  ) {
    if (enabledItems.isEmpty) return 0;

    // Wenn der gespeicherte Index noch gültig ist (Item ist aktiviert), verwende ihn
    if (savedIndex < config.length && config[savedIndex].enabled) {
      // Finde die Position in den aktivierten Items
      final targetItem = config[savedIndex];
      final foundIndex = enabledItems.indexWhere(
        (item) => item.route == targetItem.route,
      );
      return foundIndex >= 0 ? foundIndex : 0;
    }

    // Fallback: Verwende den ersten aktivierten Index
    return 0;
  }

  /// Konvertiert einen UI-Index zurück zum ursprünglichen Index in der Konfiguration
  int _convertUIToOriginalIndex(int uiIndex, List<BottomNavItem> config) {
    final enabledItems = config.where((item) => item.enabled).toList();
    if (uiIndex >= enabledItems.length) return 0;

    final targetItem = enabledItems[uiIndex];
    return config.indexWhere((item) => item.route == targetItem.route);
  }
}

// Bottom Navigation Configuration
enum BottomNavRoute {
  dashboard,
  shoppingList,
  recipes,
  planner,
  tracker,
  trainingPlan,
  trainingLog,
}

class BottomNavItem {
  final BottomNavRoute route;
  final IconData icon;
  final IconData activeIcon;
  final bool enabled;

  const BottomNavItem({
    required this.route,
    required this.icon,
    required this.activeIcon,
    this.enabled = true,
  });

  BottomNavItem copyWith({
    BottomNavRoute? route,
    IconData? icon,
    IconData? activeIcon,
    bool? enabled,
  }) {
    return BottomNavItem(
      route: route ?? this.route,
      icon: icon ?? this.icon,
      activeIcon: activeIcon ?? this.activeIcon,
      enabled: enabled ?? this.enabled,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'route': route.name,
      'icon': icon.codePoint,
      'activeIcon': activeIcon.codePoint,
      'enabled': enabled,
    };
  }

  factory BottomNavItem.fromJson(Map<String, dynamic> json) {
    return BottomNavItem(
      route: BottomNavRoute.values.firstWhere(
        (e) => e.name == json['route'],
        orElse: () => BottomNavRoute.dashboard,
      ),
      icon: IconData(
        json['icon'] as int,
        fontFamily: 'MaterialIcons',
      ),
      activeIcon: IconData(
        json['activeIcon'] as int,
        fontFamily: 'MaterialIcons',
      ),
      enabled: (json['enabled'] as bool?) ?? true,
    );
  }
}

// Default Bottom Navigation Configuration
final defaultBottomNavConfig = [
  const BottomNavItem(
    route: BottomNavRoute.dashboard,
    icon: Icons.home_outlined,
    activeIcon: Icons.home,
  ),
  const BottomNavItem(
    route: BottomNavRoute.shoppingList,
    icon: Icons.shopping_cart_outlined,
    activeIcon: Icons.shopping_cart,
  ),
  const BottomNavItem(
    route: BottomNavRoute.recipes,
    icon: Icons.restaurant_outlined,
    activeIcon: Icons.restaurant,
  ),
  const BottomNavItem(
    route: BottomNavRoute.planner,
    icon: Icons.calendar_today_outlined,
    activeIcon: Icons.calendar_today,
  ),
  const BottomNavItem(
    route: BottomNavRoute.tracker,
    icon: Icons.track_changes_outlined,
    activeIcon: Icons.track_changes,
  ),
  const BottomNavItem(
    route: BottomNavRoute.trainingPlan,
    icon: Icons.fitness_center_outlined,
    activeIcon: Icons.fitness_center,
  ),
  const BottomNavItem(
    route: BottomNavRoute.trainingLog,
    icon: Icons.list_alt_outlined,
    activeIcon: Icons.list_alt,
  ),
];
