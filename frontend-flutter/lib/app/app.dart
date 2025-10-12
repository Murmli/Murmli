import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:murmli/core/routes/app_router.dart';
import 'package:murmli/core/routes/guards/startup_guard.dart';
import 'package:murmli/core/routes/router_reeval_listenable.dart';
import 'package:murmli/i18n/translations.g.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:toastification/toastification.dart';

class MurmliApp extends StatefulWidget {
  const MurmliApp({super.key});

  @override
  State<MurmliApp> createState() => _MurmliAppState();
}

class _MurmliAppState extends State<MurmliApp> {
  AppRouter? _appRouter;
  RouterReevalListenable? _reeval;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Container aus dem aktuellen ProviderScope beziehen
    final container = ProviderScope.containerOf(context, listen: false);
    _reeval ??= RouterReevalListenable(container);
    _appRouter ??= AppRouter(startupGuard: StartupGuard(container));
  }

  @override
  void dispose() {
    _reeval?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TranslationProvider(
      child: Builder(
        builder: (context) => ToastificationWrapper(
          child: MaterialApp.router(
            debugShowCheckedModeBanner: false,
            routerConfig: _appRouter!.config(
              reevaluateListenable: _reeval,
            ),
            locale: TranslationProvider.of(context).flutterLocale,
            supportedLocales: AppLocaleUtils.supportedLocales,
            localizationsDelegates: GlobalMaterialLocalizations.delegates,
            themeMode: ThemeMode.system,
            darkTheme: ThemeData.dark(),
            theme: ThemeData.light(),
          ),
        ),
      ),
    );
  }
}
