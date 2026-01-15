<template>
  <ChatDialog
    v-model="show"
    :title="languageStore.t('recipe.chat.title') || 'Recipe Chat'"
    :placeholder="languageStore.t('recipe.chat.placeholder') || 'Ask a question about this recipe...'"
    :empty-state="languageStore.t('recipe.chat.emptyState') || 'Ask me anything about this recipe!'"
    :welcome-message="languageStore.t('recipe.chat.welcomeMessage') || 'Hello! I am your recipe assistant. You can ask me questions about this recipe, for example about ingredients, preparation, or alternatives. I have the recipe data available.'"
    :on-send="handleSend"
  />
</template>

<script setup>
import { computed } from 'vue';
import { useRecipeStore } from '@/stores/recipeStore';
import { useLanguageStore } from '@/stores/languageStore';
import ChatDialog from './ChatDialog.vue';

const props = defineProps({
  modelValue: Boolean,
  recipeId: String,
});

const emit = defineEmits(['update:modelValue']);

const recipeStore = useRecipeStore();
const languageStore = useLanguageStore();

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const handleSend = async (message, history) => {
  // history in ChatDialog includes the new user message at the end.
  // The store action likely expects the history array.
  
  const response = await recipeStore.chatWithRecipe(props.recipeId, history);
  // Expecting response to be an object with { answer: '...' }
  // If the store returns just the answer string/object, adjust accordingly.
  // Based on previous code: `response.answer` was used.
  return response;
};
</script>
