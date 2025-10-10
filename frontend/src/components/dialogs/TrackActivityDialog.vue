<template>
    <v-dialog v-model="dialogStore.dialogs.trackActivityDialog">
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.trackActivity') }}</v-card-title>
            <v-card-text>
                <v-alert v-if="missingRequiredData" type="warning" class="mb-5">
                    {{ languageStore.t('tracker.errorBodydataActivity') }}
                </v-alert>

                <div v-else>
                    <v-textarea v-model="activityText" clearable
                        :label="languageStore.t('tracker.activityLabel')"></v-textarea>
                    <div>
                        <p class="py-5 text-center"> {{ languageStore.t('tracker.createActivityInfo') }} </p>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeSheet">{{ languageStore.t('general.cancel') }}</v-btn>
                <v-btn color="primary" @click="createActivity">{{ languageStore.t('general.confirm') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();
const activityText = ref('');

// Check if required fields are missing
const missingRequiredData = computed(() => {
    return !trackerStore.bodyData.height ||
        !trackerStore.bodyData.latestWeight ||
        !trackerStore.bodyData.birthyear ||
        !trackerStore.bodyData.gender ||
        !trackerStore.bodyData.workHoursWeek ||
        !trackerStore.bodyData.workDaysPAL;
});

const createActivity = () => {
    trackerStore.trackActivity(activityText.value);
    closeSheet();
    router.push('/tracker');
};

const closeSheet = () => {
    dialogStore.closeDialog('trackActivityDialog');
};
</script>
