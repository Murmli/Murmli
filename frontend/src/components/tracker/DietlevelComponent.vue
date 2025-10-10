<template>
    <p v-if="shouldShowDietStarted" class="text-caption text-center text-grey darken-1">
        {{ dietStartText }}
    </p>
</template>

<script setup>
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();

const dietStartDate = computed(() => {
    if (!trackerStore.bodyData?.dietStartedAt) return null;
    return new Date(trackerStore.bodyData.dietStartedAt);
});

const shouldShowDietStarted = computed(() => {
    return dietStartDate.value && trackerStore.bodyData?.dietLevel !== "maintain";
});

const dietStartText = computed(() => {
    if (!dietStartDate.value) return '';

    const now = new Date();
    const diffTime = Math.abs(now - dietStartDate.value);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) {
        const diffWeeks = Math.floor(diffDays / 7);
        return `${languageStore.t('tracker.dietLevelChange.dietLevelBefore')} ${diffWeeks} ${diffWeeks === 1 ? languageStore.t('general.week') : languageStore.t('general.weeks')} ${languageStore.t('tracker.dietLevelChange.lastChanged')}`;
    } else {
        return `${languageStore.t('tracker.dietLevelChange.dietLevelBefore')} ${diffDays} ${diffDays === 1 ? languageStore.t('general.day') : languageStore.t('general.days')} ${languageStore.t('tracker.dietLevelChange.lastChanged')}`;
    }
});

</script>