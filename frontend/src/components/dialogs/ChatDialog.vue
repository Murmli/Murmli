<template>
  <v-dialog v-model="show" fullscreen transition="dialog-bottom-transition">
    <v-card>
      <v-toolbar color="primary">
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>{{ title }}</v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-0 d-flex flex-column" style="height: 100vh;">
        <div class="flex-grow-1 overflow-y-auto pa-4" ref="chatContainer">
          <div v-if="messages.length === 0" class="text-center mt-10 text-grey">
            <v-icon size="64" class="mb-4">mdi-message-text-outline</v-icon>
            <p>{{ welcomeMessage || emptyState }}</p>
          </div>

          <div v-for="(msg, index) in messages" :key="index" class="d-flex mb-4"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            <v-sheet :color="msg.role === 'user' ? 'primary' : 'surface-variant'" class="pa-3 rounded-lg"
              max-width="80%">
              <div v-if="msg.role === 'user'" class="mb-0 text-pre-wrap">{{ msg.content }}</div>
              <div v-else class="mb-0 markdown-body" v-html="renderMarkdown(msg.content)"></div>
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
          <v-textarea v-model="input" :placeholder="placeholder"
            variant="solo" hide-details rows="1" auto-grow max-rows="4" class="mr-2"
            @keydown.enter.prevent="handleSend"></v-textarea>
          <v-btn icon="mdi-send" color="primary" @click="handleSend" :disabled="!input.trim() || loading"></v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  modelValue: Boolean,
  title: String,
  placeholder: String,
  emptyState: String,
  welcomeMessage: String,
  onSend: Function, // Function that takes (message, history) and returns response { answer: '...' }
});

const emit = defineEmits(['update:modelValue']);

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

const renderMarkdown = (content) => {
  try {
    return marked(content);
  } catch (e) {
    console.error("Markdown parsing error:", e);
    return content;
  }
};

const handleSend = async () => {
  if (!input.value.trim() || loading.value) return;

  const userMsg = input.value.trim();
  messages.value.push({ role: 'user', content: userMsg });
  input.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    // Pass current history including the new user message
    const response = await props.onSend(userMsg, messages.value);
    
    if (response && response.answer) {
      messages.value.push({ role: 'assistant', content: response.answer });
    } else {
      messages.value.push({ role: 'assistant', content: 'An error occurred.' });
    }
  } catch (error) {
    console.error(error);
    messages.value.push({ role: 'assistant', content: 'An error occurred.' });
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

:deep(.markdown-body p) {
  margin-bottom: 8px;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  margin-left: 20px;
  margin-bottom: 8px;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3) {
  margin-top: 12px;
  margin-bottom: 8px;
  font-weight: bold;
}

:deep(.markdown-body strong) {
  font-weight: bold;
}
</style>
