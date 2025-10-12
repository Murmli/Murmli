import 'package:murmli/core/env/env.dart';

class ApiConfig {
  final String baseUrl;
  final String secretKey;
  final String defaultLanguage;

  const ApiConfig({
    required this.baseUrl,
    required this.secretKey,
    this.defaultLanguage = 'de',
  });
}

/// Konfiguration aus .env (via Envied generiert)
final apiConfig = ApiConfig(
  baseUrl: Env.apiBaseUrl,
  secretKey: Env.secretKey,
  // defaultLanguage kommt aus SharedPreferences (siehe PreferredLanguage);
  // hier nur Fallback über den Default im Konstruktor ('de').
);
