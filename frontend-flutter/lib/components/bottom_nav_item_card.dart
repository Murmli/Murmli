import 'package:flutter/material.dart';
import 'package:murmli/features/dashboard/presentation/dashboard_page.dart';
import 'package:murmli/i18n/translations.g.dart';

/// Wiederverwendbare Card-Komponente für Bottom Navigation Items
class BottomNavItemCard extends StatelessWidget {
  final BottomNavItem item;
  final ValueChanged<bool> onToggle;

  const BottomNavItemCard({
    required super.key,
    required this.item,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Switch(
              value: item.enabled,
              onChanged: onToggle,
            ),
            const SizedBox(width: 8),
            Icon(
              item.icon,
              color: item.enabled
                  ? Theme.of(context).colorScheme.primary
                  : Colors.grey,
            ),
          ],
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
