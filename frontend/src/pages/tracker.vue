<template>
  <!-- Help Window -->
  <TrackerHelpWindow />

  <v-container>
    <TimePickerComponent class="mb-1" />
    <ModernTrackerProgress class="mb-5" />
    <CalorieHistoryWidget />
    
    <div class="mb-5">
       <v-btn block color="primary" prepend-icon="mdi-chat" @click="showChatDialog = true">
        {{ languageStore.t('tracker.chat.openButton') || 'Open Assistant' }}
      </v-btn>
    </div>

    <DietlevelComponent class="my-5" />
    <ActivityItemsComponent class="mb-5" />
    <TrackerItemsComponent />
    <FavoriteTrackerItemsComponent v-if="favorites.length > 0" />
    
    <ChatDialog 
      v-model="showChatDialog" 
      :title="languageStore.t('tracker.chat.title') || 'Tracker Assistant'"
      :placeholder="languageStore.t('tracker.chat.placeholder') || 'Legen wir los...'"
      :empty-state="languageStore.t('tracker.chat.emptyState') || 'How many calories do I have left?'"
      :welcome-message="languageStore.t('tracker.chat.welcomeMessage')"
      :on-send="handleChatSend"
    />
  </v-container>
</template>

<route lang="yaml">
  meta:
    layout: trackerLayout
</route>

<script setup>
import { onMounted, computed, ref, watch } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';
import ModernTrackerProgress from '@/components/tracker/ModernTrackerProgress.vue';
import CalorieHistoryWidget from '@/components/tracker/CalorieHistoryWidget.vue';
import DietlevelComponent from '@/components/tracker/DietlevelComponent.vue';
import ActivityItemsComponent from '@/components/tracker/ActivityItemsComponent.vue';
import TrackerItemsComponent from '@/components/tracker/TrackerItemsComponent.vue';
import FavoriteTrackerItemsComponent from '@/components/tracker/FavoriteTrackerItemsComponent.vue';
import TimePickerComponent from '@/components/tracker/TimePickerComponent.vue';
import TrackerHelpWindow from '@/components/windows/TrackerHelpWindow.vue';
import ChatDialog from '@/components/dialogs/ChatDialog.vue';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();
const favorites = computed(() => trackerStore.favorites);

const showChatDialog = ref(false);

watch(showChatDialog, (val) => {
  if (!val) {
    trackerStore.fetchTracker();
    trackerStore.fetchBodyData();
    trackerStore.fetchHistory();
    trackerStore.fetchFavorites();
  }
});

const handleChatSend = async (message, history) => {
  return await trackerStore.chatWithTracker(history);
};

// Lifecycle Hooks
onMounted(async () => {
  trackerStore.fetchTracker();
  trackerStore.fetchBodyData();
  trackerStore.fetchHistory();
  trackerStore.fetchFavorites();
});
</script>