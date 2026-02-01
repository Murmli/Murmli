import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useNetworkStore = defineStore('network', () => {
  // State
  const isOnline = ref(navigator.onLine);
  const lastSyncAttempt = ref(null);
  const syncInProgress = ref(false);

  // Getters
  const isOffline = computed(() => !isOnline.value);
  const canSync = computed(() => isOnline.value && !syncInProgress.value);

  // Actions
  const updateNetworkStatus = () => {
    isOnline.value = navigator.onLine;
    console.log(`[Network] Status changed: ${isOnline.value ? 'online' : 'offline'}`);
  };

  const setSyncInProgress = (value) => {
    syncInProgress.value = value;
  };

  const recordSyncAttempt = () => {
    lastSyncAttempt.value = Date.now();
  };

  // Initialize event listeners
  const initNetworkListeners = () => {
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    console.log('[Network] Listeners initialized');
  };

  const removeNetworkListeners = () => {
    window.removeEventListener('online', updateNetworkStatus);
    window.removeEventListener('offline', updateNetworkStatus);
  };

  return {
    // State
    isOnline,
    lastSyncAttempt,
    syncInProgress,
    // Getters
    isOffline,
    canSync,
    // Actions
    updateNetworkStatus,
    setSyncInProgress,
    recordSyncAttempt,
    initNetworkListeners,
    removeNetworkListeners,
  };
});
