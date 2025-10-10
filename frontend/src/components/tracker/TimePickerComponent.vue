<template>
    <v-row>
        <v-col cols="3">
            <v-btn icon @click="changeDate(-1)">
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
        </v-col>
        <v-col>
            <div class="text-center mx-4" v-if="isToday">
                <div class="text-h6">{{ languageStore.t('tracker.today') }}</div>
                <div class="text-caption">{{ formattedDate }}</div>
            </div>
            <div class="text-center mx-4" v-else>
                <div class="text-subtitle-2
">{{ formattedDate }}</div>
            </div>
        </v-col>
        <v-col cols="3" class="text-right">
            <v-btn icon @click="changeDate(1)">
                <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
        </v-col>
    </v-row>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();

const tracker = computed(() => trackerStore.tracker);

const formattedDate = computed(() => {
    const date = tracker.value?.date ? new Date(tracker.value.date) : new Date();
    return date.toLocaleDateString(languageStore.locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Prüft, ob das ausgewählte Datum das heutige Datum ist
const isToday = computed(() => {
    const selectedDate = tracker.value?.date ? new Date(tracker.value.date) : new Date();
    const today = new Date();

    return selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getDate() === today.getDate();
});

const changeDate = (days) => {
    const currentDate = tracker.value?.date ? new Date(tracker.value.date) : new Date();
    currentDate.setDate(currentDate.getDate() + days);

    // Format the date in local format (YYYY-MM-DD) to avoid timezone conversion issues
    const year = currentDate.getFullYear();
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const day = ('0' + currentDate.getDate()).slice(-2);
    const formatted = `${year}-${month}-${day}`;

    trackerStore.fetchTracker(formatted);
};

</script>