import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart';

class FileDownloadService {
  static final Dio _dio = Dio();

  /// Holt den echten Documents-Ordner des Benutzers
  static Future<Directory> _getDocumentsDirectory() async {
    if (kIsWeb) {
      // Web: Verwende Downloads-Ordner
      return await getDownloadsDirectory() ??
          await getApplicationDocumentsDirectory();
    } else if (Platform.isWindows) {
      // Windows: Versuche verschiedene Documents-Ordner
      final userProfile = Platform.environment['USERPROFILE'];
      if (userProfile != null) {
        // Versuche verschiedene mögliche Documents-Ordner
        final possiblePaths = [
          '$userProfile\\Documents',
          '$userProfile\\OneDrive\\Documents',
          '$userProfile\\OneDrive - Personal\\Documents',
        ];

        for (final path in possiblePaths) {
          final dir = Directory(path);
          if (await dir.exists()) {
            print('Documents-Ordner gefunden: $path');
            return dir;
          } else {
            print('Documents-Ordner existiert nicht: $path');
          }
        }
        print('Kein Documents-Ordner gefunden, verwende Fallback');

        // Fallback: Downloads-Ordner
        final downloadsDir = await getDownloadsDirectory();
        if (downloadsDir != null) {
          print('Verwende Downloads-Ordner: ${downloadsDir.path}');
          return downloadsDir;
        }

        // Letzter Fallback: Desktop-Ordner
        final desktopPath = '$userProfile\\Desktop';
        print('Verwende Desktop-Ordner: $desktopPath');
        return Directory(desktopPath);
      }

      // Falls USERPROFILE nicht verfügbar ist
      final downloadsDir = await getDownloadsDirectory();
      if (downloadsDir != null) {
        return downloadsDir;
      }

      return await getApplicationDocumentsDirectory();
    } else if (Platform.isMacOS) {
      // macOS: Verwende den echten Documents-Ordner
      final userHome = Platform.environment['HOME'];
      if (userHome != null) {
        final documentsPath = '$userHome/Documents';
        final documentsDir = Directory(documentsPath);
        if (await documentsDir.exists()) {
          return documentsDir;
        }
      }
      // Fallback zu App Documents
      return await getApplicationDocumentsDirectory();
    } else if (Platform.isLinux) {
      // Linux: Verwende den echten Documents-Ordner
      final userHome = Platform.environment['HOME'];
      if (userHome != null) {
        final documentsPath = '$userHome/Documents';
        final documentsDir = Directory(documentsPath);
        if (await documentsDir.exists()) {
          return documentsDir;
        }
      }
      // Fallback zu App Documents
      return await getApplicationDocumentsDirectory();
    } else {
      // Mobile: Verwende App Documents
      return await getApplicationDocumentsDirectory();
    }
  }

  /// Lädt eine Datei von einer URL herunter und speichert sie lokal
  static Future<String?> downloadFile({
    required String url,
    required String fileName,
    void Function(double)? onProgress,
  }) async {
    try {
      // Berechtigung für Speicherzugriff anfordern
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        throw Exception('Storage permission denied');
      }

      // App-spezifisches Verzeichnis im Documents-Ordner erstellen
      final directory = await _getDocumentsDirectory();
      final appDir = Directory('${directory.path}/Murmli');
      if (!await appDir.exists()) {
        await appDir.create(recursive: true);
      }

      final filePath = '${appDir.path}\\$fileName';
      print('Finaler Dateipfad: $filePath');

      // Datei herunterladen
      await _dio.download(
        url,
        filePath,
        onReceiveProgress: (received, total) {
          if (total != -1 && onProgress != null) {
            onProgress(received / total);
          }
        },
      );

      return filePath;
    } catch (e) {
      throw Exception('Download failed: $e');
    }
  }

  /// Lädt eine Datei als Bytes herunter
  static Future<Uint8List> downloadFileAsBytes(String url) async {
    try {
      final response = await _dio.get<List<int>>(
        url,
        options: Options(responseType: ResponseType.bytes),
      );
      return Uint8List.fromList(response.data!);
    } catch (e) {
      throw Exception('Download failed: $e');
    }
  }

  /// Speichert Bytes als Datei
  static Future<String> saveBytesToFile({
    required Uint8List bytes,
    required String fileName,
  }) async {
    try {
      final directory = await _getDocumentsDirectory();
      final appDir = Directory('${directory.path}/Murmli');
      if (!await appDir.exists()) {
        await appDir.create(recursive: true);
      }

      final filePath = '${appDir.path}\\$fileName';
      final file = File(filePath);
      await file.writeAsBytes(bytes);

      return filePath;
    } catch (e) {
      throw Exception('Save failed: $e');
    }
  }
}
