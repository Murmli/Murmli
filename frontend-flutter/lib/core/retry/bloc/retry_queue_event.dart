part of 'retry_queue_bloc.dart';

@immutable
sealed class RetryQueueEvent {}

/// Initialize the retry queue and load persisted operations
class RetryQueueInitEvent extends RetryQueueEvent {}

/// Add a new operation to the retry queue
class RetryQueueAddOperationEvent extends RetryQueueEvent {
  final RetryOperation operation;

  RetryQueueAddOperationEvent({required this.operation});
}

/// Process all pending operations in the queue
class RetryQueueProcessEvent extends RetryQueueEvent {}

/// Remove a specific operation from the queue
class RetryQueueRemoveOperationEvent extends RetryQueueEvent {
  final String operationId;

  RetryQueueRemoveOperationEvent({required this.operationId});
}

/// Clear all operations from the queue
class RetryQueueClearEvent extends RetryQueueEvent {}

/// Event emitted when an operation succeeds (for external listeners)
class RetryQueueOperationSucceededEvent extends RetryQueueEvent {
  final RetryOperationType operationType;

  RetryQueueOperationSucceededEvent({required this.operationType});
}

