import 'package:freezed_annotation/freezed_annotation.dart';
import '../retry_operation.dart';

part 'retry_queue_state.freezed.dart';

@freezed
class RetryQueueState with _$RetryQueueState {
  const factory RetryQueueState.initial() = _Initial;
  
  const factory RetryQueueState.loaded({
    required List<RetryOperation> operations,
    @Default(false) bool isProcessing,
  }) = _Loaded;
  
  const factory RetryQueueState.error(String message) = _Error;
}

