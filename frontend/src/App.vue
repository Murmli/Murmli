<template>
  <v-app>
    <v-main>
      <ApiErrorComponent />
      <router-view v-if="sessionReady" />
      <BottomNavigation />
      <ConfirmDialog />
      <NotificationDialog />
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
});
</script>

