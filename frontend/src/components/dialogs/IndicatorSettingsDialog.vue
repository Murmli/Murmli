<template>
    <v-dialog v-model="dialogStore.dialogs.indicatorSettingsDialog" location="top" scrollable max-width="480">
        <v-card class="indicator-settings-card">
            <v-card-title class="d-flex align-center pa-4">
                <v-icon icon="mdi-tune-variant" class="mr-2" color="primary" size="small"></v-icon>
                <span class="text-h6">{{ languageStore.t('tracker.indicatorSettings.title') }}</span>
            </v-card-title>
            
            <v-card-text class="pt-0 px-4">
                <p class="text-body-2 text-medium-emphasis mb-4">
                    {{ languageStore.t('tracker.indicatorSettings.description') }}
                </p>

                <!-- Preview Section -->
                <v-sheet class="preview-section mb-4 pa-3 rounded-lg" elevation="0">
                    <div class="text-caption mb-2 d-flex align-center" style="color: rgba(255,255,255,0.8);">
                        <v-icon icon="mdi-eye-outline" size="x-small" class="mr-1" color="white"></v-icon>
                        {{ languageStore.t('tracker.indicatorSettings.preview') }}
                    </div>
                    <div class="preview-item d-flex align-center pa-2 rounded bg-white">
                        <div class="preview-content flex-grow-1">
                            <div class="preview-title text-body-2 font-weight-medium text-high-emphasis">Apfel</div>
                            <div class="preview-subtitle text-caption text-medium-emphasis">150 g (78 kcal)</div>
                        </div>
                        <div class="preview-indicators d-flex align-center ga-1">
                            <template v-for="indicator in enabledPreviewIndicators" :key="indicator.key">
                                <div 
                                    class="preview-indicator-btn"
                                    :style="{ backgroundColor: getPreviewIndicatorColor(indicator.key) }"
                                >
                                    <v-icon v-if="indicator.key === 'histamine'" size="x-small" color="white">mdi-molecule</v-icon>
                                    <v-icon v-else-if="indicator.key === 'acidBase'" size="x-small" color="white">mdi-ph</v-icon>
                                </div>
                            </template>
                            <span v-if="enabledPreviewIndicators.length === 0" class="text-caption text-medium-emphasis">
                                {{ languageStore.t('tracker.indicatorSettings.noIndicators') }}
                            </span>
                        </div>
                    </div>
                </v-sheet>

                <!-- Indicator Cards -->
                <v-list class="indicator-list pa-0 bg-transparent">
                    <v-list-item 
                        v-for="(indicator, index) in localSettings" 
                        :key="indicator.key"
                        class="indicator-card px-0 mb-2"
                    >
                        <v-card
                            variant="outlined"
                            :class="{ 'indicator-disabled': !indicator.enabled }"
                            class="w-100"
                        >
                            <v-card-text class="pa-3">
                                <div class="d-flex align-center">
                                    <!-- Reorder Buttons -->
                                    <div class="d-flex flex-column mr-2 reorder-buttons">
                                        <v-btn
                                            variant="text"
                                            icon="mdi-chevron-up"
                                            size="x-small"
                                            density="compact"
                                            :disabled="index === 0"
                                            @click="moveIndicator(index, -1)"
                                            class="reorder-btn"
                                        ></v-btn>
                                        <v-btn
                                            variant="text"
                                            icon="mdi-chevron-down"
                                            size="x-small"
                                            density="compact"
                                            :disabled="index === localSettings.length - 1"
                                            @click="moveIndicator(index, 1)"
                                            class="reorder-btn"
                                        ></v-btn>
                                    </div>

                                    <!-- Icon & Label -->
                                    <div class="indicator-icon-container mr-3">
                                        <div 
                                            class="indicator-icon"
                                            :style="{ backgroundColor: getPreviewColor(indicator.key) }"
                                        >
                                            <v-icon 
                                                v-if="indicator.key === 'histamine'" 
                                                size="small" 
                                                color="white"
                                            >mdi-molecule</v-icon>
                                            <v-icon 
                                                v-else-if="indicator.key === 'acidBase'" 
                                                size="small" 
                                                color="white"
                                            >mdi-ph</v-icon>
                                        </div>
                                    </div>

                                    <!-- Info -->
                                    <div class="flex-grow-1">
                                        <div class="text-body-2 font-weight-medium">
                                            {{ getIndicatorLabel(indicator.key) }}
                                        </div>
                                        <div class="text-caption text-medium-emphasis">
                                            {{ getIndicatorDescription(indicator.key) }}
                                        </div>
                                    </div>

                                    <!-- Toggle Switch -->
                                    <v-switch
                                        v-model="indicator.enabled"
                                        color="primary"
                                        hide-details
                                        density="compact"
                                        class="ml-3 indicator-switch"
                                    ></v-switch>
                                </div>

                                <!-- Status Info (only when enabled) -->
                                <v-expand-transition>
                                    <div v-if="indicator.enabled" class="mt-2 pt-2 status-info border-t">
                                        <div class="d-flex align-center flex-wrap ga-2">
                                            <v-chip
                                                v-for="(color, i) in getIndicatorColorScale(indicator.key)"
                                                :key="i"
                                                size="x-small"
                                                :color="color.color"
                                                variant="flat"
                                                class="status-chip"
                                            >
                                                <v-icon size="x-small" class="mr-1">{{ color.icon }}</v-icon>
                                                {{ color.label }}
                                            </v-chip>
                                        </div>
                                    </div>
                                </v-expand-transition>
                            </v-card-text>
                        </v-card>
                    </v-list-item>
                </v-list>
            </v-card-text>
            
            <v-divider></v-divider>
            
            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn 
                    variant="text" 
                    @click="cancel"
                    class="mr-2"
                >
                    {{ languageStore.t('general.cancel') }}
                </v-btn>
                <v-btn 
                    color="primary" 
                    variant="elevated"
                    @click="save"
                    prepend-icon="mdi-check"
                >
                    {{ languageStore.t('general.save') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
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
}, { immediate: true });

