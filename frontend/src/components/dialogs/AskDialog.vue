<template>
    <v-dialog v-model="dialogStore.dialogs.askDialog" fullscreen>
        <v-card>
            <v-toolbar color="primary" class="pt-5">
                <v-btn icon @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>{{ languageStore.t('general.ask') }}</v-toolbar-title>
            </v-toolbar>

            <v-card-text class="pa-4">
                <template v-if="!answer">
                    <v-textarea v-model="question" :label="languageStore.t('tracker.enterQuestion')" outlined rows="3"
                        auto-grow></v-textarea>

                    <v-alert type="info" class="mt-2">
                        {{ languageStore.t('tracker.askDialog') }}
                    </v-alert>

                    <v-btn color="primary" block class="mt-4" :loading="loading" @click="submitQuestion">
                        {{ languageStore.t('general.send') }}
                    </v-btn>
                </template>

                <template v-else>
                    <v-card flat>
                        <v-card-text>
                            <div class="text-body-1" v-html="processedAnswer"></div>
                        </v-card-text>
                    </v-card>
                </template>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();

const question = ref('');
const answer = ref('');
const loading = ref(false);

const closeDialog = () => {
    dialogStore.closeDialog('askDialog');
    resetDialog();
};

const resetDialog = () => {
    question.value = '';
    answer.value = '';
    loading.value = false;
};

const submitQuestion = async () => {
    loading.value = true;
    try {
        // Call the ask function from trackerStore
        answer.value = await trackerStore.askTrackerQuestion(question.value);
    } catch (error) {
        answer.value = languageStore.t('general.errorOccurred');
    } finally {
        loading.value = false;
    }
};

const markdownToHtml = (text) => {
    // Simple markdown to html conversion
    return text
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
};

const processedAnswer = computed(() => {
    return answer.value ? markdownToHtml(answer.value) : '';
});
</script>
