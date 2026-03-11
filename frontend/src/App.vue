<template>
  <v-app>
    <v-main>
      <ApiErrorComponent />
      
      <!-- Show error screen if session failed -->
      <v-container v-if="sessionError && !sessionReady" class="fill-height">
        <v-row justify="center" align="center">
          <v-col cols="12" sm="8" md="6" class="text-center">
            <v-icon color="error" size="64" class="mb-4">mdi-alert-circle-outline</v-icon>
            <h1 class="text-h5 mb-2">{{ languageStore.t('general.error') }}</h1>
            <p class="mb-6">{{ languageStore.t('general.errorMessage') }}</p>
            <v-btn color="primary" @click="retrySession">
              {{ languageStore.t('general.confirm') || 'Retry' }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <!-- Show content only if session is ready -->
      <template v-else-if="sessionReady">
        <router-view />
        <BottomNavigation />
        <ConfirmDialog />
        <NotificationDialog />
      </template>
      
      <!-- Show loading indicator while initializing -->
      <v-overlay
        v-else
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

const initApp = async () => {
  sessionReady.value = false;
  sessionError.value = false;

  const ensureSession = async () => {
    try {
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
    } catch (e) {
      console.error('ensureSession failed:', e);
      return false;
    }
  };

  try {
    const [sessionEstablished] = await Promise.all([
      ensureSession(),
      languageStore.initLocale(),
    ]);

    if (!sessionEstablished) {
      sessionError.value = true;
      return;
    }

    sessionReady.value = true;

    // Initialize notification polling after session is established
    notificationStore.initialize();

    // Fetch suggestions in the background to avoid blocking initial render
    if (plannerStore.recipeSuggestions.length < MIN_RECIPE_SUGGESTIONS) {
      plannerStore.fetchRecipeSuggestions(false);
    }
  } catch (error) {
    console.error('Session initialization failed:', error);
    sessionError.value = true;
  }
};

const retrySession = () => {
  initApp();
};

onMounted(() => {
  initApp();
});
</script>

