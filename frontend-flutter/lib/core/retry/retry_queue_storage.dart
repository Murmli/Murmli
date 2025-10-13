import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'retry_operation.dart';

/// Storage service for persisting retry operations
class RetryQueueStorage {
  static const String _storageKey = 'retry_queue';
  final FlutterSecureStorage _secureStorage;

  RetryQueueStorage(this._secureStorage);

  /// Save all retry operations to secure storage
  Future<void> saveOperations(List<RetryOperation> operations) async {
    final jsonList = operations.map((op) => op.toJson()).toList();
    final jsonString = jsonEncode(jsonList);
    await _secureStorage.write(key: _storageKey, value: jsonString);
  }

  /// Load all retry operations from secure storage
  Future<List<RetryOperation>> loadOperations() async {
    final jsonString = await _secureStorage.read(key: _storageKey);
    if (jsonString == null || jsonString.isEmpty) {
      return [];
    }

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => RetryOperation.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      // If there's an error parsing, return empty list and clear storage
      await _secureStorage.delete(key: _storageKey);
      return [];
    }
  }

  /// Clear all retry operations from storage
  Future<void> clearOperations() async {
    await _secureStorage.delete(key: _storageKey);
  }
}

