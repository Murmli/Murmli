import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

part 'session_api.g.dart';

@RestApi()
abstract class SessionApi {
  factory SessionApi(Dio dio, {String baseUrl}) = _SessionApi;

  @POST('session/create')
  Future<HttpResponse<dynamic>> createSession(
    @Header('X-Header-Secret-Key') String secretKey,
    @Body() Map<String, dynamic> body,
  );

  @POST('session/login')
  Future<HttpResponse<dynamic>> login(
    @Header('X-Header-Secret-Key') String secretKey,
    @Header('Authorization') String authorization,
  );
}
