<template>
  <v-app extended>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3" extension-height="38">
      <v-toolbar-title>{{ languageStore.t('shoppingList.shoppingListLabel') }}</v-toolbar-title>
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
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useBottomMenuStore } from '@/stores/bottomMenuStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();
const shoppingListStore = useShoppingListStore();
const bottomMenuStore = useBottomMenuStore();

// Menu items as a computed property
const menuItems = computed(() => [
  { title: languageStore.t('shoppingList.shareList'), action: () => shareList() },
  { title: languageStore.t('shoppingList.sortList'), action: () => sortList() },
  { title: languageStore.t('shoppingList.removeIngredients.text'), action: () => removeIngredients() },
  { title: languageStore.t('shoppingList.clearAll.text'), action: () => clearAll() },
  { title: languageStore.t('shoppingList.deleteList.text'), action: () => deleteList() },
  { title: languageStore.t('shoppingList.help'), action: () => showHelp() },
]);

// Expose actions to the global bottom-sheet menu
watch(menuItems, (items) => bottomMenuStore.setItems(items, 'shoppingList'), { immediate: true, deep: false });
onUnmounted(() => bottomMenuStore.clearItems('shoppingList'));

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

const showHelp = () => {
  dialogStore.openDialog("welcomeWindow");
};

// No navigation drawer

// Open a new window with a given URL
const openLink = url => {
  window.open(url, '_blank')
}

// Share functionality
const shareApp = () => {
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=de.murmli.twa'

  if (navigator.share) {
    navigator.share({
      title: 'Murmli',
      url: playStoreUrl
    })
  } else {
    navigator.clipboard.writeText(playStoreUrl)
    alert('Copied to the clipboard!')
  }
}

// Controls the bottom sheet for secondary actions
const moreOpen = ref(false)
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
