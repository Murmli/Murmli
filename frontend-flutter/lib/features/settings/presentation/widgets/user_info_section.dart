import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/api/provider/session_provider.dart';
import 'package:murmli/api/provider/user/user_providers.dart';
import 'package:murmli/core/utils/error_message.dart';
import 'package:murmli/i18n/translations.g.dart';

class UserInfoSection extends ConsumerWidget {
  const UserInfoSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userIdAsync = ref.watch(userIdProvider);
    final session = ref.watch(sessionProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Session Status
        session.when(
          data: (token) => Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: token == null
                  ? Theme.of(context).colorScheme.errorContainer
                  : Theme.of(context).colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  token == null
                      ? Icons.error_outline
                      : Icons.check_circle_outline,
                  color: token == null
                      ? Theme.of(context).colorScheme.onErrorContainer
                      : Theme.of(context).colorScheme.onPrimaryContainer,
                ),
                const SizedBox(width: 8),
                Text(
                  token == null ? t.errors.no_valid_session : t.home.logged_in,
                  style: TextStyle(
                    color: token == null
                        ? Theme.of(context).colorScheme.onErrorContainer
                        : Theme.of(context).colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(8),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (e, _) => Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              humanizeError(e),
              style: TextStyle(
                color: Theme.of(context).colorScheme.onErrorContainer,
              ),
            ),
          ),
        ),

        const SizedBox(height: 16),

        // User ID
        userIdAsync.when(
          data: (userIdResponse) {
            if (userIdResponse?.id == null) {
              return Text(
                t.settings.user_id_not_available,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                ),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t.settings.user_id,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(
                      context,
                    ).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Theme.of(context).colorScheme.outline,
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          userIdResponse!.id,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                fontFamily: 'monospace',
                              ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy, size: 20),
                        onPressed: () =>
                            _copyToClipboard(context, userIdResponse.id),
                        tooltip: t.settings.copy_user_id,
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (e, _) => Column(
            children: [
              Text(
                humanizeError(e),
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                ),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.read(userIdProvider.notifier).loadId(),
                child: Text(t.common.retry),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Session Security Buttons
        Row(
          children: [
            ElevatedButton.icon(
              onPressed: () async {
                await ref.read(sessionProvider.notifier).ensureValidSession();
                // await ref.read(userLanguageProvider.notifier).loadLanguage();
              },
              icon: const Icon(Icons.security, size: 18),
              label: Text(t.home.ensure_session),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _copyToClipboard(BuildContext context, String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(t.settings.user_id_copied),
          backgroundColor: Theme.of(context).colorScheme.primary,
        ),
      );
    }
  }
}
