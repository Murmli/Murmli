import 'dart:async';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/i18n/translations.g.dart';

@RoutePage()
class ShoppingListPage extends StatefulWidget {
  const ShoppingListPage({super.key});

  @override
  State<ShoppingListPage> createState() => _ShoppingListPageState();
}

class _ShoppingListPageState extends State<ShoppingListPage> {
  StreamSubscription<RetryOperationType>? _retrySuccessSubscription;

  @override
  void initState() {
    super.initState();
    context.read<ShoppingListBloc>().add(ShoppingListInitEvent());
    
    // Listen to retry queue success stream for shopping list operations
    final retryQueueBloc = context.read<RetryQueueBloc>();
    _retrySuccessSubscription = retryQueueBloc.operationSuccessStream.listen((operationType) {
      // Only refresh list for operations that need server data
      final shouldRefreshList = 
          operationType == RetryOperationType.createShoppingListItem ||  // New item added
          operationType == RetryOperationType.readShoppingList ||        // List was fetched
          operationType == RetryOperationType.createShoppingList;        // New list created
      
      // Don't refresh for delete operations - UI is already updated optimistically
      
      if (shouldRefreshList && mounted) {
        print('Shopping list operation succeeded (${operationType.name}), refreshing list');
        context.read<ShoppingListBloc>().add(ShoppingListInitEvent());
      } else if (mounted) {
        print('Shopping list operation succeeded (${operationType.name}), no refresh needed');
      }
    });
  }

  @override
  void dispose() {
    _retrySuccessSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
          Expanded(
            child: BlocBuilder<ShoppingListBloc, ShoppingListState>(
              builder: (context, state) {
                // print(state);
                if (state is ShoppingListLoadedState) {
                  return ListView.builder(
                    itemCount: state.shoppingList.items.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text(state.shoppingList.items[index].name),
                        trailing: IconButton(
                          onPressed: () {
                            context.read<ShoppingListBloc>().add(
                              ShoppingListDeleteItemEvent(itemId: state.shoppingList.items[index].id!),
                            );
                          },
                          icon: const Icon(Icons.delete),
                        ),
                      );
                    },
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          BottomInput(),
        ],
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
              decoration: const InputDecoration(
                hintText: 'Add item...',
                border: OutlineInputBorder(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () {
              context.read<ShoppingListBloc>().add(
                ShoppingListCreateItemEvent(text: textController.text),
              );
              textController.clear();
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
