import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/features/shopping_list/presentation/widgets/collapsible_section.dart';
import 'package:murmli/features/shopping_list/presentation/widgets/shopping_list_item_tile.dart';
import 'package:murmli/i18n/translations.g.dart';

class AnimatedShoppingList extends StatefulHookWidget {
  const AnimatedShoppingList({super.key});

  @override
  State<AnimatedShoppingList> createState() => _AnimatedShoppingListState();
}

class _AnimatedShoppingListState extends State<AnimatedShoppingList> {
  final GlobalKey<AnimatedListState> _activeListKey =
      GlobalKey<AnimatedListState>();
  final GlobalKey<AnimatedListState> _inactiveListKey =
      GlobalKey<AnimatedListState>();

  List<ShoppingListItem> _activeItems = [];
  List<ShoppingListItem> _inactiveItems = [];
  bool _isInitialized = false;

  @override
  Widget build(BuildContext context) {
    final isActiveExpanded = useState(true);
    final isInactiveExpanded = useState(true);

    return BlocListener<ShoppingListBloc, ShoppingListState>(
      listener: (context, state) {
        if (state is ShoppingListLoadedState) {
          final newActiveItems = state.shoppingList.items
              .where((item) => item.active)
              .toList();
          final newInactiveItems = state.shoppingList.items
              .where((item) => !item.active)
              .toList();

          if (!_isInitialized) {
            // First load - initialize without animations
            setState(() {
              _activeItems = List.from(newActiveItems);
              _inactiveItems = List.from(newInactiveItems);
              _isInitialized = true;
            });
          } else {
            _updateLists(newActiveItems, newInactiveItems);
          }
        }
      },
      child: BlocBuilder<ShoppingListBloc, ShoppingListState>(
        builder: (context, state) {
          if (state is! ShoppingListLoadedState) {
            return const SizedBox.shrink();
          }

          final currentActiveItems = state.shoppingList.items
              .where((item) => item.active)
              .toList();
          final currentInactiveItems = state.shoppingList.items
              .where((item) => !item.active)
              .toList();

          // Initialize lists if not done yet (for hydrated_bloc restoration)
          if (!_isInitialized) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && !_isInitialized) {
                setState(() {
                  _activeItems = List.from(currentActiveItems);
                  _inactiveItems = List.from(currentInactiveItems);
                  _isInitialized = true;
                });
              }
            });
            // Return empty on first build, will rebuild after initialization
            return const SizedBox.shrink();
          }

