<template>
    <div v-if="!tracker || !tracker.foodItems || tracker.foodItems.length === 0">
        <!-- No Items Message -->
        <v-alert type="info">{{ languageStore.t('tracker.noItemsTracked') }}</v-alert>
    </div>
    <div v-else>
        <!-- Food Item Card -->
        <v-card @click="openDropdown(item)" class="mb-1 food-item-card" v-for="(item, index) in tracker.foodItems" :key="index"
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
                                    <span v-if="indicator.key === 'histamine'" class="indicator-letter">H</span>
                                    <v-icon v-else-if="indicator.key === 'acidBase'" size="x-small" color="white">mdi-water</v-icon>
                                </div>
                            </template>
                        </v-tooltip>
                    </template>
                </div>
            </div>
        </v-card>

        <!-- Bottom Sheet -->
        <v-dialog v-model="dropdownMenu" location="top">
            <v-card max-width="500" style="margin-top: 20px;">
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
        </v-dialog>
    </div>

    <!-- Change Item Dialog-->
    <v-dialog v-model="changeItemDialog" persistent max-width="600px">
        <v-card>
            <v-card-title>
                {{ changeItemDialog.name }}
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
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';

const trackerStore = useTrackerStore();
const shoppingListStore = useShoppingListStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const tracker = computed(() => trackerStore.tracker || { foodItems: [] });
const isNotToday = computed(() => {
    const date = tracker.value?.date ? new Date(tracker.value.date) : new Date();
    const today = new Date();
    return date.getFullYear() !== today.getFullYear() ||
        date.getMonth() !== today.getMonth() ||
        date.getDate() !== today.getDate();
});
const dropdownMenu = ref(false);
const changeItemDialog = ref(false);
const originalRatio = ref(0); // Speichert das ursprüngliche Verhältnis von kcal zu amount
const originalProteinRatio = ref(0);
const originalCarbsRatio = ref(0);
const originalFatRatio = ref(0);

const openDropdown = (item) => {
    trackerStore.selectedItem = item;
    dropdownMenu.value = true;
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

.food-item-card .indicator-buttons {
    flex-shrink: 0;
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
</style>
