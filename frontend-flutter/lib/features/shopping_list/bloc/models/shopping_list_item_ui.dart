import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:murmli/api/models/shopping_list_models.dart';

part 'shopping_list_item_ui.freezed.dart';

/// UI state for shopping list items
/// Tracks loading, success, and error states for optimistic updates
enum ShoppingListItemStatus {
  /// Item is being created/updated on the server
  loading,
  
  /// Item successfully synced with server
  success,
  
  /// Item failed to sync, needs retry
  error,
}

/// Wrapper for ShoppingListItem with UI state information
@freezed
abstract class ShoppingListItemUI with _$ShoppingListItemUI {
  const factory ShoppingListItemUI({
    /// The actual shopping list item data
    required ShoppingListItem item,
    
    /// Current status of the item
    @Default(ShoppingListItemStatus.success) ShoppingListItemStatus status,
    
    /// Temporary ID for optimistic updates (before server assigns real ID)
    String? tempId,
    
    /// Error message if status is error
    String? errorMessage,
  }) = _ShoppingListItemUI;
  
  const ShoppingListItemUI._();
  
  /// Check if item is in loading state
  bool get isLoading => status == ShoppingListItemStatus.loading;
  
  /// Check if item has an error
  bool get hasError => status == ShoppingListItemStatus.error;
  
  /// Check if item is successfully synced
  bool get isSuccess => status == ShoppingListItemStatus.success;
  
  /// Get the display ID (tempId if exists, otherwise real ID)
  String? get displayId => tempId ?? item.id;
}

