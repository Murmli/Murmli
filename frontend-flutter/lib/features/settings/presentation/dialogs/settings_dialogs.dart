import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/i18n/translations.g.dart';
import '../widgets/danger_zone_section.dart';

class SettingsDialogs {


  static Future<bool> showImportConfirmationDialog(
    BuildContext context,
    String fileName,
  ) async {
    return await showDialog<bool>(
          context: context,
          builder: (BuildContext dialogContext) {
            return AlertDialog(
              title: Text(t.settings.import_confirm_title),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.upload_file, size: 48, color: Colors.orange),
                  const SizedBox(height: 16),
                  Text(t.settings.import_confirm_description),
                  const SizedBox(height: 8),
                  Text(
                    fileName,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.errorContainer.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Theme.of(
                          context,
                        ).colorScheme.error.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.warning,
                          color: Theme.of(context).colorScheme.error,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            t.settings.import_warning,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: Text(t.common.cancel),
                ),
                ElevatedButton.icon(
                  icon: const Icon(Icons.upload),
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  label: Text(t.settings.import_confirm),
                ),
              ],
            );
          },
        ) ??
        false;
  }

  static void showDeleteDataDialog(BuildContext context, WidgetRef ref) {
    showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: Text(t.settings.danger_zone.delete_all_data),
          content: Text(t.settings.danger_zone.delete_confirm),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(t.common.cancel),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error,
                foregroundColor: Theme.of(context).colorScheme.onError,
              ),
              onPressed: () async {
                Navigator.of(dialogContext).pop();
                // Kleine Verzögerung, um sicherzustellen, dass der Dialog vollständig geschlossen ist
                await Future<void>.delayed(const Duration(milliseconds: 100));
                await DangerZoneActions.deleteAllData(context, ref);
              },
              child: Text(t.common.delete),
            ),
          ],
        );
      },
    );
  }
}
