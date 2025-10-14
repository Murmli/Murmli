import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/features/dashboard/provider/bottom_nav_provider.dart';
import 'package:murmli/components/bottom_nav_reorderable_list.dart';
import 'package:murmli/i18n/translations.g.dart';

class BottomNavigationSection extends ConsumerWidget {
  const BottomNavigationSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottomNavNotifier = ref.read(bottomNavConfigProvider.notifier);

    return Column(
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

        // Wiederverwendbare Reorderable List
        const BottomNavReorderableList(),

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
    );
  }
}