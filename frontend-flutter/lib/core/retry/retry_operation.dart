import 'package:freezed_annotation/freezed_annotation.dart';

part 'retry_operation.freezed.dart';
part 'retry_operation.g.dart';

/// Represents a type of operation that can be retried
enum RetryOperationType {
  deleteShoppingListItem,
  deleteShoppingList,
  createShoppingListItem,
  readShoppingList,
  createShoppingList,
  toggleShoppingListItem,
  deleteAllCheckedShoppingListItems,
  // Add more operation types as needed
}

/// Model representing an operation that can be retried
@freezed
abstract class RetryOperation with _$RetryOperation {
  const factory RetryOperation({
    required String id,
    required RetryOperationType type,
    required Map<String, dynamic> data,
    required DateTime createdAt,
    @Default(0) int retryCount,
    DateTime? lastRetryAt,
    @Default(false) bool isRetrying,
  }) = _RetryOperation;

  factory RetryOperation.fromJson(Map<String, dynamic> json) =>
      _$RetryOperationFromJson(json);
}

