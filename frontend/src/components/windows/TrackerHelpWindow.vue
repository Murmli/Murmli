<template>
    <v-overlay v-model="dialogStore.dialogs.trackerHelpWindow" class="align-center justify-center" contained persistent>
        <v-card class="mx-auto" max-width="90%">
            <v-card-title class="text-h6 font-weight-regular justify-space-between">
                <span>{{ currentTitle }}</span>
            </v-card-title>

            <v-window v-model="step">
                <!-- Step 1 - Food input -->
                <v-window-item :value="1">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.tracker.overview')"></p>
                    </v-card-text>
                </v-window-item>

                <!-- Step 2 - Define calorie goal -->
                <v-window-item :value="2">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.tracker.calorieGoal')"></p>
                    </v-card-text>
                </v-window-item>

                <!-- Step 3 - Activity tracking -->
                <v-window-item :value="3">
                    <v-card-text class="text-center">
                        <p v-html="languageStore.t('help.tracker.activityTracking')"></p>
                        <v-btn class="mt-5" color="primary" @click="closeHelpWindow">
                            {{ languageStore.t('general.start') }}
                        </v-btn>
                    </v-card-text>
                </v-window-item>
            </v-window>

            <v-divider></v-divider>

            <v-card-actions>
                <v-btn v-if="step > 1" variant="text" @click="step--">
                    {{ languageStore.t('general.back') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn v-if="step < 3" color="primary" variant="flat" @click="step++">
                    {{ languageStore.t('general.next') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-overlay>
</template>

<script setup>
// English: Importing necessary Vue Composition API functions and stores
import { ref, computed, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const step = ref(1);

// English: Compute the current title based on the step
const currentTitle = computed(() => {
    switch (step.value) {
        case 1: return languageStore.t('help.tracker.overviewTitle');
        case 2: return languageStore.t('help.tracker.calorieGoalTitle');
        default: return languageStore.t('help.tracker.activityTrackingTitle');
    }
});

const closeHelpWindow = () => {
    dialogStore.closeDialog('trackerHelpWindow');
    localStorage.setItem('showTrackerHelpWindow', 'false');
};

onMounted(() => {
    const showHelpWindow = localStorage.getItem('showTrackerHelpWindow');
    if (!showHelpWindow) {
        dialogStore.openDialog('trackerHelpWindow');
    }
});
</script>
