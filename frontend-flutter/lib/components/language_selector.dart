import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/core/i18n/available_locales.dart';
import 'package:murmli/core/i18n/locale_sync_provider.dart';
import 'package:murmli/core/i18n/current_locale_provider.dart';
import 'package:murmli/i18n/translations.g.dart';

/// Wiederverwendbare Komponente für die Sprachauswahl
class LanguageSelector extends ConsumerStatefulWidget {
  final String? currentLanguage;
  final void Function(String)? onLanguageChanged;
  final bool showTitle;
  final String? title;
  final bool showSnackbar;
  final bool compact;
  final bool searchable;

  const LanguageSelector({
    super.key,
    this.currentLanguage,
    this.onLanguageChanged,
    this.showTitle = true,
    this.title,
    this.showSnackbar = true,
    this.compact = false,
    this.searchable = false,
  });

  @override
  ConsumerState<LanguageSelector> createState() => _LanguageSelectorState();
}

class _LanguageSelectorState extends ConsumerState<LanguageSelector> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text.toLowerCase();
    });
  }

  Map<String, String> _filterLanguages(Map<String, String> languages) {
    if (_searchQuery.isEmpty) return languages;

    return Map.fromEntries(
      languages.entries.where((entry) {
        final languageName = entry.value.toLowerCase();
        final languageCode = entry.key.toLowerCase();
        return languageName.contains(_searchQuery) ||
            languageCode.contains(_searchQuery);
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final effectiveTitle = widget.title ?? t.settings.language.title;
    final effectiveCurrentLanguage = widget.currentLanguage ?? 'de';
    final filteredLanguages = _filterLanguages(availableLocales);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.showTitle) ...[
          Row(
            children: [
              const Icon(Icons.language),
              const SizedBox(width: 12),
              Text(
                effectiveTitle,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
        if (widget.searchable) ...[
          _buildSearchField(context),
          const SizedBox(height: 16),
        ],
        _buildLanguageList(
          context,
          ref,
          filteredLanguages,
          effectiveCurrentLanguage,
        ),
      ],
    );
  }

  Widget _buildSearchField(BuildContext context) {
    return TextField(
      controller: _searchController,
      decoration: InputDecoration(
        hintText: t.settings.search_languages,
        prefixIcon: const Icon(Icons.search),
        suffixIcon: _searchQuery.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear),
                onPressed: () {
                  _searchController.clear();
                },
              )
            : null,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),
    );
  }

  Widget _buildLanguageList(
    BuildContext context,
    WidgetRef ref,
    Map<String, String> languages,
    String currentLanguage,
  ) {
    if (widget.compact) {
      return _buildCompactLanguageList(
        context,
        ref,
        languages,
        currentLanguage,
      );
    } else {
      return _buildFullLanguageList(
        context,
        ref,
        languages,
        currentLanguage,
      );
    }
  }

  Widget _buildFullLanguageList(
    BuildContext context,
    WidgetRef ref,
    Map<String, String> languages,
    String currentLanguage,
  ) {
    return RadioGroup<String>(
      groupValue: currentLanguage,
      onChanged: (String? value) {
        if (value != null) {
          _updateLanguage(context, ref, value);
        }
      },
      child: Column(
        children: [
          ...languages.entries.map((entry) {
            final isSelected = entry.key == currentLanguage;
            return RadioListTile<String>(
              title: Text(entry.value),
              subtitle: Text(entry.key.toUpperCase()),
              value: entry.key,
              secondary: isSelected
                  ? Icon(
                      Icons.check_circle,
                      color: Theme.of(context).colorScheme.primary,
                    )
                  : null,
            );
          }),
        ],
      ),
    );
  }

  Widget _buildCompactLanguageList(
    BuildContext context,
    WidgetRef ref,
    Map<String, String> languages,
    String currentLanguage,
  ) {
    if (languages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            t.settings.no_languages_found,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    return Wrap(
      spacing: 12,
      runSpacing: 8,
      children: languages.entries.map((entry) {
        final isSelected = entry.key == currentLanguage;
        return ElevatedButton(
          onPressed: () {
            _updateLanguage(context, ref, entry.key);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: isSelected
                ? Theme.of(context).colorScheme.primary
                : Theme.of(context).colorScheme.surface,
            foregroundColor: isSelected
                ? Theme.of(context).colorScheme.onPrimary
                : Theme.of(context).colorScheme.onSurface,
          ),
          child: Text(entry.value),
        );
      }).toList(),
    );
  }

  Future<void> _updateLanguage(
    BuildContext context,
    WidgetRef ref,
    String newLanguage,
  ) async {
    try {
      // Rufe den Callback zuerst auf, falls vorhanden
      widget.onLanguageChanged?.call(newLanguage);

      // Aktualisiere die aktuelle Locale sofort für UI-Update
      ref
          .read(currentLocaleProvider.notifier)
          .updateLocaleFromString(newLanguage);

      // Verwende den Sync-Provider für Backend-Synchronisation
      await ref.read(localeSyncProvider.notifier).syncToBackend(newLanguage);

      if (context.mounted && widget.showSnackbar) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.messages.language_changed.replaceAll(
                '{language}',
                _getLanguageName(newLanguage, ref),
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.primary,
          ),
        );
      }
    } catch (e) {
      if (context.mounted && widget.showSnackbar) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t.messages.error_changing_language.replaceAll(
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

  String _getLanguageName(String languageCode, WidgetRef ref) {
    return availableLocales[languageCode] ?? languageCode.toUpperCase();
  }
}