          return ListView(
            children: [
              // Active items section
              CollapsibleSection(
                title: context.t.shopping_list.active_items,
                itemCount: currentActiveItems.length,
                isExpanded: isActiveExpanded.value,
                onToggle: () =>
                    isActiveExpanded.value = !isActiveExpanded.value,
              ),
              if (isActiveExpanded.value)
                AnimatedList(
                  key: _activeListKey,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  initialItemCount: _activeItems.length,
                  itemBuilder: (context, index, animation) {
                    if (index >= _activeItems.length) {
                      return const SizedBox.shrink();
                    }
                    return _buildItem(_activeItems[index], animation, false);
                  },
                ),

              // Checked items section
              if (currentInactiveItems.isNotEmpty) ...[
                const Divider(height: 1),
                CollapsibleSection(
                  title: context.t.shopping_list.checked_items,
                  itemCount: currentInactiveItems.length,
                  isExpanded: isInactiveExpanded.value,
                  onToggle: () =>
                      isInactiveExpanded.value = !isInactiveExpanded.value,
                  isChecked: true,
                ),
                if (isInactiveExpanded.value)
                  AnimatedList(
                    key: _inactiveListKey,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    initialItemCount: _inactiveItems.length,
                    itemBuilder: (context, index, animation) {
                      if (index >= _inactiveItems.length) {
                        return const SizedBox.shrink();
                      }
                      return _buildItem(_inactiveItems[index], animation, true);
                    },
                  ),
              ],
            ],
          );
        },
      ),
    );
  }

  void _updateLists(
    List<ShoppingListItem> newActiveItems,
    List<ShoppingListItem> newInactiveItems,
  ) async {
    // Find items that moved from active to inactive
    for (var i = _activeItems.length - 1; i >= 0; i--) {
      final oldItem = _activeItems[i];
      if (newInactiveItems.any((item) => item.id == oldItem.id)) {
        // Item moved to inactive list - remove with animation
        final removedItem = _activeItems.removeAt(i);
        _activeListKey.currentState?.removeItem(
          i,
          (context, animation) => _buildItem(removedItem, animation, false),
          duration: const Duration(milliseconds: 250),
        );

        // Wait for removal animation to complete before adding
        await Future<void>.delayed(const Duration(milliseconds: 150));

        // Add to END of inactive list with animation
        if (mounted) {
          final newItem = newInactiveItems.firstWhere(
            (item) => item.id == oldItem.id,
          );
          _inactiveItems.add(newItem);
          _inactiveListKey.currentState?.insertItem(
            _inactiveItems.length - 1,
            duration: const Duration(milliseconds: 250),
          );
        }
      }
    }

    // Find items that moved from inactive to active
    for (var i = _inactiveItems.length - 1; i >= 0; i--) {
      final oldItem = _inactiveItems[i];
      if (newActiveItems.any((item) => item.id == oldItem.id)) {
        // Item moved to active list - remove with animation
        final removedItem = _inactiveItems.removeAt(i);
        _inactiveListKey.currentState?.removeItem(
          i,
          (context, animation) => _buildItem(removedItem, animation, true),
          duration: const Duration(milliseconds: 250),
        );

        // Wait for removal animation to complete before adding
        await Future<void>.delayed(const Duration(milliseconds: 150));

        // Add to END of active list with animation
        if (mounted) {
          final newItem = newActiveItems.firstWhere(
            (item) => item.id == oldItem.id,
          );
          _activeItems.add(newItem);
          _activeListKey.currentState?.insertItem(
            _activeItems.length - 1,
            duration: const Duration(milliseconds: 250),
          );
        }
      }
    }

    // Handle new items (completely new, not moved)
    for (var i = 0; i < newActiveItems.length; i++) {
      if (!_activeItems.any((item) => item.id == newActiveItems[i].id)) {
        _activeItems.add(newActiveItems[i]);
        _activeListKey.currentState?.insertItem(
          _activeItems.length - 1,
          duration: const Duration(milliseconds: 300),
        );
      }
    }

    // Handle deleted items from active list
    for (var i = _activeItems.length - 1; i >= 0; i--) {
      if (!newActiveItems.any((item) => item.id == _activeItems[i].id) &&
          !newInactiveItems.any((item) => item.id == _activeItems[i].id)) {
        final removedItem = _activeItems.removeAt(i);
        _activeListKey.currentState?.removeItem(
          i,
          (context, animation) => _buildItem(removedItem, animation, false),
          duration: const Duration(milliseconds: 300),
        );
      }
    }

    // Handle deleted items from inactive list
    for (var i = _inactiveItems.length - 1; i >= 0; i--) {
      if (!newInactiveItems.any((item) => item.id == _inactiveItems[i].id) &&
          !newActiveItems.any((item) => item.id == _inactiveItems[i].id)) {
        final removedItem = _inactiveItems.removeAt(i);
        _inactiveListKey.currentState?.removeItem(
          i,
          (context, animation) => _buildItem(removedItem, animation, true),
          duration: const Duration(milliseconds: 300),
        );
      }
    }
  }

  Widget _buildItem(
    ShoppingListItem item,
    Animation<double> animation,
    bool isChecked,
  ) {
    return SizeTransition(
      sizeFactor: animation,
      child: FadeTransition(
        opacity: animation,
        child: ShoppingListItemTile(
          item: item,
          isChecked: isChecked,
        ),
      ),
    );
  }
}

