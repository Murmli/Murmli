import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/core/utils/string_utils.dart';
import 'package:murmli/features/shopping_list/bloc/models/shopping_list_item_ui.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';

class ShoppingListItemTile extends HookWidget {
  final ShoppingListItem item;
  final bool isChecked;
  final ShoppingListItemStatus? itemStatus;

  const ShoppingListItemTile({
    super.key,
    required this.item,
    this.isChecked = false,
    this.itemStatus,
  });

  @override
  Widget build(BuildContext context) {
    final isLoading = itemStatus == ShoppingListItemStatus.loading;
    final hasError = itemStatus == ShoppingListItemStatus.error;

    return ListTile(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              item.name,
              style: isChecked
                  ? TextStyle(
                      decoration: TextDecoration.lineThrough,
                      color: Colors.grey.shade600,
                    )
                  : hasError
                      ? TextStyle(color: Colors.red.shade700)
                      : null,
            ),
          ),
          if (item.quantity != null && item.quantity != 0)
            Text(
              '${stringWithout0(item.quantity.toString())} ${item.unit?.name}',
              style: isChecked
                  ? TextStyle(
                      decoration: TextDecoration.lineThrough,
                      color: Colors.grey.shade600,
                    )
                  : null,
            ),
        ],
      ),
      trailing: _buildTrailing(context, isLoading, hasError),
    );
  }

  Widget _buildTrailing(BuildContext context, bool isLoading, bool hasError) {
    if (isLoading) {
      return const SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }

    if (hasError) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.red),
            onPressed: () {
              context.read<ShoppingListBloc>().add(
                    ShoppingListRetryCreateItemEvent(
                      tempId: item.id!,
                      text: item.name,
                    ),
                  );
            },
            tooltip: 'Retry',
          ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.grey),
            onPressed: () {
              // Remove failed item from list
              context.read<ShoppingListBloc>().add(
                    ShoppingListDeleteItemEvent(itemId: item.id!),
                  );
            },
            tooltip: 'Remove',
          ),
        ],
      );
    }

    return Checkbox(
      value: !item.active,
      onChanged: (value) {
        context.read<ShoppingListBloc>().add(
          ShoppingListToggleItemActiveEvent(
            itemId: item.id!,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit?.id,
            category: item.category.id,
            active: item.active,
          ),
        );
      },
    );
  }
}