const enabledPreviewIndicators = computed(() => {
    return localSettings.value.filter(i => i.enabled);
});

const getIndicatorLabel = (key) => {
    const labels = {
        acidBase: languageStore.t('tracker.acidBase.title'),
        histamine: languageStore.t('tracker.histamine.title'),
    };
    return labels[key] || key;
};

const getIndicatorDescription = (key) => {
    const descriptions = {
        acidBase: languageStore.t('tracker.indicatorSettings.acidBaseDesc'),
        histamine: languageStore.t('tracker.indicatorSettings.histamineDesc'),
    };
    return descriptions[key] || '';
};

const getPreviewColor = (key) => {
    const colors = {
        acidBase: '#00897B',
        histamine: '#66BB6A',
    };
    return colors[key] || '#BDBDBD';
};

const getPreviewIndicatorColor = (key) => {
    const colors = {
        acidBase: '#00897B',
        histamine: '#66BB6A',
    };
    return colors[key] || '#BDBDBD';
};

const getIndicatorColorScale = (key) => {
    if (key === 'acidBase') {
        return [
            { color: 'teal', icon: 'mdi-ph', label: languageStore.t('tracker.itemIndicator.alkaline') },
            { color: 'grey', icon: 'mdi-scale-balance', label: languageStore.t('tracker.itemIndicator.neutral') },
            { color: 'warning', icon: 'mdi-ph', label: languageStore.t('tracker.itemIndicator.acidic') },
        ];
    }
    if (key === 'histamine') {
        return [
            { color: 'success', icon: 'mdi-molecule', label: languageStore.t('tracker.itemIndicator.histamineLow') },
            { color: 'warning', icon: 'mdi-alert', label: languageStore.t('tracker.itemIndicator.histamineModerate') },
            { color: 'error', icon: 'mdi-alert-circle', label: languageStore.t('tracker.itemIndicator.histamineHigh') },
        ];
    }
    return [];
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
.indicator-settings-card {
    margin-top: 20px;
}

.preview-section {
    background: linear-gradient(135deg, #FF8F00 0%, #FF6F00 100%) !important;
    border: none;
}

.preview-item {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-indicator-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.indicator-list {
    background: transparent !important;
}

.indicator-card {
    background: transparent !important;
}

.indicator-card :deep(.v-card) {
    transition: all 0.2s ease;
}

.indicator-disabled :deep(.v-card) {
    opacity: 0.6;
}

.indicator-icon-container {
    flex-shrink: 0;
}

.indicator-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.indicator-switch {
    flex-shrink: 0;
    margin-right: 4px;
}

.indicator-switch :deep(.v-selection-control) {
    min-height: auto;
}

.indicator-switch :deep(.v-selection-control__wrapper) {
    margin-right: 0;
}

.status-info {
    border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.status-chip {
    font-size: 10px;
}

.reorder-buttons {
    flex-shrink: 0;
}

.reorder-btn {
    opacity: 0.5;
    transition: opacity 0.2s;
}

.reorder-btn:hover:not(:disabled) {
    opacity: 1;
}

.reorder-btn:disabled {
    opacity: 0.2;
}
</style>
