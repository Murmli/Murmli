import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const sessionTokenKey = 'session_token';
const shoppingListIdKey = 'shopping_list_id';

class AppSecureStorage {
  final FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  AppSecureStorage();

  Future<String?> getSessionToken() async {
    return await _secureStorage.read(key: sessionTokenKey);
  }

  Future<void> setSessionToken(String token) async {
    await _secureStorage.write(key: sessionTokenKey, value: token);
  }

  Future<void> deleteSessionToken() async {
    await _secureStorage.delete(key: sessionTokenKey);
  }

  Future<String?> getShoppingListId() async {
    return await _secureStorage.read(key: shoppingListIdKey);
  }

  Future<void> setShoppingListId(String id) async {
    await _secureStorage.write(key: shoppingListIdKey, value: id);
  }

  Future<void> deleteShoppingListId() async {
    await _secureStorage.delete(key: shoppingListIdKey);
  }

  Future<void> clear() async {
    await _secureStorage.deleteAll();
  }
}
