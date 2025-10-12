import 'package:dio/dio.dart';
import 'package:murmli/i18n/translations.g.dart';

String humanizeError(Object error) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return t.errors.connection_error;
      case DioExceptionType.badResponse:
        if (status == 401) {
          return t.errors.unauthorized;
        }
        if (status == 403) {
          return t.errors.forbidden;
        }
        if (status == 404) {
          return t.errors.not_found;
        }
        if (status == 500) {
          return t.errors.server_error;
        }
        return t.errors.unknown.replaceAll(
          '{message}',
          'Unerwartete Serverantwort (${status ?? 'unbekannt'})',
        );
      case DioExceptionType.cancel:
        return t.common.cancel;
      case DioExceptionType.badCertificate:
        return 'Certificate error: The server certificate is invalid.';
      case DioExceptionType.unknown:
        return t.errors.unknown.replaceAll(
          '{message}',
          'Bitte erneut versuchen',
        );
    }
  }
  return t.errors.unknown.replaceAll('{message}', 'Unerwarteter Fehler');
}
