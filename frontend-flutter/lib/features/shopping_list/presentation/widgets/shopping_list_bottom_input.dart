import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';
import 'package:murmli/i18n/translations.g.dart';

class ShoppingListBottomInput extends HookWidget {
  const ShoppingListBottomInput({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final textController = useTextEditingController();
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: textController,
              decoration: InputDecoration(
                hintText: context.t.shopping_list.add_item_hint,
                border: const OutlineInputBorder(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            onPressed: () {
              if (textController.text.trim().isEmpty) return;
              context.read<ShoppingListBloc>().add(
                ShoppingListCreateItemEvent(text: textController.text),
              );
              textController.clear();
            },
            icon: const Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}
