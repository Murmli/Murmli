import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/features/dashboard/presentation/dashboard_page.dart';
import 'package:murmli/features/dashboard/provider/bottom_nav_provider.dart';
import 'package:murmli/components/bottom_nav_item_card.dart';

/// Wiederverwendbare ReorderableListView für Bottom Navigation Items
class BottomNavReorderableList extends ConsumerWidget {
  const BottomNavReorderableList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottomNavConfigAsync = ref.watch(bottomNavConfigProvider);
    final bottomNavNotifier = ref.read(bottomNavConfigProvider.notifier);

    return bottomNavConfigAsync.when(
      data: (bottomNavConfig) => ReorderableListView(
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

          return BottomNavItemCard(
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
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) =>
          Center(child: Text('Error loading navigation: $error')),
    );
  }
}

