<template>
  <v-dialog v-model="show" fullscreen transition="dialog-bottom-transition">
    <v-card>
      <v-toolbar color="primary">
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>{{ languageStore.t('recipe.chat.title') || 'Recipe Chat' }}</v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-0 d-flex flex-column" style="height: 100vh;">
        <div class="flex-grow-1 overflow-y-auto pa-4" ref="chatContainer">
          <div v-if="messages.length === 0" class="text-center mt-10 text-grey">
            <v-icon size="64" class="mb-4">mdi-message-text-outline</v-icon>
            <p>{{ languageStore.t('recipe.chat.emptyState') || 'Ask a question about this recipe!' }}</p>
          </div>

          <div v-for="(msg, index) in messages" :key="index" class="d-flex mb-4"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            <v-sheet :color="msg.role === 'user' ? 'primary' : 'surface-variant'" class="pa-3 rounded-lg"
              max-width="80%">
              <p class="mb-0 text-pre-wrap">{{ msg.content }}</p>
            </v-sheet>
          </div>

          <div v-if="loading" class="d-flex justify-start mb-4">
            <v-sheet color="surface-variant" class="pa-3 rounded-lg">
              <v-progress-circular indeterminate size="20" width="2"></v-progress-circular>
            </v-sheet>
          </div>
        </div>

        <v-divider></v-divider>

        <div class="pa-2 d-flex align-center">
          <v-textarea v-model="input" :placeholder="languageStore.t('recipe.chat.placeholder') || 'Type your question...'"
            variant="solo" hide-details rows="1" auto-grow max-rows="4" class="mr-2"
            @keydown.enter.prevent="sendMessage"></v-textarea>
          <v-btn icon="mdi-send" color="primary" @click="sendMessage" :disabled="!input.trim() || loading"></v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useRecipeStore } from '@/stores/recipeStore';
import { useLanguageStore } from '@/stores/languageStore';

const props = defineProps({
  modelValue: Boolean,
  recipeId: String,
});

const emit = defineEmits(['update:modelValue']);

const recipeStore = useRecipeStore();
const languageStore = useLanguageStore();

const show = ref(props.modelValue);
const input = ref('');
const messages = ref([]);
const loading = ref(false);
const chatContainer = ref(null);

watch(() => props.modelValue, (val) => {
  show.value = val;
});

watch(show, (val) => {
  emit('update:modelValue', val);
});

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const close = () => {
  show.value = false;
};

const sendMessage = async () => {
  if (!input.value.trim() || loading.value) return;

  const userMsg = input.value.trim();
  messages.value.push({ role: 'user', content: userMsg });
  input.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await recipeStore.chatWithRecipe(props.recipeId, messages.value);
    if (response) {
      messages.value.push({ role: 'assistant', content: response.answer });
    } else {
       messages.value.push({ role: 'assistant', content: languageStore.t('error.general') || 'An error occurred.' });
    }
  } catch (error) {
    console.error(error);
    messages.value.push({ role: 'assistant', content: languageStore.t('error.general') || 'An error occurred.' });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};
</script>

<style scoped>
.text-pre-wrap {
  white-space: pre-wrap;
}
</style>
