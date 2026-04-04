<template>
    <div v-if="!tracker || !tracker.foodItems || tracker.foodItems.length === 0">
        <!-- No Items Message -->
        <v-alert type="info">{{ languageStore.t('tracker.noItemsTracked') }}</v-alert>
    </div>
    <div v-else>
        <!-- Grouped Food Items with Drag and Drop -->
        <draggable 
            v-model="localDraggableGroups" 
            item-key="tempId"
            :delay="300"
            :delay-on-touch-only="true"
            :touch-start-threshold="5"
            @end="onDragEnd"
            class="draggable-list"
            ghost-class="ghost-card"
        >
            <template #item="{ element: group }">
                <div class="draggable-item-wrapper">
                    <!-- Group Header (only for actual groups) -->
                    <v-card v-if="group.isGroup" class="mb-2 food-group-card" color="grey-lighten-4">
                        <v-card-title class="text-subtitle-1 d-flex align-center py-2">
                            <v-btn icon size="x-small" variant="tonal" color="primary" class="mr-2" @click.stop="openGroupScaleDialog(group)">
                                <v-icon size="small">mdi-pencil</v-icon>
                            </v-btn>
                            {{ group.name }}
                            <v-spacer></v-spacer>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text class="pa-0">
                            <v-card @click="openDropdown(item)" 
                                @touchstart="handleTouchStart($event, item)"
                                @touchmove="handleTouchMove"
                                @touchend="handleTouchEnd"
                                @touchcancel="handleTouchEnd"
                                class="food-item-card group-item" v-for="(item, iIndex) in group.items" :key="item._id || iIndex"
                                :class="getHealthyRatingClass(item.healthyRating)" variant="flat">
                                <div class="d-flex align-stretch">
                                    <div class="flex-grow-1 overflow-hidden">
                                        <v-card-title class="text-subtitle-2">
                                            {{ item.name }} {{ item.daily === 1 ? languageStore.t('tracker.dailyTracked') : '' }}
                                        </v-card-title>
                                        <v-card-subtitle class="text-caption">
                                            {{ item.amount }} {{ item.unit }} ({{ item.kcal }} {{ languageStore.t('tracker.kcal') }})
                                        </v-card-subtitle>
                                    </div>
                                    <div class="indicator-buttons d-flex align-center ga-1 mr-3 my-2" v-if="hasVisibleIndicators(item)">
                                        <template v-for="indicator in enabledIndicators" :key="indicator.key">
                                            <v-tooltip :text="getIndicatorTooltip(indicator.key, item)" location="top">
                                                <template v-slot:activator="{ props }">
                                                    <div v-bind="props"
                                                        class="indicator-btn"
                                                        :class="`indicator-btn-${indicator.key}`"
                                                        :style="{ backgroundColor: getIndicatorColor(indicator.key, item) }"
                                                        @click.stop="openIndicatorSettings"
                                                    >
                                                        <v-icon v-if="indicator.key === 'histamine'" size="x-small" color="white">mdi-molecule</v-icon>
                                                        <v-icon v-else-if="indicator.key === 'acidBase'" size="x-small" color="white">mdi-ph</v-icon>
                                                    </div>
                                                </template>
                                            </v-tooltip>
                                        </template>
                                    </div>
                                </div>
                            </v-card>
                        </v-card-text>
                    </v-card>

                    <!-- Single Item (no group) -->
                    <v-card v-else @click="openDropdown(item)" 
                        @touchstart="handleTouchStart($event, item)"
                        @touchmove="handleTouchMove"
                        @touchend="handleTouchEnd"
                        @touchcancel="handleTouchEnd"
                        class="mb-2 food-item-card" v-for="(item, iIndex) in group.items" :key="item._id || iIndex"
                        :class="getHealthyRatingClass(item.healthyRating)">
                        <div class="d-flex align-stretch">
                            <div class="flex-grow-1 overflow-hidden">
                                <v-card-title class="text-subtitle-2">
                                    {{ item.name }} {{ item.daily === 1 ? languageStore.t('tracker.dailyTracked') : '' }}
                                </v-card-title>
                                <v-card-subtitle class="text-caption">
                                    {{ item.amount }} {{ item.unit }} ({{ item.kcal }} {{ languageStore.t('tracker.kcal') }})
                                </v-card-subtitle>
                            </div>
                            <div class="indicator-buttons d-flex align-center ga-1 mr-3 my-2" v-if="hasVisibleIndicators(item)">
                                <template v-for="indicator in enabledIndicators" :key="indicator.key">
                                    <v-tooltip :text="getIndicatorTooltip(indicator.key, item)" location="top">
                                        <template v-slot:activator="{ props }">
                                            <div v-bind="props"
                                                class="indicator-btn"
                                                :class="`indicator-btn-${indicator.key}`"
                                                :style="{ backgroundColor: getIndicatorColor(indicator.key, item) }"
                                                @click.stop="openIndicatorSettings"
                                            >
                                                <v-icon v-if="indicator.key === 'histamine'" size="x-small" color="white">mdi-molecule</v-icon>
                                                <v-icon v-else-if="indicator.key === 'acidBase'" size="x-small" color="white">mdi-ph</v-icon>
                                            </div>
                                        </template>
                                    </v-tooltip>
                                </template>
                            </div>
                        </div>
                    </v-card>
                </div>
            </template>
        </draggable>

        <!-- Bottom Sheet -->

        <!-- Bottom Sheet -->

        <v-bottom-sheet v-model="dropdownMenu">
            <v-card>
                <v-card-title>
                    {{ trackerStore.selectedItem.name }}
                </v-card-title>
                <v-card-text>
                    <v-list>
                        <v-list-item @click="openChangeItem(item)">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-pencil"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('tracker.menu.edit') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="toggleFavoriteInStore()">
                            <template v-slot:prepend>
                                <v-icon :color="isFavorite() ? 'red' : ''" icon="mdi-star"></v-icon>
                            </template>
                            <v-list-item-title>
                                {{ isFavorite() ? languageStore.t('recipe.menu.removeFavorite') :
                                    languageStore.t('recipe.menu.addFavorite') }}
                            </v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="toggleDaily()">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-infinity"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('tracker.menu.daily') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item v-if="isNotToday" @click="addItemToday()">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-calendar-plus"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('tracker.menu.addToToday') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="addToShoppingList()">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-cart-plus"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('tracker.menu.addToShoppingList') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="duplicateItem()">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-content-copy"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('tracker.menu.duplicate') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="deleteItem()">
                            <template v-slot:prepend>
                                <v-icon color="red" icon="mdi-delete-empty"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('tracker.menu.remove') }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn @click="dropdownMenu = false">{{ languageStore.t('general.close') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-bottom-sheet>
    </div>

    <!-- Change Item Dialog-->
    <v-dialog v-model="changeItemDialog" persistent max-width="600px">
        <v-card>
            <v-card-title class="d-flex align-center">
                <span>{{ trackerStore.selectedItem.name }}</span>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-restore" variant="text" size="small" @click="resetToOriginal"
                    :title="languageStore.t('general.reset')"></v-btn>
            </v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="trackerStore.selectedItem.name"
                                :label="languageStore.t('shoppingList.nameLabel')" class="w-100" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="6">
                            <v-text-field v-model="trackerStore.selectedItem.amount" type="number"
                                :label="languageStore.t('shoppingList.amountLabel')" min="0"
                                @input="updateKcalBasedOnAmount" />
                        </v-col>
                        <v-col>
                            <v-text-field v-model="trackerStore.selectedItem.unit"
                                :label="languageStore.t('shoppingList.unitLabel')" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="6">
                            <v-text-field v-model="trackerStore.selectedItem.kcal" type="number"
                                :label="languageStore.t('tracker.calories')" min="0" />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field v-model="trackerStore.selectedItem.protein" type="number"
                                :label="languageStore.t('tracker.protein')" min="0" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="6">
                            <v-text-field v-model="trackerStore.selectedItem.carbohydrates" type="number"
                                :label="languageStore.t('tracker.carbohydrates')" min="0" />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field v-model="trackerStore.selectedItem.fat" type="number"
                                :label="languageStore.t('tracker.fat')" min="0" />
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-btn text @click="changeItemDialog = false">{{ languageStore.t('general.close')
                    }}</v-btn>
                <v-spacer></v-spacer>
                <v-btn text color="primary" @click="saveEditedItem">{{ languageStore.t('general.save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Group Scale Dialog -->
    <v-dialog v-model="groupScaleDialog" max-width="400px">
        <v-card>
            <v-card-title>
                <v-text-field
                    v-model="localGroupName"
                    :label="languageStore.t('tracker.groupName') || 'Gericht Name'"
                    variant="underlined"
                    density="compact"
                    hide-details
                    class="mb-2"
                ></v-text-field>
            </v-card-title>
            <v-card-text>
                <div class="text-body-2 mb-4">
                    {{ languageStore.t('tracker.scaleGroupInfo') || 'Passe die Portion für das gesamte Gericht an. Alle Zutaten werden proportional skaliert.' }}
                </div>
                
                <v-alert variant="tonal" color="primary" class="mb-4">
                    <div class="d-flex justify-space-between align-center">
                        <span class="text-subtitle-1">{{ languageStore.t('tracker.calories') }}:</span>
                        <span class="text-h6">{{ currentGroupCalories }} {{ languageStore.t('tracker.kcal') }}</span>
                    </div>
                </v-alert>

                <div class="d-flex align-center mb-2">
                    <span class="text-h6">{{ groupScalingFactor }}x</span>
                    <v-spacer></v-spacer>
                    <span class="text-caption">{{ languageStore.t('tracker.portions') || 'Portionen' }}</span>
                </div>

                <v-slider
                    v-model="groupScalingFactor"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    thumb-label
                    color="primary"
                    hide-details
                    class="mt-2"
                ></v-slider>

                <v-text-field
                    v-if="hasWeightInGroup"
                    v-model.number="localWeight"
                    type="number"
                    :label="languageStore.t('tracker.totalWeight')"
                    suffix="g"
                    density="compact"
                    variant="outlined"
                    class="mt-4"
                    hide-details
                    @input="onWeightInput"
                    @focus="isWeightInputFocused = true"
                    @blur="isWeightInputFocused = false"
                ></v-text-field>

                <v-row dense class="mt-4">
                    <v-col cols="3">
                        <v-btn block variant="outlined" size="small" @click="adjustScaling(-1.0)" :disabled="groupScalingFactor <= 1.0">
                            -1
                        </v-btn>
                    </v-col>
                    <v-col cols="3">
                        <v-btn block variant="outlined" size="small" @click="adjustScaling(-0.1)" :disabled="groupScalingFactor <= 0.1">
                            -0.1
                        </v-btn>
                    </v-col>
                    <v-col cols="3">
                        <v-btn block variant="outlined" size="small" @click="adjustScaling(0.1)" :disabled="groupScalingFactor >= 5.0">
                            +0.1
                        </v-btn>
                    </v-col>
                    <v-col cols="3">
                        <v-btn block variant="outlined" size="small" @click="adjustScaling(1.0)" :disabled="groupScalingFactor >= 4.0">
                            +1
                        </v-btn>
                    </v-col>
                </v-row>

                <v-divider class="my-6"></v-divider>

                <div class="text-subtitle-2 mb-2">
                    {{ languageStore.t('tracker.refineGroupTitle') || 'Mit KI anpassen' }}
                </div>
                <div class="text-caption mb-3">
                    {{ languageStore.t('tracker.refineGroupInfo') || 'Gib an, was an diesem Gericht geändert werden soll (z.B. "weniger Öl", "mehr Protein").' }}
                </div>
                
                <v-textarea
                    v-model="groupRefineInstructions"
                    :placeholder="languageStore.t('tracker.refineGroupPlaceholder') || 'Anweisung eingeben...'"
                    variant="outlined"
                    density="compact"
                    rows="2"
                    auto-grow
                    hide-details
                    class="mb-3"
                ></v-textarea>

                <v-btn
                    block
                    color="secondary"
                    variant="tonal"
                    :loading="isRefining"
                    :disabled="!groupRefineInstructions.trim()"
                    prepend-icon="mdi-auto-fix"
                    @click="refineGroup"
                >
                    {{ languageStore.t('tracker.refineGroupButton') || 'Anpassung anwenden' }}
                </v-btn>
            </v-card-text>
            <v-card-actions>
                <v-btn text @click="groupScaleDialog = false">{{ languageStore.t('general.close') }}</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="saveGroupScaling" :loading="isScaling">{{ languageStore.t('general.save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { maybeShowRatingPrompt } from '@/utils/appRating';
import draggable from 'vuedraggable';

const trackerStore = useTrackerStore();
const shoppingListStore = useShoppingListStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const tracker = computed(() => trackerStore.tracker || { foodItems: [] });

const isLongPressActive = ref(false);
const longPressTimer = ref(null);
const touchStartPos = ref({ x: 0, y: 0 });
const LONG_PRESS_DELAY = 1500; // ms for duplication
const MOVE_THRESHOLD = 10; // px to cancel duplication

const startLongPressTimer = (item) => {
    cancelLongPressTimer();
    
    longPressTimer.value = setTimeout(async () => {
        isLongPressActive.value = true;
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {}
        
        trackerStore.selectedItem = item;
        await trackerStore.duplicateFoodItem();
        
        // Reset state after a short delay
        setTimeout(() => {
            isLongPressActive.value = false;
        }, 500);
    }, LONG_PRESS_DELAY);
};

const cancelLongPressTimer = () => {
    if (longPressTimer.value) {
        clearTimeout(longPressTimer.value);
        longPressTimer.value = null;
    }
};

const handleTouchStart = (e, item) => {
    const touch = e.touches[0];
    touchStartPos.value = { x: touch.clientX, y: touch.clientY };
    startLongPressTimer(item);
};

const handleTouchMove = (e) => {
    if (!longPressTimer.value) return;
    
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.value.x);
    const dy = Math.abs(touch.clientY - touchStartPos.value.y);
    
    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        cancelLongPressTimer();
    }
};

const handleTouchEnd = () => {
    cancelLongPressTimer();
};

// Local state for draggable to allow mutation
const localDraggableGroups = ref([]);

// Grouping logic (Order-preserving)
const groupedFoodItems = computed(() => {
    if (!tracker.value || !tracker.value.foodItems) return [];
    
    const groups = [];
    const groupMap = new Map();

    tracker.value.foodItems.forEach((item, index) => {
        if (item.groupId) {
            if (!groupMap.has(item.groupId)) {
                const newGroup = {
                    id: item.groupId,
                    tempId: 'group-' + item.groupId, // tempId for draggable
                    name: item.groupName || 'Gericht',
                    isGroup: true,
                    items: []
                };
                groupMap.set(item.groupId, newGroup);
                groups.push(newGroup);
            }
            groupMap.get(item.groupId).items.push(item);
        } else {
            // Wir behandeln jedes nicht-gruppierte Item einzeln in der Anzeige
            groups.push({ 
                isGroup: false, 
                tempId: item._id || 'item-' + index, // tempId for draggable
                items: [item] 
            });
        }
    });

    return groups;
});

// Sync local state with store
watch(groupedFoodItems, (newVal) => {
    // Only update if not currently dragging to avoid jitter
    // We deep copy to ensure vuedraggable can mutate freely
    localDraggableGroups.value = JSON.parse(JSON.stringify(newVal));
}, { immediate: true, deep: true });

const onDragEnd = async (event) => {
    // Collect all item IDs in the new order
    const newItemIds = [];
    localDraggableGroups.value.forEach(group => {
        group.items.forEach(item => {
            if (item._id) newItemIds.push(item._id);
        });
    });
    
    // Update the backend
    await trackerStore.reorderItems(newItemIds);
};

// Real-time calorie calculation for group scaling
const currentGroupCalories = computed(() => {
    if (!selectedGroup.value || !selectedGroup.value.items) return 0;
    const totalBaseKcal = selectedGroup.value.items.reduce((sum, item) => sum + (item.kcal || 0), 0);
    return Math.round(totalBaseKcal * groupScalingFactor.value);
});

const isNotToday = computed(() => {
    const date = tracker.value?.date ? new Date(tracker.value.date) : new Date();
    const today = new Date();
    return date.getFullYear() !== today.getFullYear() ||
        date.getMonth() !== today.getMonth() ||
        date.getDate() !== today.getDate();
});
const dropdownMenu = ref(false);
const changeItemDialog = ref(false);
const groupScaleDialog = ref(false);
const isScaling = ref(false);
const isRefining = ref(false);
const selectedGroup = ref(null);
const localGroupName = ref('');
const groupScalingFactor = ref(1.0);
const groupRefineInstructions = ref('');
const localWeight = ref(0);
const isWeightInputFocused = ref(false);

const getTotalBaseWeight = () => {
    if (!selectedGroup.value || !selectedGroup.value.items) return 0;
    return selectedGroup.value.items.reduce((sum, item) => {
        if (item.unit === 'g' || item.unit === 'ml') {
            return sum + (item.amount || 0);
        }
        return sum;
    }, 0);
};

// Update localWeight whenever scaling factor changes (slider, buttons, initial)
watch(groupScalingFactor, (newFactor) => {
    // If user is currently typing in the weight field, do NOT overwrite it
    if (isWeightInputFocused.value) return;

    const base = getTotalBaseWeight();
    if (base > 0) {
        const val = base * newFactor;
        // Only update localWeight if the difference is significant
        if (Math.abs(localWeight.value - val) > 0.1) {
             localWeight.value = val % 1 === 0 ? val : parseFloat(val.toFixed(1));
        }
    }
});

const onWeightInput = () => {
    const base = getTotalBaseWeight();
    // Allow very small weights while typing
    if (base > 0 && localWeight.value >= 0) {
        let newFactor = parseFloat((localWeight.value / base).toFixed(4));
        // Keep internal factor limits very low to prevent jumps during typing
        if (newFactor < 0.001) newFactor = 0.001;
        if (newFactor > 20.0) newFactor = 20.0;
        groupScalingFactor.value = newFactor;
    }
};

const hasWeightInGroup = computed(() => {
    if (!selectedGroup.value || !selectedGroup.value.items) return false;
    return selectedGroup.value.items.some(item => item.unit === 'g' || item.unit === 'ml');
});

const currentGroupWeight = computed({
    get() {
        if (!selectedGroup.value || !selectedGroup.value.items) return 0;
        const totalBaseWeight = selectedGroup.value.items.reduce((sum, item) => {
            if (item.unit === 'g' || item.unit === 'ml') {
                return sum + (item.amount || 0);
            }
            return sum;
        }, 0);
        // Nutze eine höhere Präzision für die Anzeige, um Sprünge zu vermeiden
        const weight = totalBaseWeight * groupScalingFactor.value;
        return weight % 1 === 0 ? weight : parseFloat(weight.toFixed(1));
    },
    set(newWeight) {
        if (!selectedGroup.value || !selectedGroup.value.items) return;
        const totalBaseWeight = selectedGroup.value.items.reduce((sum, item) => {
            if (item.unit === 'g' || item.unit === 'ml') {
                return sum + (item.amount || 0);
            }
            return sum;
        }, 0);
        if (totalBaseWeight > 0) {
            // Erhöhe die Präzision auf 4 Nachkommastellen für den Faktor
            let newFactor = parseFloat((newWeight / totalBaseWeight).toFixed(4));
            if (newFactor < 0.01) newFactor = 0.01;
            if (newFactor > 10.0) newFactor = 10.0;
            groupScalingFactor.value = newFactor;
        }
    }
});

const originalItemData = ref(null);
const originalRatio = ref(0); // Speichert das ursprüngliche Verhältnis von kcal zu amount
const originalProteinRatio = ref(0);
const originalCarbsRatio = ref(0);
const originalFatRatio = ref(0);

const openDropdown = (item) => {
    if (isLongPressActive.value) return;
    trackerStore.selectedItem = item;
    dropdownMenu.value = true;
    
    // Zufällig Bewertungs-Aufforderung triggern
    maybeShowRatingPrompt();
};

const openGroupScaleDialog = (group) => {
    selectedGroup.value = group;
    localGroupName.value = group.name;
    groupScalingFactor.value = 1.0; // Start at 1.0 as factor
    
    // Initialize localWeight
    const base = getTotalBaseWeight();
    localWeight.value = base % 1 === 0 ? base : parseFloat(base.toFixed(1));
    
    groupScaleDialog.value = true;
};

const adjustScaling = (delta) => {
    let newVal = parseFloat((groupScalingFactor.value + delta).toFixed(1));
    if (newVal < 0.1) newVal = 0.1;
    if (newVal > 5.0) newVal = 5.0;
    groupScalingFactor.value = newVal;
    
    // Update localWeight to match the new factor
    const base = getTotalBaseWeight();
    if (base > 0) {
        const val = base * newVal;
        localWeight.value = val % 1 === 0 ? val : parseFloat(val.toFixed(1));
    }
};

const saveGroupScaling = async () => {
    if (!selectedGroup.value) return;
    
    isScaling.value = true;
    try {
        await trackerStore.updateFoodGroup(selectedGroup.value.id, groupScalingFactor.value, localGroupName.value);
        groupScaleDialog.value = false;
    } finally {
        isScaling.value = false;
    }
};

const refineGroup = async () => {
    if (!selectedGroup.value || !groupRefineInstructions.value.trim()) return;

    isRefining.value = true;
    try {
        await trackerStore.refineFoodGroup(selectedGroup.value.id, groupRefineInstructions.value);
        groupRefineInstructions.value = '';
        groupScaleDialog.value = false;
    } finally {
        isRefining.value = false;
    }
};

const toggleDaily = async () => {

    await trackerStore.toggleDaily();
    dropdownMenu.value = false;
};

const addToShoppingList = async () => {
    if (trackerStore.selectedItem && trackerStore.selectedItem.name) {
        shoppingListStore.addItemToShoppingList(trackerStore.selectedItem.name);
    }
    dropdownMenu.value = false;
};

const duplicateItem = async () => {
    await trackerStore.duplicateFoodItem();
    dropdownMenu.value = false;
};

const handleLongPress = async (item) => {
    isLongPressActive.value = true;
    try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {}
    
    dropdownMenu.value = false;
    trackerStore.selectedItem = item;
    await trackerStore.duplicateFoodItem();
    
    setTimeout(() => {
        isLongPressActive.value = false;
    }, 500);
};

const deleteItem = async () => {
    await trackerStore.removeFoodItem();
    dropdownMenu.value = false;
};

const addItemToday = async () => {
    await trackerStore.addItemToToday();
    dropdownMenu.value = false;
};

const openChangeItem = () => {
    changeItemDialog.value = true;
    // Beim Öffnen des Dialogs eine Kopie des Originals speichern
    originalItemData.value = JSON.parse(JSON.stringify(trackerStore.selectedItem));
    
    // Beim Öffnen des Dialogs die ursprünglichen Verhältnisse speichern
    if (trackerStore.selectedItem && parseFloat(trackerStore.selectedItem.amount) > 0) {
        const amount = parseFloat(trackerStore.selectedItem.amount);
        if (parseFloat(trackerStore.selectedItem.kcal) >= 0) {
            originalRatio.value = parseFloat(trackerStore.selectedItem.kcal) / amount;
        }
        if (parseFloat(trackerStore.selectedItem.protein) >= 0) {
            originalProteinRatio.value = parseFloat(trackerStore.selectedItem.protein) / amount;
        }
        if (parseFloat(trackerStore.selectedItem.carbohydrates) >= 0) {
            originalCarbsRatio.value = parseFloat(trackerStore.selectedItem.carbohydrates) / amount;
        }
        if (parseFloat(trackerStore.selectedItem.fat) >= 0) {
            originalFatRatio.value = parseFloat(trackerStore.selectedItem.fat) / amount;
        }
    }
};

const resetToOriginal = () => {
    if (originalItemData.value) {
        trackerStore.selectedItem = JSON.parse(JSON.stringify(originalItemData.value));
    }
};

const updateKcalBasedOnAmount = () => {
    const amount = parseFloat(trackerStore.selectedItem.amount);
    if (amount > 0) {
        // Berechne alle Nährwerte basierend auf den Verhältnissen und der neuen Menge
        if (originalRatio.value > 0) {
            const newKcal = Math.round(amount * originalRatio.value);
            trackerStore.selectedItem.kcal = newKcal.toString();
        }
        if (originalProteinRatio.value > 0) {
            const newProtein = parseFloat((amount * originalProteinRatio.value).toFixed(1));
            trackerStore.selectedItem.protein = newProtein.toString();
        }
        if (originalCarbsRatio.value > 0) {
            const newCarbs = parseFloat((amount * originalCarbsRatio.value).toFixed(1));
            trackerStore.selectedItem.carbohydrates = newCarbs.toString();
        }
        if (originalFatRatio.value > 0) {
            const newFat = parseFloat((amount * originalFatRatio.value).toFixed(1));
            trackerStore.selectedItem.fat = newFat.toString();
        }
    }
};

// Überwache Änderungen am selectedItem, wenn der Dialog geöffnet wird
watch(() => changeItemDialog.value, (newValue) => {
    if (newValue && trackerStore.selectedItem) {
        // Beim Öffnen des Dialogs eine Kopie des Originals speichern
        originalItemData.value = JSON.parse(JSON.stringify(trackerStore.selectedItem));

        // Beim Öffnen des Dialogs die ursprünglichen Verhältnisse speichern
        if (parseFloat(trackerStore.selectedItem.amount) > 0) {
            const amount = parseFloat(trackerStore.selectedItem.amount);
            if (parseFloat(trackerStore.selectedItem.kcal) >= 0) {
                originalRatio.value = parseFloat(trackerStore.selectedItem.kcal) / amount;
            }
            if (parseFloat(trackerStore.selectedItem.protein) >= 0) {
                originalProteinRatio.value = parseFloat(trackerStore.selectedItem.protein) / amount;
            }
            if (parseFloat(trackerStore.selectedItem.carbohydrates) >= 0) {
                originalCarbsRatio.value = parseFloat(trackerStore.selectedItem.carbohydrates) / amount;
            }
            if (parseFloat(trackerStore.selectedItem.fat) >= 0) {
                originalFatRatio.value = parseFloat(trackerStore.selectedItem.fat) / amount;
            }
        }
    }
});

const saveEditedItem = async () => {
    await trackerStore.updateFoodItem();
    changeItemDialog.value = false;
    dropdownMenu.value = false;
};

const isFavorite = () => {
    return trackerStore.favorites.some(fav => fav.name === trackerStore.selectedItem.name);
};

const toggleFavoriteInStore = () => {
    if (isFavorite()) {
        trackerStore.removeFavorite(trackerStore.selectedItem.name);
    } else {
        trackerStore.addFavorite(trackerStore.selectedItem);
    }
    dropdownMenu.value = false;
};

const getHealthyRatingClass = (rating) => {
    return {
        1: 'healthy-rating-very-low',
        2: 'healthy-rating-low',
        3: 'healthy-rating-medium',
        4: 'healthy-rating-high',
        5: 'healthy-rating-very-high'
    }[rating] || '';
};

// Indicator settings
const enabledIndicators = computed(() => trackerStore.getEnabledIndicators());

const hasVisibleIndicators = (item) => {
    if (enabledIndicators.value.length === 0) return false;
    return enabledIndicators.value.some(ind => {
        if (ind.key === 'acidBase') return item.acidBaseScore !== undefined && item.acidBaseScore !== null;
        if (ind.key === 'histamine') return item.histamineLevel !== undefined && item.histamineLevel !== null;
        return false;
    });
};

const getIndicatorColor = (key, item) => {
    if (key === 'acidBase') return getAcidBaseColor(item.acidBaseScore);
    if (key === 'histamine') return getHistamineColor(item.histamineLevel);
    return '#BDBDBD';
};

const getIndicatorTooltip = (key, item) => {
    if (key === 'acidBase') return getAcidBaseTooltip(item);
    if (key === 'histamine') return getHistamineTooltip(item);
    return '';
};

const getAcidBaseColor = (score) => {
    if (score === undefined || score === null) return '#BDBDBD';
    if (score <= -5) return '#00897B';   // teal - basisch
    if (score <= 5) return '#BDBDBD';    // grau - neutral
    if (score <= 15) return '#FFB74D';   // helles orange - leicht sauer
    return '#EF6C00';                     // orange - stark sauer
};

const getHistamineColor = (level) => {
    if (level === undefined || level === null || level === 0) return '#A5D6A7'; // hellgrün
    if (level === 1) return '#81C784'; // grün
    if (level === 2) return '#FFD54F'; // gelb/amber
    return '#EF5350';                   // rot
};

const getAcidBaseTooltip = (item) => {
    const score = item.acidBaseScore || 0;
    if (score <= -5) return `${languageStore.t('tracker.acidBase.title')}: ${score} mEq (${languageStore.t('tracker.itemIndicator.alkaline')})`;
    if (score <= 5) return `${languageStore.t('tracker.acidBase.title')}: ${score} mEq (${languageStore.t('tracker.itemIndicator.neutral')})`;
    return `${languageStore.t('tracker.acidBase.title')}: ${score} mEq (${languageStore.t('tracker.itemIndicator.acidic')})`;
};

const getHistamineTooltip = (item) => {
    const level = item.histamineLevel || 0;
    const labels = [
        languageStore.t('tracker.itemIndicator.histamineNone'),
        languageStore.t('tracker.itemIndicator.histamineLow'),
        languageStore.t('tracker.itemIndicator.histamineModerate'),
        languageStore.t('tracker.itemIndicator.histamineHigh')
    ];
    return `${languageStore.t('tracker.histamine.title')}: ${labels[level] || labels[0]}`;
};

const openIndicatorSettings = () => {
    dialogStore.openDialog('indicatorSettingsDialog');
};
</script>

<style scoped>
.healthy-rating-very-low {
    background: linear-gradient(to right, #D32F2F 8px, white 10px);
    /* Dunkelrot */
}

.healthy-rating-low {
    background: linear-gradient(to right, #EF5350 8px, white 10px);
    /* Rot */
}

.healthy-rating-medium {
    background: linear-gradient(to right, #FFC107 8px, white 10px);
    /* Gelb */
}

.healthy-rating-high {
    background: linear-gradient(to right, #66BB6A 8px, white 10px);
    /* Grün */
}

.healthy-rating-very-high {
    background: linear-gradient(to right, #2E7D32 8px, white 10px);
    /* Dunkelgrün */
}

.food-item-card {
    flex-shrink: 0;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.food-item-card .indicator-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0.9;
    transition: opacity 0.2s, transform 0.1s;
}

.food-item-card .indicator-btn:hover {
    opacity: 1;
    transform: scale(1.1);
}

.food-item-card .indicator-btn:active {
    transform: scale(0.95);
}

.food-item-card .indicator-letter {
    font-size: 12px;
    font-weight: bold;
    color: white;
    line-height: 1;
}

/* Drag and Drop Styles */
.drag-handle {
    cursor: grab;
}

.drag-handle:active {
    cursor: grabbing;
}

.ghost-card {
    opacity: 0.5;
    background: #c8ebfb !important;
}

.chosen-card {
    box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
}

.drag-card {
    opacity: 0;
}
</style>
