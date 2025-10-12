import 'package:dio/dio.dart';
import 'package:native_dio_adapter/native_dio_adapter.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/api/api_client.dart';
import 'package:murmli/api/session_api.dart';
import 'package:murmli/api/user_api.dart';
import 'package:murmli/core/config/config_provider.dart';

part 'api_providers.g.dart';

@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final client = ApiClient(baseUrl: apiConfig.baseUrl);
  final dio = client.createDio();
  dio.httpClientAdapter = NativeAdapter();
  return dio;
}

@Riverpod(keepAlive: true)
SessionApi sessionApi(Ref ref) {
  return SessionApi(ref.watch(dioProvider), baseUrl: apiConfig.baseUrl);
}

@Riverpod(keepAlive: true)
UserApi userApi(Ref ref) {
  return UserApi(ref.watch(dioProvider), baseUrl: apiConfig.baseUrl);
}
