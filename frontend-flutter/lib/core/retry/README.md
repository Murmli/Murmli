# Retry Queue System

This retry queue system provides automatic retry functionality for failed network operations with exponential backoff.

## Features

- **Automatic Retries**: Failed operations are automatically retried with exponential backoff
- **Persistent Storage**: Operations are persisted to secure storage and survive app restarts
- **Optimistic UI Updates**: UI updates immediately while operations retry in the background
- **Internet Connectivity Aware**: Automatically pauses retrying when offline and resumes when connection is restored
- **Adaptive Retry Intervals**: Different processing speeds based on connection type:
  - WiFi/Ethernet: Every 5 seconds (fast, reliable connection)
  - Mobile Data: Every 10 seconds (moderate speed)
  - Offline/Unstable: Every 30 seconds (conserve resources)
- **Smart Backoff Strategy**: Retry delays adjust based on connection quality:
  - WiFi/Ethernet: 30% faster retries
  - Mobile: Standard retry timing
  - Unstable connections: 50% slower retries
  - Offline: 2x slower retries
- **Configurable**: Maximum retries (default: 5) and backoff intervals are configurable

## Architecture

The retry queue consists of:

1. **RetryOperation** - Model representing an operation that can be retried
2. **RetryQueueStorage** - Handles persistence to secure storage
3. **RetryQueueBloc** - Manages the queue state and retry logic
4. **RetryQueueProvider** - Factory for creating the BLoC instance

## How It Works

1. **At App Launch**: Connectivity is checked before any retry operations begin
   - If offline, the retry queue enters a conservative mode with 30s intervals
   - Pending operations from previous sessions are loaded but not processed until connectivity is confirmed
   - **Shopping list init failures are also queued**: If the shopping list can't load, it's added to retry queue
2. When an API call fails, instead of showing an error, the operation is added to the retry queue
3. The UI is updated optimistically (e.g., item appears deleted)
4. The retry queue automatically processes failed operations with exponential backoff:
   - First retry: 2 seconds
   - Second retry: 4 seconds
   - Third retry: 8 seconds
   - Fourth retry: 16 seconds
   - Fifth retry: 32 seconds
5. **Intelligent Connectivity Monitoring**:
   - The system continuously monitors internet connectivity and connection type
   - **At startup**: Connectivity is verified before processing begins to prevent infinite loops
   - When no internet is detected, retry processing slows down significantly (30s intervals)
   - When internet connection is restored, processing immediately resumes
   - Connection type changes (WiFi ↔ Mobile) automatically adjust retry speeds
   - This prevents wasting resources on retries that will fail due to no connectivity
6. **Adaptive Retry Strategy**:
   - **WiFi/Ethernet**: Fastest retries (every 5s, 30% faster backoff)
   - **Mobile Data**: Normal retries (every 10s, standard backoff)
   - **Unstable/Other**: Conservative retries (every 30s, 50% slower backoff)
   - When switching from mobile to WiFi, pending operations retry faster automatically
7. **Page-Level Auto-Refresh**: When an operation succeeds, pages can listen to the success stream and refresh
   - Only active/mounted pages refresh (not handled globally)
   - Each page decides how to handle successful retry operations
   - **Smart refresh logic**: Only refreshes when server data is needed
     - ✅ Refreshes on: create item, read list, create list (need server response)
     - ❌ No refresh on: delete operations (UI already updated optimistically)
8. If an operation succeeds, it's removed from the queue
9. If max retries (5) is reached, the operation is dropped
10. Operations persist across app restarts

## Usage

### 1. Initialize the Retry Queue

In your app initialization (e.g., `main.dart` or app setup):

```dart
import 'package:murmli/core/retry/retry_queue_provider.dart';

// Create the retry queue BLoC
final shoppingListApi = ShoppingListApi(dio);
final retryQueueBloc = createRetryQueueBloc(shoppingListApi);
```

### 2. Inject into BLoCs

Pass the retry queue BLoC to any BLoCs that need retry functionality:

```dart
final shoppingListBloc = ShoppingListBloc(
  shoppingListApi,
  retryQueueBloc,
);
```

### 3. Add Operations to Queue

When an API call fails, add it to the retry queue:

```dart
try {
  // Try the operation
  await _apiService.deleteShoppingListItem(...);
} catch (e) {
  // If it fails, add to retry queue
  final operation = RetryOperation(
    id: const Uuid().v4(),
    type: RetryOperationType.deleteShoppingListItem,
    data: {
      'listId': shoppingListId,
      'itemId': itemId,
    },
    createdAt: DateTime.now(),
  );
  
  _retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
}
```

### 4. Listen to Success Events in Pages (Recommended)

Pages can listen to successful retry operations and refresh accordingly. This ensures only active pages refresh:

```dart
class _MyPageState extends State<MyPage> {
  StreamSubscription<RetryOperationType>? _retrySuccessSubscription;

  @override
  void initState() {
    super.initState();
    
    // Listen to retry queue success stream
    final retryQueueBloc = context.read<RetryQueueBloc>();
    _retrySuccessSubscription = retryQueueBloc.operationSuccessStream.listen((operationType) {
      // Only refresh for operations that need server data
      final shouldRefresh = 
          operationType == RetryOperationType.createShoppingListItem ||
          operationType == RetryOperationType.readShoppingList;
      
      // Don't refresh for deletes - UI already updated optimistically
      
      if (shouldRefresh && mounted) {
        print('Shopping list operation succeeded, refreshing');
        context.read<ShoppingListBloc>().add(ShoppingListInitEvent());
      }
    });
  }

  @override
  void dispose() {
    _retrySuccessSubscription?.cancel();
    super.dispose();
  }
}
```

