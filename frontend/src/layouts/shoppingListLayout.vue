<template>
  <v-app extended>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3" extension-height="38">
      <v-toolbar-title>
        {{ languageStore.t('shoppingList.shoppingListLabel') }}
        <!-- Offline Badge -->
        <v-chip
          v-if="shoppingListStore.isOffline"
          color="warning"
          size="small"
          class="ml-2"
          density="compact"
        >
          <v-icon start size="small">mdi-wifi-off</v-icon>
          {{ languageStore.t('shoppingList.offline') || 'Offline' }}
        </v-chip>
        <!-- Pending Changes Badge -->
        <v-chip
          v-if="shoppingListStore.hasPendingChanges"
          :color="shoppingListStore.isOffline ? 'error' : 'info'"
          size="small"
          class="ml-2"
          density="compact"
          @click="syncPendingChanges"
          :disabled="shoppingListStore.isOffline || shoppingListStore.isSyncing"
          style="cursor: pointer"
          v-tooltip="shoppingListStore.isSyncing ? languageStore.t('shoppingList.syncing') : (shoppingListStore.isOffline ? languageStore.t('shoppingList.offlineMode') : languageStore.t('shoppingList.pendingChanges', { count: shoppingListStore.pendingChangesCount }))"
        >
          <v-icon start size="small" :class="{ 'rotate-icon': shoppingListStore.isSyncing }">
            {{ shoppingListStore.isSyncing ? 'mdi-sync' : 'mdi-cloud-upload' }}
          </v-icon>
          {{ shoppingListStore.pendingChangesCount }}
        </v-chip>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn :class="{ 'rotate-icon': isRefreshing }" icon="mdi-refresh" @click="refreshList"></v-btn>
      <!-- Erweiterungs-Slot für zusätzliche Inhalte -->
      <template v-slot:extension>
        <AddItemComponent />
      </template>
    </v-app-bar>

    <!-- No side drawer -->

    <LoadingOverlay />

    <!-- Content -->
    <v-main class="fill-height d-flex flex-column">
      <v-container fluid class="fill-height d-flex flex-column mt-3">
        <router-view />
      </v-container>
    </v-main>
  </v-app>

  <!-- ShareList Dialog -->
  <ShareListComponent v-if="dialogStore.dialogs.shareListDialog" v-model="dialogStore.dialogs.shareListDialog" />

  <!-- ListSort Dialog -->
  <ListSortComponent v-if="dialogStore.dialogs.listSortDialog" v-model="dialogStore.dialogs.listSortDialog" />

  <!-- Offline Snackbar -->
  <v-snackbar
    v-model="showOfflineSnackbar"
    :timeout="3000"
    color="warning"
    location="bottom"
  >
    <v-icon start>mdi-wifi-off</v-icon>
    {{ offlineSnackbarText }}
  </v-snackbar>

  <!-- Sync Success Snackbar -->
  <v-snackbar
    v-model="showSyncSnackbar"
    :timeout="2000"
    color="success"
    location="bottom"
  >
    <v-icon start>mdi-cloud-check</v-icon>
    {{ languageStore.t('shoppingList.syncComplete') }}
  </v-snackbar>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useBottomMenuStore } from '@/stores/bottomMenuStore';
import { useNetworkStore } from '@/stores/networkStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const shoppingListStore = useShoppingListStore();
const bottomMenuStore = useBottomMenuStore();
const networkStore = useNetworkStore();

// Snackbar states
const showOfflineSnackbar = ref(false);
const showSyncSnackbar = ref(false);
const offlineSnackbarText = ref('');

// Menu items as a computed property
const menuItems = computed(() => [
  { title: languageStore.t('shoppingList.shareList'), action: () => shareList() },
  { title: languageStore.t('shoppingList.sortList'), action: () => sortList() },
  { title: languageStore.t('shoppingList.removeIngredients.text'), action: () => removeIngredients() },
  { title: languageStore.t('shoppingList.clearAll.text'), action: () => clearAll() },
  { title: languageStore.t('shoppingList.deleteList.text'), action: () => deleteList() },
]);

// Expose actions to the global bottom-sheet menu
watch(menuItems, (items) => bottomMenuStore.setItems(items, 'shoppingList'), { immediate: true, deep: false });
onUnmounted(() => bottomMenuStore.clearItems('shoppingList'));

// Initialize offline support on mount
onMounted(() => {
  shoppingListStore.initOfflineSupport();
  
  // Watch for network status changes for snackbar notifications
  window.addEventListener('offline', () => {
    offlineSnackbarText.value = languageStore.t('shoppingList.offlineMode') || 'Offline-Modus aktiv - Änderungen werden lokal gespeichert';
    showOfflineSnackbar.value = true;
  });
  
  window.addEventListener('online', () => {
    offlineSnackbarText.value = languageStore.t('shoppingList.backOnline') || 'Verbindung wiederhergestellt';
    showOfflineSnackbar.value = true;
    // Auto-sync after a short delay
    setTimeout(() => {
      if (shoppingListStore.hasPendingChanges) {
        syncPendingChanges();
      }
    }, 1500);
  });
});

// No drawer

// Refresh state
const isRefreshing = ref(false);

const refreshList = async () => {
  if (isRefreshing.value) return; // Avoid multiple refresh triggers
  isRefreshing.value = true;

  try {
    // Simulate a refresh operation (replace with actual logic)
    await shoppingListStore.readShoppingList();
  } catch (error) {
    console.error("Error refreshing list:", error);
  } finally {
    isRefreshing.value = false;
  }
};

const syncPendingChanges = async () => {
  if (shoppingListStore.isOffline || shoppingListStore.isSyncing) return;
  
  await shoppingListStore.syncPendingChanges();
  
  if (!shoppingListStore.hasPendingChanges) {
    showSyncSnackbar.value = true;
  }
};

// Dummy functions
const shareList = () => {
  dialogStore.openDialog("shareListDialog");
};

const sortList = () => {
  dialogStore.openDialog("listSortDialog");
};

const removeIngredients = () => {
  dialogStore.openConfirmDialog(
    languageStore.t('shoppingList.removeIngredients.text'),
    languageStore.t('shoppingList.removeIngredients.dialogMsg'),
    () => {
      shoppingListStore.deleteAllIngredients();
    }
  );
};

const clearAll = () => {
  dialogStore.openConfirmDialog(
    languageStore.t('shoppingList.clearAll.text'),
    languageStore.t('shoppingList.clearAll.dialogMsg'),
    () => {
      shoppingListStore.deleteAllItems();
    }
  );
};

const deleteList = () => {
  dialogStore.openConfirmDialog(
    languageStore.t('shoppingList.deleteList.text'),
    languageStore.t('shoppingList.deleteList.dialogMsg'),
    () => {
      shoppingListStore.deleteShoppingList();
    }
  );
};

// No navigation drawer
</script>

<style scoped>
.rotate-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
