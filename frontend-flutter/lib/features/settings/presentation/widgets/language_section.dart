import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/api/provider/user/user_providers.dart';
import 'package:murmli/components/language_selector.dart';
import 'package:murmli/i18n/translations.g.dart';

class LanguageSection extends ConsumerWidget {
  const LanguageSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final languageAsync = ref.watch(userLanguageProvider);

    return languageAsync.when(
      data: (languageResponse) => LanguageSelector(
        currentLanguage: languageResponse?.language ?? 'de',
        showTitle: false,
        showSnackbar: true,
        compact: false,
        searchable: true,
      ),
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (error, stack) => Column(
        children: [
          Text(
            'Fehler beim Laden der Spracheinstellung: $error',
            style: TextStyle(
              color: Theme.of(context).colorScheme.error,
            ),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => ref.invalidate(userLanguageProvider),
            child: Text(t.common.retry),
          ),
        ],
      ),
    );
  }
}
