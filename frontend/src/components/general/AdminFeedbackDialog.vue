<template>
  <v-dialog v-model="internalModelValue" max-width="900px" scrollable>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center bg-grey-lighten-4 py-4">
        <v-icon color="orange-darken-2" class="mr-2">mdi-message-alert</v-icon>
        <span class="text-h6 font-weight-bold">{{ languageStore.t('adminStats.feedback.title') }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="internalModelValue = false"></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-0" style="height: 70vh;">
        <v-container v-if="loading" class="d-flex flex-column align-center justify-center h-100">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <div class="mt-4 text-body-1">{{ languageStore.t('general.loading') }}</div>
        </v-container>

        <v-container v-else-if="feedbacks.length === 0" class="d-flex flex-column align-center justify-center h-100 text-center">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-message-off</v-icon>
          <div class="text-h6 text-medium-emphasis">{{ languageStore.t('adminStats.feedback.noFeedback') }}</div>
        </v-container>

        <v-list v-else lines="three" class="pa-0">
          <template v-for="(item, index) in feedbacks" :key="item._id">
            <v-list-item 
              :class="{'bg-orange-lighten-5': !item.readed}"
              class="feedback-item px-2 px-sm-4 py-3"
            >
              <template v-slot:prepend>
                <v-avatar :color="item.readed ? 'grey-lighten-2' : 'orange-lighten-4'" size="40" class="hidden-xs">
                  <v-icon :color="item.readed ? 'grey' : 'orange-darken-2'" size="20">
                    {{ item.readed ? 'mdi-message-check' : 'mdi-message-alert' }}
                  </v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="d-flex flex-wrap align-center mb-1">
                <span class="font-weight-bold text-body-1 mr-2">
                  {{ item.user?.username || 'Anonymer Nutzer' }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  {{ formatDate(item.createdAt) }}
                </span>
              </v-list-item-title>

              <v-list-item-subtitle class="text-body-2 opacity-100 text-grey-darken-3 mb-2" style="white-space: pre-wrap; line-height: 1.4;">
                {{ item.content }}
              </v-list-item-subtitle>

              <div v-if="item.recipe" class="mb-2">
                <v-chip 
                  size="small" 
                  color="primary" 
                  variant="tonal" 
                  class="cursor-pointer"
                  @click.stop="goToRecipe(item.recipe._id)"
                >
                  <v-icon start size="14">mdi-silverware</v-icon>
                  {{ item.recipe.title }}
                  <v-icon end size="14">mdi-open-in-new</v-icon>
                </v-chip>
              </div>

              <template v-slot:append>
                <div class="d-flex flex-column align-end justify-center">
                  <v-btn
                    :icon="item.readed ? 'mdi-email-outline' : 'mdi-email-open-outline'"
                    variant="text"
                    density="default"
                    :color="item.readed ? 'grey' : 'primary'"
                    @click="toggleRead(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    density="default"
                    color="grey"
                    @click="editFeedback(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    density="default"
                    color="error"
                    @click="confirmDelete(item)"
                  ></v-btn>
                </div>
              </template>
            </v-list-item>
            <v-divider v-if="index < feedbacks.length - 1"></v-divider>
          </template>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn
          variant="tonal"
          color="primary"
          @click="internalModelValue = false"
          class="px-6"
        >
          {{ languageStore.t('general.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card rounded="lg">
        <v-card-title class="pa-4">{{ languageStore.t('adminStats.feedback.edit') }}</v-card-title>
        <v-card-text class="pt-2">
          <v-textarea
            v-model="editedContent"
            :label="languageStore.t('adminStats.feedback.content')"
            variant="outlined"
            hide-details
            auto-grow
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDialog = false">{{ languageStore.t('adminStats.feedback.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" class="px-4" @click="saveEdit" :loading="saving">{{ languageStore.t('adminStats.feedback.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card rounded="lg">
        <v-card-title class="pa-4">{{ languageStore.t('adminStats.feedback.delete') }}</v-card-title>
        <v-card-text class="pt-2">
          {{ languageStore.t('adminStats.feedback.confirmDelete') }}
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">{{ languageStore.t('adminStats.feedback.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" class="px-4" @click="deleteFeedback" :loading="deleting">{{ languageStore.t('adminStats.feedback.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useRouter } from 'vue-router';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'refresh-stats']);

const apiStore = useApiStore();
const languageStore = useLanguageStore();
const recipeStore = useRecipeStore();
const router = useRouter();

const internalModelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const feedbacks = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const editDialog = ref(false);
const deleteDialog = ref(false);
const currentItem = ref(null);
const editedContent = ref('');

const fetchFeedbacks = async () => {
  loading.value = true;
  try {
    const response = await apiStore.apiRequest('get', '/system/feedback');
    if (response && response.status === 200) {
      feedbacks.value = response.data.feedbacks;
    }
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
  } finally {
    loading.value = false;
  }
};

const goToRecipe = async (recipeId) => {
  try {
    const recipe = await recipeStore.fetchRecipe(recipeId);
    if (recipe) {
      internalModelValue.value = false;
      router.push('/recipe');
    }
  } catch (error) {
    console.error('Error navigating to recipe:', error);
  }
};

watch(internalModelValue, (val) => {
  if (val) {
    fetchFeedbacks();
  }
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

const toggleRead = async (item) => {
  try {
    const response = await apiStore.apiRequest('patch', `/system/feedback/${item._id}`, {
      readed: !item.readed
    });
    if (response && response.status === 200) {
      item.readed = response.data.feedback.readed;
      emit('refresh-stats');
    }
  } catch (error) {
    console.error('Error updating feedback:', error);
  }
};

const editFeedback = (item) => {
  currentItem.value = item;
  editedContent.value = item.content;
  editDialog.value = true;
};

const saveEdit = async () => {
  if (!currentItem.value) return;
  saving.value = true;
  try {
    const response = await apiStore.apiRequest('patch', `/system/feedback/${currentItem.value._id}`, {
      content: editedContent.value
    });
    if (response && response.status === 200) {
      currentItem.value.content = response.data.feedback.content;
      editDialog.value = false;
    }
  } catch (error) {
    console.error('Error editing feedback:', error);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item) => {
  currentItem.value = item;
  deleteDialog.value = true;
};

const deleteFeedback = async () => {
  if (!currentItem.value) return;
  deleting.value = true;
  try {
    const response = await apiStore.apiRequest('delete', `/system/feedback/${currentItem.value._id}`);
    if (response && response.status === 200) {
      feedbacks.value = feedbacks.value.filter(f => f._id !== currentItem.value._id);
      deleteDialog.value = false;
      emit('refresh-stats');
    }
  } catch (error) {
    console.error('Error deleting feedback:', error);
  } finally {
    deleting.value = false;
  }
};
</script>

<style scoped>
.feedback-item {
  transition: background-color 0.2s;
}
</style>
