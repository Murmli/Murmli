<template>
  <v-app>
    <v-main>
      <ApiErrorComponent />
      <!-- Show content even if session is not ready, but show error if failed -->
      <router-view v-if="sessionReady || sessionError" />
      <BottomNavigation v-if="sessionReady || sessionError" />
      <ConfirmDialog />
      <NotificationDialog />
      
      <!-- Show loading indicator while initializing -->
      <v-overlay
        v-if="!sessionReady && !sessionError"
        class="align-center justify-center"
        persistent
        :model-value="true"
      >
        <v-progress-circular
          color="primary"
          indeterminate
          size="64"
        />
      </v-overlay>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { useUserStore } from '@/stores/userStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useNotificationStore } from '@/stores/notificationStore';

const apiStore = useApiStore();
const plannerStore = usePlannerStore();
const userStore = useUserStore();
const languageStore = useLanguageStore();
const notificationStore = useNotificationStore();
const sessionReady = ref(false);
const sessionError = ref(false);
const MIN_RECIPE_SUGGESTIONS =
  parseInt(import.meta.env.VITE_MIN_RECIPE_SUGGESTIONS) || 5;

onMounted(async () => {
  const ensureSession = async () => {
    if (apiStore.token) {
      const loginResult = await apiStore.login();
      if (loginResult.success) {
        return true;
      }

      if (loginResult.invalidSession) {
        localStorage.clear();
        userStore.setStartpage('/');
        return await apiStore.createSession();
      }

      return false;
    }
    return await apiStore.createSession();
  };

  try {
    const [sessionEstablished] = await Promise.all([
      ensureSession(),
      languageStore.initLocale(),
    ]);

    sessionReady.value = true;

    // Initialize notification polling after session is established
    if (sessionEstablished) {
      notificationStore.initialize();
    }

    // Fetch suggestions in the background to avoid blocking initial render
    if (
      sessionEstablished &&
      plannerStore.recipeSuggestions.length < MIN_RECIPE_SUGGESTIONS
    ) {
      plannerStore.fetchRecipeSuggestions(false);
    }
  } catch (error) {
    console.error('Session initialization failed:', error);
    sessionError.value = true;
    sessionReady.value = true; // Show UI even on error
  }
});
</script>

