import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:murmli/api/shopping_list_api.dart';
import 'package:murmli/core/retry/bloc/retry_queue_bloc.dart';
import 'package:murmli/core/retry/retry_queue_provider.dart';
import 'package:murmli/core/routes/app_router.dart';
import 'package:murmli/core/routes/guards/startup_guard.dart';
import 'package:murmli/features/shopping_list/bloc/shopping_list_bloc.dart';
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

  // BLoC instances
  late final ShoppingListApi _shoppingListApi;
  late final RetryQueueBloc _retryQueueBloc;
  late final ShoppingListBloc _shoppingListBloc;

  @override
  void initState() {
    super.initState();

    // Initialize API and BLoCs
    _shoppingListApi = ShoppingListApi(Dio());
    _retryQueueBloc = createRetryQueueBloc(_shoppingListApi);
    _shoppingListBloc = ShoppingListBloc(_shoppingListApi, _retryQueueBloc);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Container aus dem aktuellen ProviderScope beziehen
    _appRouter ??= AppRouter(startupGuard: StartupGuard());
  }

  @override
  void dispose() {
    _retryQueueBloc.close();
    _shoppingListBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<RetryQueueBloc>.value(
          value: _retryQueueBloc,
        ),
        BlocProvider<ShoppingListBloc>.value(
          value: _shoppingListBloc,
        ),
      ],
      child: TranslationProvider(
        child: Builder(
          builder: (context) => ToastificationWrapper(
            child: MaterialApp.router(
              debugShowCheckedModeBanner: false,
              routerConfig: _appRouter!.config(),
              locale: TranslationProvider.of(context).flutterLocale,
              supportedLocales: AppLocaleUtils.supportedLocales,
              localizationsDelegates: GlobalMaterialLocalizations.delegates,
              themeMode: ThemeMode.system,
              darkTheme: ThemeData.dark(),
              theme: ThemeData.light(),
            ),
          ),
        ),
      ),
    );
  }
}
