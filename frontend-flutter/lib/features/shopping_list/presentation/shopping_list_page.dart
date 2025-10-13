import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:murmli/api/models/shopping_list_models.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/i18n/translations.g.dart';

@RoutePage()
class ShoppingListPage extends HookWidget {
  const ShoppingListPage({super.key});

  @override
  Widget build(BuildContext context) {
    final shoppingListBloc = context.read<ShoppingListBloc>();
    final retryQueueBloc = context.read<RetryQueueBloc>();

    // Initialize shopping list on mount
    useEffect(() {
      shoppingListBloc.add(ShoppingListInitEvent());
      return null;
    }, []);

    // Listen to retry queue success stream
    useEffect(() {
      final subscription = retryQueueBloc.operationSuccessStream.listen((
        operationType,
      ) {
        // Only refresh list for operations that need server data
        final shouldRefreshList =
            operationType == RetryOperationType.createShoppingListItem ||
            operationType == RetryOperationType.readShoppingList ||
            operationType == RetryOperationType.createShoppingList;

        // Don't refresh for delete/toggle - UI already updated optimistically

        if (shouldRefreshList) {
          print(
            'Shopping list operation succeeded (${operationType.name}), refreshing list',
          );
          shoppingListBloc.add(ShoppingListInitEvent());
        } else {
          print(
            'Shopping list operation succeeded (${operationType.name}), no refresh needed',
          );
        }
      });

      return subscription.cancel;
    }, [retryQueueBloc, shoppingListBloc]);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.t.shopping_list.title),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              context.router.push(const SettingsRoute());
            },
          ),
        ],
      ),
      body: Column(
        children: [
          BlocBuilder<ShoppingListBloc, ShoppingListState>(
            builder: (context, state) {
              if (state is ShoppingListLoadingState) {
                return const Center(
                  child: CircularProgressIndicator(),
                );
              }
              return const SizedBox.shrink();
            },
          ),
          const Expanded(
            child: AnimatedShoppingList(),
          ),
          const BottomInput(),
        ],
      ),
    );
  }
}

class AnimatedShoppingList extends StatefulHookWidget {
  const AnimatedShoppingList({super.key});

  @override
  State<AnimatedShoppingList> createState() => _AnimatedShoppingListState();
}

class _AnimatedShoppingListState extends State<AnimatedShoppingList> {
  final GlobalKey<AnimatedListState> _activeListKey = GlobalKey<AnimatedListState>();
  final GlobalKey<AnimatedListState> _inactiveListKey = GlobalKey<AnimatedListState>();
  
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
              _CollapsibleSection(
                title: context.t.shopping_list.active_items,
                itemCount: currentActiveItems.length,
                isExpanded: isActiveExpanded.value,
                onToggle: () => isActiveExpanded.value = !isActiveExpanded.value,
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
                _CollapsibleSection(
                  title: context.t.shopping_list.checked_items,
                  itemCount: currentInactiveItems.length,
                  isExpanded: isInactiveExpanded.value,
                  onToggle: () => isInactiveExpanded.value = !isInactiveExpanded.value,
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
          final newItem = newInactiveItems.firstWhere((item) => item.id == oldItem.id);
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
          final newItem = newActiveItems.firstWhere((item) => item.id == oldItem.id);
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
        child: _ShoppingListItemTile(
          item: item,
          isChecked: isChecked,
        ),
      ),
    );
  }
}

class _CollapsibleSection extends StatelessWidget {
  final String title;
  final int itemCount;
  final bool isExpanded;
  final VoidCallback onToggle;
  final bool isChecked;

  const _CollapsibleSection({
    required this.title,
    required this.itemCount,
    required this.isExpanded,
    required this.onToggle,
    this.isChecked = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onToggle,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
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
      ),
    );
  }
}

class _ShoppingListItemTile extends HookWidget {
  final ShoppingListItem item;
  final bool isChecked;

  const _ShoppingListItemTile({
    required this.item,
    this.isChecked = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Checkbox(
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
      title: Text(
        item.name,
        style: isChecked
            ? TextStyle(
                decoration: TextDecoration.lineThrough,
                color: Colors.grey.shade600,
              )
            : null,
      ),
      trailing: IconButton(
        onPressed: () {
          context.read<ShoppingListBloc>().add(
                ShoppingListDeleteItemEvent(
                  itemId: item.id!,
                ),
              );
        },
        icon: Icon(
          Icons.delete,
          color: isChecked ? Colors.grey : null,
        ),
      ),
    );
  }
}

class BottomInput extends HookWidget {
  const BottomInput({
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
          ElevatedButton(
            onPressed: () {
              if (textController.text.trim().isEmpty) return;
              context.read<ShoppingListBloc>().add(
                ShoppingListCreateItemEvent(text: textController.text),
              );
              textController.clear();
            },
            child: Text(context.t.shopping_list.add_button),
          ),
        ],
      ),
    );
  }
}
