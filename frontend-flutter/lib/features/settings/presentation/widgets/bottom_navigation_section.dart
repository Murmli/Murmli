import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/features/dashboard/presentation/dashboard_page.dart';
import 'package:murmli/features/dashboard/provider/bottom_nav_provider.dart';
import 'package:murmli/i18n/translations.g.dart';

class BottomNavigationSection extends ConsumerWidget {
  const BottomNavigationSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottomNavConfigAsync = ref.watch(bottomNavConfigProvider);
    final bottomNavNotifier = ref.read(bottomNavConfigProvider.notifier);

    return bottomNavConfigAsync.when(
      data: (bottomNavConfig) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.t.settings.bottom_nav.title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.t.settings.bottom_nav.description,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 16),

          // Reorderable List für Navigation Items
          ReorderableListView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            onReorder: (int oldIndex, int newIndex) {
              final newState = List<BottomNavItem>.from(bottomNavConfig);
              if (newIndex > oldIndex) {
                newIndex -= 1;
              }
              final BottomNavItem item = newState.removeAt(oldIndex);
              newState.insert(newIndex, item);
              bottomNavNotifier.updateConfig(newState);
            },
            children: bottomNavConfig.asMap().entries.map((
              MapEntry<int, BottomNavItem> entry,
            ) {
              final int index = entry.key;
              final BottomNavItem item = entry.value;

              return _BottomNavItemCard(
                key: ValueKey('${item.route}_$index'),
                item: item,
                onToggle: (bool enabled) {
                  final newState = List<BottomNavItem>.from(bottomNavConfig);
                  newState[index] = item.copyWith(enabled: enabled);
                  bottomNavNotifier.updateConfig(newState);

                  // Wenn das aktuelle Item deaktiviert wird, wechsle zum ersten aktivierten Item
                  if (!enabled) {
                    final activeIndexNotifier = ref.read(
                      bottomNavActiveIndexProvider.notifier,
                    );
                    final enabledItems = newState
                        .where((item) => item.enabled)
                        .toList();
                    if (enabledItems.isNotEmpty) {
                      final firstEnabledItem = enabledItems.first;
                      final newIndex = newState.indexWhere(
                        (item) => item.route == firstEnabledItem.route,
                      );
                      if (newIndex >= 0) {
                        activeIndexNotifier.setIndex(newIndex);
                      }
                    }
                  }
                },
              );
            }).toList(),
          ),

          const SizedBox(height: 16),

          // Reset Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                bottomNavNotifier.resetToDefault();
              },
              icon: const Icon(Icons.refresh),
              label: Text(context.t.settings.bottom_nav.reset),
            ),
          ),
        ],
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) =>
          Center(child: Text('Error loading navigation: $error')),
    );
  }
}

class _BottomNavItemCard extends StatelessWidget {
  final BottomNavItem item;
  final ValueChanged<bool> onToggle;

  const _BottomNavItemCard({
    required super.key,
    required this.item,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: Icon(
          item.icon,
          color: item.enabled ? Colors.blue : Colors.grey,
        ),
        title: Text(
          _getLabel(context, item.route),
          style: TextStyle(
            color: item.enabled ? null : Colors.grey,
          ),
        ),
        subtitle: Text(
          _getDescription(context, item.route),
          style: TextStyle(
            color: item.enabled ? Colors.grey[600] : Colors.grey[400],
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Switch(
              value: item.enabled,
              onChanged: onToggle,
            ),
            const SizedBox(width: 16),
          ],
        ),
        isThreeLine: true,
      ),
    );
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

  String _getDescription(BuildContext context, BottomNavRoute route) {
    switch (route) {
      case BottomNavRoute.dashboard:
        return context.t.settings.bottom_nav.dashboard_desc;
      case BottomNavRoute.shoppingList:
        return context.t.settings.bottom_nav.shopping_list_desc;
      case BottomNavRoute.recipes:
        return context.t.settings.bottom_nav.recipes_desc;
      case BottomNavRoute.planner:
        return context.t.settings.bottom_nav.planner_desc;
      case BottomNavRoute.tracker:
        return context.t.settings.bottom_nav.tracker_desc;
      case BottomNavRoute.trainingPlan:
        return context.t.settings.bottom_nav.training_plan_desc;
      case BottomNavRoute.trainingLog:
        return context.t.settings.bottom_nav.training_log_desc;
    }
  }
}
