import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/core/utils/string_utils.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';

class ShoppingListItemTile extends HookWidget {
  final ShoppingListItem item;
  final bool isChecked;

  const ShoppingListItemTile({
    super.key,
    required this.item,
    this.isChecked = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            item.name,
            style: isChecked
                ? TextStyle(
                    decoration: TextDecoration.lineThrough,
                    color: Colors.grey.shade600,
                  )
                : null,
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
      trailing: Checkbox(
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
      ),
    );
  }
}

