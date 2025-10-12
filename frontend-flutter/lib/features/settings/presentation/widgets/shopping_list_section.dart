import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/api/provider/user/shopping_list_categories_provider.dart';
import 'package:murmli/api/provider/user/shopping_list_sorting_provider.dart';
import 'package:murmli/core/utils/error_message.dart';
import 'package:murmli/i18n/translations.g.dart';

class ShoppingListSection extends ConsumerStatefulWidget {
  const ShoppingListSection({super.key});

  @override
  ConsumerState<ShoppingListSection> createState() =>
      _ShoppingListSectionState();
}

class _ShoppingListSectionState extends ConsumerState<ShoppingListSection> {
  List<dynamic>? _localSortedCategories;

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(shoppingListCategoriesProvider);
    final sortingAsync = ref.watch(shoppingListSortingProvider);

    return _buildSortableShoppingListCategories(
      context,
      ref,
      categoriesAsync,
      sortingAsync,
    );
  }

  Widget _buildSortableShoppingListCategories(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<dynamic> categoriesAsync,
    AsyncValue<dynamic> sortingAsync,
  ) {
    return categoriesAsync.when(
      data: (categoriesResponse) {
        if (categoriesResponse?.categories == null ||
            (categoriesResponse!.categories as List).isEmpty) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: Theme.of(
                  context,
                ).colorScheme.outline.withValues(alpha: 0.2),
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.category_outlined,
                  size: 32,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                const SizedBox(height: 8),
                Text(
                  t.settings.no_categories_available,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          );
        }

        // Erstelle eine sortierte Liste basierend auf der aktuellen Sortierung
        final categories = categoriesResponse!.categories as List;
        final sorting = sortingAsync.value?.categories as List?;

        // Verwende lokalen State oder erstelle neue Sortierung
        if (_localSortedCategories == null) {
          List<dynamic> sortedCategories = List<dynamic>.from(categories);
          if (sorting != null && sorting.isNotEmpty) {
            // Sortiere Kategorien basierend auf der Sortierung
            sortedCategories = sorting.map((sortedItem) {
              try {
                return categories.firstWhere(
                  (cat) => cat.id == sortedItem.id,
                );
              } catch (e) {
                // Falls Kategorie nicht gefunden wird, verwende die sortierte Kategorie
                return sortedItem;
              }
            }).toList();
          }
          _localSortedCategories = List<dynamic>.from(sortedCategories);
        }

        final sortedCategories = _localSortedCategories!;

        return Column(
          children: [
            Row(
              children: [
                const Spacer(),
                if (sortingAsync.hasValue && categoriesAsync.hasValue)
                  IconButton(
                    icon: const Icon(Icons.save),
                    onPressed: () => _saveShoppingListSorting(
                      context,
                      ref,
                      sortedCategories,
                    ),
                    tooltip: t.settings.save_sorting,
                  ),
              ],
            ),
            const SizedBox(height: 16),
            ReorderableListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: sortedCategories.length,
              onReorder: (oldIndex, newIndex) {
                _reorderCategories(
                  context,
                  ref,
                  oldIndex,
                  newIndex,
                  sortedCategories,
                );
              },
              buildDefaultDragHandles: false,
              itemBuilder: (context, index) {
                final category = sortedCategories[index];
                return Card(
                  key: ValueKey(category.id),
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: ListTile(
                    leading: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.onPrimary,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ),
                    ),
                    title: Text(
                      category.name as String,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    trailing: ReorderableDragStartListener(
                      index: index,
                      child: const Icon(Icons.drag_handle),
                    ),
                  ),
                );
              },
            ),
          ],
        );
      },
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (e, _) => Column(
        children: [
          Text(
            humanizeError(e),
            style: TextStyle(
              color: Theme.of(context).colorScheme.error,
            ),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => ref
                .read(shoppingListCategoriesProvider.notifier)
                .loadCategories(),
            child: Text(t.common.retry),
          ),
        ],
      ),
    );
  }

  void _reorderCategories(
    BuildContext context,
    WidgetRef ref,
    int oldIndex,
    int newIndex,
    List<dynamic> categories,
  ) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }

    // Aktualisiere nur den lokalen State - kein API-Aufruf
    setState(() {
      final item = _localSortedCategories!.removeAt(oldIndex);
      _localSortedCategories!.insert(newIndex, item);
    });
  }

  Future<void> _saveShoppingListSorting(
    BuildContext context,
    WidgetRef ref,
    List<dynamic> sortedCategories,
  ) async {
    try {
      final sortingProvider = ref.read(shoppingListSortingProvider.notifier);

      // Verwende die aktuelle UI-Sortierung direkt
      final sortedIds = sortedCategories.map((cat) => cat.id as int).toList();
      await sortingProvider.updateSorting(sortedIds);

      // Reset lokalen State nach erfolgreichem Speichern
      setState(() {
        _localSortedCategories = null;
      });

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(t.settings.sorting_saved),
            backgroundColor: Theme.of(context).colorScheme.primary,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.settings.sorting_save_error.replaceAll('{error}', e.toString()),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
}
