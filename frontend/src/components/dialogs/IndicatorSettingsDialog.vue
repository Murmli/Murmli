<template>
    <v-dialog v-model="dialogStore.dialogs.indicatorSettingsDialog" location="top" scrollable>
        <v-card max-width="500" style="margin-top: 20px;">
            <v-card-title>{{ languageStore.t('tracker.indicatorSettings.title') }}</v-card-title>
            <v-card-text>
                <p class="text-caption mb-3">{{ languageStore.t('tracker.indicatorSettings.description') }}</p>
                <v-list density="compact">
                    <v-list-item v-for="(indicator, index) in localSettings" :key="indicator.key"
                        class="px-0">
                        <div class="d-flex align-center justify-space-between w-100">
                            <div class="d-flex align-center flex-grow-1">
                                <v-checkbox-btn
                                    v-model="indicator.enabled"
                                    density="compact"
                                    hide-details
                                    class="mr-1"
                                ></v-checkbox-btn>
                                <div class="d-flex align-center">
                                    <div class="indicator-preview rounded-pill mr-2"
                                        :style="{ backgroundColor: getPreviewColor(indicator.key) }"
                                    ></div>
                                    <span :class="{ 'text-disabled': !indicator.enabled }">
                                        {{ getIndicatorLabel(indicator.key) }}
                                    </span>
                                </div>
                            </div>
                            <div class="d-flex ga-1">
                                <v-btn size="x-small" variant="text" icon @click="moveIndicator(index, -1)"
                                    :disabled="index === 0">
                                    <v-icon size="small">mdi-arrow-up</v-icon>
                                </v-btn>
                                <v-btn size="x-small" variant="text" icon @click="moveIndicator(index, 1)"
                                    :disabled="index === localSettings.length - 1">
                                    <v-icon size="small">mdi-arrow-down</v-icon>
                                </v-btn>
                            </div>
                        </div>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="cancel">{{ languageStore.t('general.cancel') }}</v-btn>
                <v-btn color="primary" @click="save">{{ languageStore.t('general.save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';
import { useDialogStore } from '@/stores/dialogStore';

const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();
const dialogStore = useDialogStore();

const localSettings = ref([]);

// Load settings when dialog opens
watch(() => dialogStore.dialogs.indicatorSettingsDialog, (open) => {
    if (open) {
        localSettings.value = trackerStore.indicatorSettings.map(s => ({ ...s }));
    }
});

const getIndicatorLabel = (key) => {
    const labels = {
        acidBase: languageStore.t('tracker.acidBase.title'),
        histamine: languageStore.t('tracker.histamine.title'),
    };
    return labels[key] || key;
};

const getPreviewColor = (key) => {
    const colors = {
        acidBase: '#00897B',
        histamine: '#81C784',
    };
    return colors[key] || '#BDBDBD';
};

const moveIndicator = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= localSettings.value.length) return;
    const moved = localSettings.value.splice(index, 1)[0];
    localSettings.value.splice(newIndex, 0, moved);
};

const save = () => {
    trackerStore.indicatorSettings = localSettings.value.map(s => ({ ...s }));
    trackerStore.saveIndicatorSettings();
    dialogStore.closeDialog('indicatorSettingsDialog');
};

const cancel = () => {
    dialogStore.closeDialog('indicatorSettingsDialog');
};
</script>

<style scoped>
.indicator-preview {
    width: 4px;
    height: 20px;
    min-height: 20px;
}
</style>
