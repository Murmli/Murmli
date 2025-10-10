<template>
    <v-progress-linear v-if="progressPercentage !== null" :model-value="progressPercentage" :color="progressColor"
        height="20" striped rounded>
        {{ totalKcalDisplay }} / {{ recommendedKcalDisplay }} ({{ remainingKcal }})
    </v-progress-linear>
    <p v-else class="text-center text-grey">{{ languageStore.t('tracker.noTargetDefined') }}</p>
</template>

<script setup>
import { computed } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();

const progressPercentage = computed(() => {
    const totalKcal = trackerStore.tracker?.totals?.kcal || 0;
    const recommendedKcal = trackerStore.tracker?.recommendations?.kcal || 0;
    if (recommendedKcal === 0) {
        return null;
    }
    return Math.min((totalKcal / recommendedKcal) * 100, 100);
});

// Integer displays for UI
const totalKcalDisplay = computed(() => Math.round(Number(trackerStore.tracker?.totals?.kcal || 0)));
const recommendedKcalDisplay = computed(() => Math.round(Number(trackerStore.tracker?.recommendations?.kcal || 0)));

const remainingKcal = computed(() => {
    const totalKcal = Number(trackerStore.tracker?.totals?.kcal || 0);
    const recommendedKcal = Number(trackerStore.tracker?.recommendations?.kcal || 0);
    return Math.round(recommendedKcal - totalKcal);
});

const progressColor = computed(() => {
    if (progressPercentage.value === null) return 'grey';

    const totalKcal = trackerStore.tracker?.totals?.kcal ?? 0;
    const recommendedKcal = trackerStore.tracker?.recommendations?.kcal ?? 0;

    if (recommendedKcal === 0) return 'grey';

    const deviation = ((totalKcal - recommendedKcal) / recommendedKcal) * 100;

    const thresholds = [
        { min: -10, max: 10, color: 'lime-accent-4' },
        { min: -60, max: -10, color: 'yellow-accent-4' }
    ];

    const matched = thresholds.find(t => deviation >= t.min && deviation <= t.max);
    return matched ? matched.color : 'orange-darken-3';
});
</script>
