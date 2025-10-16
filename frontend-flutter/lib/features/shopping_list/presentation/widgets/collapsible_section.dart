import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';

enum SectionType {
  activeItems,
  checkedItems,
}

class CollapsibleSection extends StatelessWidget {
  final String title;
  final int itemCount;
  final bool isExpanded;
  final VoidCallback onToggle;
  final bool isChecked;
  final SectionType sectionType;

  const CollapsibleSection({
    super.key,
    required this.title,
    required this.itemCount,
    required this.isExpanded,
    required this.onToggle,
    this.isChecked = false,
    required this.sectionType,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onToggle,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  isExpanded ? Icons.expand_more : Icons.chevron_right,
                  color: isChecked ? Colors.grey : null,
                ),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: isChecked ? Colors.grey : null,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '($itemCount)',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            if (sectionType == SectionType.checkedItems) ...[
              IconButton(
                icon: const Icon(Icons.delete_outline),
                color: Theme.of(context).colorScheme.error,
                onPressed: () {
                  context.read<ShoppingListBloc>().add(
                    ShoppingListDeleteAllCheckedItemsEvent(),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
