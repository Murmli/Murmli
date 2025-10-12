import 'package:flutter/foundation.dart';
import 'package:riverpod/riverpod.dart';
import 'package:murmli/core/storage/preferences_provider.dart';

/// Brücke zwischen Riverpod und AutoRoute's `reevaluateListenable`.
/// Benachrichtigt den Router nur bei Änderungen der Sprache.
class RouterReevalListenable extends ChangeNotifier {
  RouterReevalListenable(this._container) {
    _subscriptions.add(
      _container.listen<AsyncValue<String?>>(
        preferredLanguageProvider,
        (prev, next) {
          final prevLang = prev?.asData?.value;
          final nextLang = next.asData?.value;
          if (prevLang != nextLang) notifyListeners();
        },
        fireImmediately: false,
      ), // erste Ausführung nicht erzwingen, nur echte Änderungen
    );
  }

  final ProviderContainer _container;
  final List<ProviderSubscription> _subscriptions = [];

  @override
  void dispose() {
    for (final sub in _subscriptions) {
      sub.close();
    }
    _subscriptions.clear();
    super.dispose();
  }
}
