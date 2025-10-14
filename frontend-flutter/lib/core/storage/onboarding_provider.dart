import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:murmli/core/storage/preferences_provider.dart';

part 'onboarding_provider.g.dart';

const _kOnboardingCompleted = 'onboarding_completed';

@Riverpod(keepAlive: true)
class OnboardingCompleted extends _$OnboardingCompleted {
  @override
  Future<bool> build() {
    final prefs = ref.read(sharedPrefsProvider);
    return prefs.getBool(_kOnboardingCompleted).then((value) => value ?? false);
  }

  Future<void> setCompleted() async {
    final prefs = ref.read(sharedPrefsProvider);
    await prefs.setBool(_kOnboardingCompleted, true);
    state = const AsyncData(true);
  }

  Future<void> clear() async {
    final prefs = ref.read(sharedPrefsProvider);
    await prefs.remove(_kOnboardingCompleted);
    state = const AsyncData(false);
  }
}

