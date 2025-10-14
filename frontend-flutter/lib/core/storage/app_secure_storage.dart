import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const sessionTokenKey = 'session_token';
const shoppingListIdKey = 'shopping_list_id';
const importTokenKey = 'import_token';

class AppSecureStorage {
  final FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  AppSecureStorage();


  // Session Token
  Future<String?> getSessionToken() async {
    return await _secureStorage.read(key: sessionTokenKey);
  }

  Future<void> setSessionToken(String token) async {
    await _secureStorage.write(key: sessionTokenKey, value: token);
  }

  Future<void> deleteSessionToken() async {
    await _secureStorage.delete(key: sessionTokenKey);
  }

  // Shopping List ID
  Future<String?> getShoppingListId() async {
    return await _secureStorage.read(key: shoppingListIdKey);
  }

  Future<void> setShoppingListId(String id) async {
    await _secureStorage.write(key: shoppingListIdKey, value: id);
  }

  Future<void> deleteShoppingListId() async {
    await _secureStorage.delete(key: shoppingListIdKey);
  }

  // Import Token
  Future<String?> getImportToken() async {
    return await _secureStorage.read(key: importTokenKey);
  }
  
  Future<void> setImportToken(String token) async {
    await _secureStorage.write(key: importTokenKey, value: token);
  }

  Future<void> deleteImportToken() async {
    await _secureStorage.delete(key: importTokenKey);
  }

  // Clear all
  Future<void> clear() async {
    await _secureStorage.deleteAll();
  }
}
