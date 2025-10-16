import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_operation.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_state.dart';
import 'package:murmli/features/shopping_list/presentation/widgets/animated_shopping_list.dart';
import 'package:murmli/features/shopping_list/presentation/widgets/shopping_list_bottom_input.dart';
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
          const ShoppingListBottomInput(),
        ],
      ),
    );
  }
}
