import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/core/storage/preferences_provider.dart';
import 'package:murmli/components/language_selector.dart';
import 'package:murmli/core/i18n/current_locale_provider.dart';
import 'package:murmli/i18n/translations.g.dart';
import 'package:murmli/core/routes/app_router.gr.dart';
import 'package:murmli/api/provider/session_provider.dart';

@RoutePage()
class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  bool _isLoading = false;

  Future<void> _choose(String lang) async {
    if (_isLoading) return;
    
    setState(() {
      _isLoading = true;
    });

    try {
      await ref.read(preferredLanguageProvider.notifier).set(lang);
      // Aktualisiere die aktuelle Locale sofort für UI-Update
      ref.read(currentLocaleProvider.notifier).updateLocaleFromString(lang);
      
      // Erstelle eine Backend-Session mit der gewählten Sprache
      try {
        await ref.read(sessionProvider.notifier).ensureValidSession(language: lang);
      } catch (e) {
        print('Fehler beim Erstellen der Session: $e');
        // Session-Fehler nicht blockierend - User kann App trotzdem nutzen
      }
      
      // Nach Sprachwahl zur Navigation-Setup-Seite
      if (mounted) {
        context.router.push(const OnboardingNavigationRoute());
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Überwache die aktuelle Sprache, um bei Änderungen neu zu bauen
    ref.watch(currentLocaleProvider);

    return Scaffold(
      appBar: AppBar(title: Text(t.onboarding.title)),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.onboarding.choose_language),
                const SizedBox(height: 16),
                IgnorePointer(
                  ignoring: _isLoading,
                  child: Opacity(
                    opacity: _isLoading ? 0.5 : 1.0,
                    child: LanguageSelector(
                      currentLanguage: 'de', // Default language
                      onLanguageChanged: (String newLanguage) {
                        _choose(newLanguage);
                      },
                      showTitle: false,
                      showSnackbar: false,
                      compact: true,
                      searchable: true,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black.withValues(alpha: 0.3),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }
}
