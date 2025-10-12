import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/api/provider/user/user_providers.dart';
import 'package:murmli/core/services/file_download_service.dart';
import 'package:murmli/i18n/translations.g.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import '../dialogs/settings_dialogs.dart';

class DataManagementSection extends ConsumerWidget {
  const DataManagementSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Murmli Ordnerpfad
        _buildMurmliDirectoryPath(context),
        const SizedBox(height: 24),

        // Export/Import Buttons
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                icon: const Icon(Icons.download),
                onPressed: () => _exportData(context, ref),
                label: Text(t.settings.export_data),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                icon: const Icon(Icons.upload),
                onPressed: () => _importData(context, ref),
                label: Text(t.settings.import_data),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMurmliDirectoryPath(BuildContext context) {
    return FutureBuilder<String>(
      future: _getMurmliDirectoryPath(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 12),
                  Text(t.settings.loading_folder_path),
                ],
              ),
            ),
          );
        }

        if (snapshot.hasError) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    color: Theme.of(context).colorScheme.error,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      t.settings.folder_path_error.replaceAll(
                        '{error}',
                        '${snapshot.error}',
                      ),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        final directoryPath = snapshot.data ?? t.settings.unknown_folder_path;

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.folder_outlined,
                      color: Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      t.settings.murmli_folder,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 20),
                      onPressed: () => _copyToClipboard(context, directoryPath),
                      tooltip: t.settings.copy_path_tooltip,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () => _copyToClipboard(context, directoryPath),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Theme.of(
                          context,
                        ).colorScheme.outline.withValues(alpha: 0.2),
                      ),
                    ),
                    child: SelectableText(
                      directoryPath,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontFamily: t.settings.monospace_font,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  t.settings.folder_path_help,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<String> _getMurmliDirectoryPath() async {
    try {
      // Verwende die gleiche Logik wie FileDownloadService
      final directory = await _getDocumentsDirectory();
      final murmliDir = Directory('${directory.path}/Murmli');

      // Erstelle den Ordner falls er nicht existiert
      if (!await murmliDir.exists()) {
        await murmliDir.create(recursive: true);
      }

      return murmliDir.path;
    } catch (e) {
      throw Exception(
        t.settings.folder_path_error.replaceAll('{error}', e.toString()),
      );
    }
  }

  Future<Directory> _getDocumentsDirectory() async {
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
            return dir;
          }
        }

        // Fallback: Downloads-Ordner
        final downloadsDir = await getDownloadsDirectory();
        if (downloadsDir != null) {
          return downloadsDir;
        }

        // Letzter Fallback: Desktop-Ordner
        final desktopPath = '$userProfile\\Desktop';
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

  Future<void> _copyToClipboard(BuildContext context, String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(t.settings.path_copied_success),
          backgroundColor: Theme.of(context).colorScheme.primary,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _exportData(BuildContext context, WidgetRef ref) async {
    try {
      // Zeige Loading-Dialog
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      // Starte Export
      final exportResponse = await ref
          .read(userDataExportProvider.notifier)
          .startExport();

      if (context.mounted) {
        Navigator.of(context).pop(); // Schließe Loading-Dialog

        if (exportResponse?.link != null) {
          // Lade die Datei herunter und teile sie
          await _downloadAndShareFile(context, exportResponse!.link);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                t.settings.export_error.replaceAll(
                  '{error}',
                  t.settings.no_download_link,
                ),
              ),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context).pop(); // Schließe Loading-Dialog falls noch offen
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.settings.export_error.replaceAll('{error}', e.toString()),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  Future<void> _downloadAndShareFile(
    BuildContext context,
    String downloadUrl,
  ) async {
    try {
      // Zeige Download-Progress
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(t.settings.downloading_export),
            ],
          ),
        ),
      );

      // Lade Datei herunter
      final fileName =
          'murmli_export_${DateTime.now().millisecondsSinceEpoch}.json';
      final filePath = await FileDownloadService.downloadFile(
        url: downloadUrl,
        fileName: fileName,
        onProgress: (progress) {
          // Hier könnte man einen Progress-Bar anzeigen
        },
      );

      if (context.mounted) {
        Navigator.of(context).pop(); // Schließe Loading-Dialog

        if (filePath != null) {
          // Teile die Datei über das System-Share-Dialog
          await _shareFile(context, filePath, fileName);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                t.settings.export_download_error.replaceAll(
                  '{error}',
                  t.settings.failed_to_download,
                ),
              ),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context).pop(); // Schließe Loading-Dialog falls noch offen
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.settings.export_download_error.replaceAll(
                '{error}',
                e.toString(),
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  Future<void> _shareFile(
    BuildContext context,
    String filePath,
    String fileName,
  ) async {
    try {
      final file = XFile(filePath);
      final result = await SharePlus.instance.share(
        ShareParams(
          files: [file],
          text: t.settings.murmli_export_text.replaceAll(
            '{fileName}',
            fileName,
          ),
          subject: t.settings.murmli_export_subject,
        ),
      );

      if (context.mounted) {
        if (result.status == ShareResultStatus.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(t.settings.export_shared_success),
              backgroundColor: Theme.of(context).colorScheme.primary,
            ),
          );
        } else if (result.status == ShareResultStatus.dismissed) {
          // Benutzer hat das Teilen abgebrochen - das ist okay
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(t.settings.export_saved_locally),
              backgroundColor: Theme.of(context).colorScheme.primary,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.settings.export_share_error.replaceAll('{error}', e.toString()),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  Future<void> _importData(BuildContext context, WidgetRef ref) async {
    try {
      // Zeige Datei-Picker
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
        allowMultiple: false,
      );

      if (result == null || result.files.isEmpty) {
        return; // Benutzer hat abgebrochen
      }

      final file = result.files.first;
      if (file.path == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.settings.import_error.replaceAll(
                '{error}',
                'File path is null',
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
        return;
      }

      // Zeige Import-Confirmation Dialog
      final shouldImport = await SettingsDialogs.showImportConfirmationDialog(
        context,
        file.name,
      );
      if (!shouldImport) return;

      // Zeige Loading-Dialog
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(t.settings.importing_data),
            ],
          ),
        ),
      );

      // Lade Datei und importiere
      final fileContent = await File(file.path!).readAsString();

      // Prüfe, ob Datei leer ist
      if (fileContent.trim().isEmpty) {
        if (context.mounted) {
          Navigator.of(context).pop(); // Schließe Loading-Dialog
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                t.settings.import_error.replaceAll('{error}', 'File is empty'),
              ),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
        return;
      }

      // Parse JSON-Daten
      final Map<String, dynamic> parsedData;
      try {
        final decoded = jsonDecode(fileContent);
        if (decoded is! Map<String, dynamic>) {
          throw Exception('JSON is not a valid object');
        }
        parsedData = decoded;
      } catch (e) {
        if (context.mounted) {
          Navigator.of(context).pop(); // Schließe Loading-Dialog
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                t.settings.import_error.replaceAll(
                  '{error}',
                  'Invalid JSON format: ${e.toString()}',
                ),
              ),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
        return;
      }

      // Validiere, dass die erforderlichen Felder vorhanden sind
      if (!parsedData.containsKey('user')) {
        if (context.mounted) {
          Navigator.of(context).pop(); // Schließe Loading-Dialog
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                t.settings.import_error.replaceAll(
                  '{error}',
                  'Missing user data in import file',
                ),
              ),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
        return;
      }

      final importResponse = await ref
          .read(userDataExportProvider.notifier)
          .importData(parsedData);

      if (context.mounted) {
        Navigator.of(context).pop(); // Schließe Loading-Dialog

        if (importResponse != null) {
          // Erfolgreicher Import
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                t.settings.import_success.replaceAll(
                  '{count}',
                  (importResponse.importedItems ?? 0).toString(),
                ),
              ),
              backgroundColor: Theme.of(context).colorScheme.primary,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                t.settings.import_error.replaceAll(
                  '{error}',
                  t.settings.no_server_response,
                ),
              ),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context).pop(); // Schließe Loading-Dialog falls noch offen
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.settings.import_error.replaceAll('{error}', e.toString()),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
}
