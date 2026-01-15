<template>
  <!-- Help Window -->
  <TrackerHelpWindow />

  <v-container>
    <TimePickerComponent class="mb-1" />
    <MacronutrientsComponent class="mb-5" />
    <DietlevelComponent class="my-5" />
    <TrackProgressComponent class="mb-5" />
    <ActivityItemsComponent class="mb-5" />
    <TrackerItemsComponent />
    <FavoriteTrackerItemsComponent v-if="favorites.length > 0" />
    
    <div class="ma-4">
       <v-btn block color="primary" prepend-icon="mdi-chat" @click="showChatDialog = true">
        {{ languageStore.t('tracker.chat.openButton') || 'Open Assistant' }}
      </v-btn>
    </div>

    <ChatDialog 
      v-model="showChatDialog" 
      :title="languageStore.t('tracker.chat.title') || 'Tracker Assistant'"
      :placeholder="languageStore.t('tracker.chat.placeholder') || 'Ask about your calories...'"
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
import { onMounted, computed, ref } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';
import ChatDialog from '@/components/dialogs/ChatDialog.vue';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();
const favorites = computed(() => trackerStore.getFavorites());

const showChatDialog = ref(false);

const handleChatSend = async (message, history) => {
  return await trackerStore.chatWithTracker(history);
};

// Lifecycle Hooks
onMounted(async () => {
  trackerStore.fetchTracker();
  trackerStore.fetchBodyData();
});
</script>