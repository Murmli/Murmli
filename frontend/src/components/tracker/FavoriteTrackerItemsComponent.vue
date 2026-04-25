<template>
    <div class="w-100">
        <v-card class="mx-auto my-4 mt-10" max-width="600" variant="flat" color="transparent">
            <v-card-title class="px-0 d-flex align-center">
                {{ languageStore.t('shoppingList.favorites') }}
                <v-spacer></v-spacer>
            </v-card-title>
            <v-card-text class="px-0">
                <v-row dense>
                    <v-col 
                        v-for="favorite in favorites" 
                        :key="favorite._id" 
                        cols="4"
                        class="pa-1"
                    >
                        <v-card
                            class="favorite-item-card d-flex flex-column align-center justify-center pa-2"
                            variant="tonal"
                            color="primary"
                            @click="addFavoriteToTracker(favorite.item)"
                            @touchstart="handleTouchStart($event, favorite)"
                            @touchend="handleTouchEnd"
                            @touchcancel="handleTouchEnd"
                            @mousedown="handleMouseDown($event, favorite)"
                            @mouseup="handleMouseUp"
                            @mouseleave="handleMouseUp"
                        >
                            <v-icon 
                                :icon="favorite.item.icon || 'mdi-food'" 
                                size="36" 
                                class="mb-2"
                            ></v-icon>
                            <div class="favorite-name text-center">
                                {{ favorite.item.name }}
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Edit Favorite Dialog -->
        <v-dialog v-model="editDialog" max-width="500px">
            <v-card v-if="editingFavorite">
                <v-card-title class="d-flex align-center">
                    {{ languageStore.t('tracker.menu.edit') }}
                    <v-spacer></v-spacer>
                    <v-icon :icon="editingFavorite.item.icon"></v-icon>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field 
                                    v-model="editingFavorite.item.name" 
                                    :label="languageStore.t('shoppingList.nameLabel')" 
                                    @blur="updateIcon"
                                />
                            </v-col>
                            <v-col cols="12">
                                <IconPicker 
                                    v-model="editingFavorite.item.icon" 
                                    :label="languageStore.t('tracker.menu.editIcon') || 'Icon'" 
                                />
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="6">
                                <v-text-field v-model="editingFavorite.item.amount" type="number"
                                    :label="languageStore.t('shoppingList.amountLabel')" min="0" />
                            </v-col>
                            <v-col>
                                <v-text-field v-model="editingFavorite.item.unit"
                                    :label="languageStore.t('shoppingList.unitLabel')" />
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="6">
                                <v-text-field v-model="editingFavorite.item.kcal" type="number"
                                    :label="languageStore.t('tracker.calories')" min="0" />
                            </v-col>
                            <v-col cols="6">
                                <v-text-field v-model="editingFavorite.item.protein" type="number"
                                    :label="languageStore.t('tracker.protein')" min="0" />
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="6">
                                <v-text-field v-model="editingFavorite.item.carbohydrates" type="number"
                                    :label="languageStore.t('tracker.carbohydrates')" min="0" />
                            </v-col>
                            <v-col cols="6">
                                <v-text-field v-model="editingFavorite.item.fat" type="number"
                                    :label="languageStore.t('tracker.fat')" min="0" />
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="error" variant="text" @click="confirmDelete = true">
                        {{ languageStore.t('tracker.menu.remove') }}
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="saveFavorite">{{ languageStore.t('general.save') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation -->
        <v-dialog v-model="confirmDelete" max-width="300px">
            <v-card>
                <v-card-title class="text-h6">Wirklich löschen?</v-card-title>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="confirmDelete = false">Abbrechen</v-btn>
                    <v-btn color="error" @click="deleteFavorite">Löschen</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useApiStore } from '@/stores/apiStore';
import { storeToRefs } from 'pinia';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();
const apiStore = useApiStore();

const { favorites: storeFavorites } = storeToRefs(trackerStore);

const favorites = computed(() => {
    return [...storeFavorites.value].sort((a, b) => a.item.name.localeCompare(b.item.name));
});

const editDialog = ref(false);
const confirmDelete = ref(false);
const editingFavorite = ref(null);
const longPressTimer = ref(null);
const LONG_PRESS_DELAY = 600;

onMounted(() => {
    trackerStore.fetchFavorites();
});

const addFavoriteToTracker = async (item) => {
    if (longPressTimer.value === null && !editDialog.value) {
         await trackerStore.addFoodItemDirect(item);
         try {
            await Haptics.impact({ style: ImpactStyle.Light });
         } catch (e) {}
    }
};

const handleTouchStart = (e, favorite) => {
    startTimer(favorite);
};

const handleTouchEnd = () => {
    stopTimer();
};

const handleMouseDown = (e, favorite) => {
    startTimer(favorite);
};

const handleMouseUp = () => {
    stopTimer();
};

const startTimer = (favorite) => {
    stopTimer();
    longPressTimer.value = setTimeout(async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {}
        openEditDialog(favorite);
    }, LONG_PRESS_DELAY);
};

const stopTimer = () => {
    if (longPressTimer.value) {
        clearTimeout(longPressTimer.value);
        longPressTimer.value = null;
    }
};

const openEditDialog = (favorite) => {
    editingFavorite.value = JSON.parse(JSON.stringify(favorite));
    editDialog.value = true;
};

const updateIcon = async () => {
    if (!editingFavorite.value || !editingFavorite.value.item.name) return;
    try {
        const response = await apiStore.apiRequest("get", "/calorietracker/favorites/icon", { name: editingFavorite.value.item.name });
        if (response && response.data.icon) {
            editingFavorite.value.item.icon = response.data.icon;
        }
    } catch (e) {
        console.error("Error fetching icon:", e);
    }
};

const saveFavorite = async () => {
    if (!editingFavorite.value) return;
    await trackerStore.updateFavorite(editingFavorite.value._id, editingFavorite.value.item);
    editDialog.value = false;
};

const deleteFavorite = async () => {
    if (!editingFavorite.value) return;
    await trackerStore.removeFavorite(editingFavorite.value._id);
    confirmDelete.value = false;
    editDialog.value = false;
};
</script>

<style scoped>
.favorite-item-card {
    transition: transform 0.1s, background-color 0.2s;
    user-select: none;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
}
.favorite-item-card:active {
    transform: scale(0.95);
}

.favorite-name {
    font-size: 0.7rem;
    line-height: 1.1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    overflow: hidden;
    word-break: break-word;
}
</style>