### 5. Monitor Queue Status (Optional)

You can listen to the retry queue state to show UI feedback:

```dart
BlocBuilder<RetryQueueBloc, RetryQueueState>(
  builder: (context, state) {
    return state.maybeWhen(
      loaded: (operations, isProcessing) {
        if (operations.isEmpty) {
          return const SizedBox.shrink();
        }
        return Text('${operations.length} operations pending');
      },
      orElse: () => const SizedBox.shrink(),
    );
  },
)
```

## Supported Operation Types

The retry queue supports the following operation types:

- **`deleteShoppingListItem`** - Delete an item from a shopping list
- **`deleteShoppingList`** - Delete an entire shopping list
- **`createShoppingListItem`** - Create a new shopping list item
- **`readShoppingList`** - Read/fetch a shopping list (queued when init fails)
- **`createShoppingList`** - Create a new shopping list (queued when init fails without listId)

### Init Operations Are Queued Too!

When the shopping list fails to initialize (e.g., no internet at app start):
- If no list ID exists → Queues `createShoppingList` operation
- If list ID exists → Queues `readShoppingList` operation
- When internet is restored → Automatically retries and refreshes the page

## Adding New Operation Types

To add support for a new operation type:

1. Add the operation type to the enum in `retry_operation.dart`:

```dart
enum RetryOperationType {
  deleteShoppingListItem,
  deleteShoppingList,
  createShoppingListItem,
  readShoppingList,
  createShoppingList,
  yourNewOperation, // Add here
}
```

2. Add the execution logic in `retry_queue_bloc.dart`:

```dart
Future<bool> _executeOperation(RetryOperation operation) async {
  try {
    final sessionToken = await AppSecureStorage().getSessionToken();
    
    switch (operation.type) {
      // ... existing cases
      
      case RetryOperationType.yourNewOperation:
        final param1 = operation.data['param1'] as String;
        await _someApi.yourOperation(param1);
        return true;
    }
  } catch (e) {
    return false;
  }
}
```

## Connectivity-Based Retry Behavior

The retry queue intelligently adapts to your connection type for optimal performance:

### Processing Intervals
- **WiFi/Ethernet**: Checks queue every 5 seconds
- **Mobile Data**: Checks queue every 10 seconds  
- **Offline/Unstable**: Checks queue every 30 seconds

### Backoff Multipliers
The exponential backoff is multiplied by a connectivity factor:
- **WiFi/Ethernet**: 0.7x (30% faster)
- **Mobile**: 1.0x (standard)
- **Unstable**: 1.5x (50% slower)
- **Offline**: 2.0x (2x slower)

### Example: Delete Operation on WiFi
- Attempt 1: Immediate
- Retry 1: ~1.4s (2s × 0.7)
- Retry 2: ~2.8s (4s × 0.7)
- Retry 3: ~5.6s (8s × 0.7)
- Retry 4: ~11.2s (16s × 0.7)

### Example: Delete Operation on Mobile
- Attempt 1: Immediate
- Retry 1: 2s
- Retry 2: 4s
- Retry 3: 8s
- Retry 4: 16s

## Configuration

You can adjust retry behavior by modifying constants in `RetryQueueBloc`:

```dart
static const int maxRetries = 5; // Maximum retry attempts
static const Duration initialBackoff = Duration(seconds: 2); // Initial delay

// Adaptive processing intervals
static const Duration processingIntervalWifi = Duration(seconds: 5);
static const Duration processingIntervalMobile = Duration(seconds: 10);
static const Duration processingIntervalOffline = Duration(seconds: 30);
```

## Example: ShoppingList Delete with Retry

Here's how the shopping list delete operation uses the retry queue:

```dart
Future<void> _deleteItem(
  ShoppingListDeleteItemEvent event,
  Emitter<ShoppingListState> emit,
) async {
  final shoppingListId = await AppSecureStorage().getShoppingListId();
  
  // 1. Optimistically update UI
  state.maybeWhen(
    loaded: (shoppingList) {
      final newList = shoppingList.copyWith(
        items: shoppingList.items
            .where((item) => item.id != event.itemId)
            .toList(),
      );
      emit(ShoppingListState.loaded(newList));
    },
    orElse: () => state,
  );

  // 2. Try immediate deletion
  try {
    final sessionToken = await AppSecureStorage().getSessionToken();
    await _apiService.deleteShoppingListItem(
      Env.secretKey,
      'Bearer $sessionToken',
      shoppingListId,
      event.itemId,
    );
  } catch (e) {
    // 3. If fails, add to retry queue
    final operation = RetryOperation(
      id: const Uuid().v4(),
      type: RetryOperationType.deleteShoppingListItem,
      data: {
        'listId': shoppingListId,
        'itemId': event.itemId,
      },
      createdAt: DateTime.now(),
    );
    
    _retryQueueBloc.add(RetryQueueAddOperationEvent(operation: operation));
  }
}
```

## Cleanup

The retry queue BLoC should be properly disposed when no longer needed:

```dart
@override
void dispose() {
  retryQueueBloc.close();
  super.dispose();
}
```

