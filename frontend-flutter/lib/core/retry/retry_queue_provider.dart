import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:murmli/api/shopping_list_api.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_queue_storage.dart';

/// Factory function to create RetryQueueBloc
/// This should be called once during app initialization
RetryQueueBloc createRetryQueueBloc(ShoppingListApi shoppingListApi) {
  const secureStorage = FlutterSecureStorage();
  final storage = RetryQueueStorage(secureStorage);
  final bloc = RetryQueueBloc(storage, shoppingListApi);
  
  // Initialize the bloc to load persisted operations
  bloc.add(RetryQueueInitEvent());
  
  return bloc;
}

