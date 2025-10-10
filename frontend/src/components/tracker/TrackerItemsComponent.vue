<template>
    <div v-if="!tracker || !tracker.foodItems || tracker.foodItems.length === 0">
        <!-- No Items Message -->
        <v-alert type="info">{{ languageStore.t('tracker.noItemsTracked') }}</v-alert>
    </div>
    <div v-else>
        <!-- Food Item Card -->
        <v-card @click="openDropdown(item)" class="mb-1" v-for="(item, index) in tracker.foodItems" :key="index"
            :class="getHealthyRatingClass(item.healthyRating)">
            <v-card-title class=" text-subtitle-2">
                {{ item.name }} {{ item.daily === 1 ? languageStore.t('tracker.dailyTracked') : '' }}
            </v-card-title>

            <v-card-subtitle class="text-caption">
                {{ item.amount }} {{ item.unit }} ({{ item.kcal }} {{ languageStore.t('tracker.kcal') }})
            </v-card-subtitle>
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
                        <v-col>
                            <v-text-field v-model="trackerStore.selectedItem.kcal" type="number"
                                :label="languageStore.t('tracker.calories')" min="0" />
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

const trackerStore = useTrackerStore();
const shoppingListStore = useShoppingListStore();
const languageStore = useLanguageStore();

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
    // Beim Öffnen des Dialogs das ursprüngliche Verhältnis speichern
    if (trackerStore.selectedItem &&
        parseFloat(trackerStore.selectedItem.amount) > 0 &&
        parseFloat(trackerStore.selectedItem.kcal) >= 0) {
        originalRatio.value = parseFloat(trackerStore.selectedItem.kcal) / parseFloat(trackerStore.selectedItem.amount);
    }
};

const updateKcalBasedOnAmount = () => {
    const amount = parseFloat(trackerStore.selectedItem.amount);
    if (amount > 0 && originalRatio.value > 0) {
        // Berechne die neuen Kalorien basierend auf dem Verhältnis und der neuen Menge
        const newKcal = Math.round(amount * originalRatio.value);
        trackerStore.selectedItem.kcal = newKcal.toString();
    }
};

// Überwache Änderungen am selectedItem, wenn der Dialog geöffnet wird
watch(() => changeItemDialog.value, (newValue) => {
    if (newValue && trackerStore.selectedItem) {
        // Beim Öffnen des Dialogs das ursprüngliche Verhältnis speichern
        if (parseFloat(trackerStore.selectedItem.amount) > 0 &&
            parseFloat(trackerStore.selectedItem.kcal) >= 0) {
            originalRatio.value = parseFloat(trackerStore.selectedItem.kcal) / parseFloat(trackerStore.selectedItem.amount);
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
</style>
