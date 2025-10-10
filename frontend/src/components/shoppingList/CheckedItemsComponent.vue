<template>
    <div class="w-100">
        <v-card class="mx-auto mb-4" v-if="shoppingListStore.items && shoppingListStore.items.length">
            <v-list bg-color="white">
                <!-- Header: Check all items -->
                <v-list-item color="primary" variant="plain" class="pb-4">
                    <v-list-item-title>{{ languageStore.t('shoppingList.checkedHeader') }}</v-list-item-title>
                    <template v-slot:append>
                        <v-tooltip v-model="showTooltip" location="start">
                            <template v-slot:activator="{ props }">
                                <v-icon v-bind="props" :icon="'mdi-delete'" @click="handleDeleteButtonClick"></v-icon>
                            </template>
                            <span>{{ tooltipText }}</span>
                        </v-tooltip>
                    </template>
                </v-list-item>
                <v-divider></v-divider>
                <!-- List: All Checked items -->
                <v-list-item v-for="item in activeItems" color="primary" variant="plain" :key="item._id"
                    v-touch="{ left: wrapper => handleSwipe(wrapper, item._id), right: wrapper => handleSwipe(wrapper, item._id) }">
                    <v-list-item-title>
                        <div class="align-center d-flex">
                            <span class="w-100 text-capitalize">{{ item.name }}</span>
                            <span v-if="item.quantity != null && item.quantity != 0">
                                {{ item.quantity }} <span v-if="item.unit != null">{{ item.unit.name }}</span>
                            </span>
                        </div>
                    </v-list-item-title>

                    <template v-slot:append="{ isActive }">
                        <v-checkbox-btn :model-value="isActive" @click="toggleItemActive(item._id)"></v-checkbox-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useLanguageStore } from '@/stores/languageStore';

const languageStore = useLanguageStore();
const shoppingListStore = useShoppingListStore();

const activeItems = computed(() => shoppingListStore.items.filter(item => !item.active));

const showTooltip = ref(false);
const tooltipText = ref('');

let deleteButtonTimer = null;

// Handle button click
const handleDeleteButtonClick = () => {
    if (!showTooltip.value) {
        tooltipText.value = languageStore.t('shoppingList.deleteConfirmTooltip');
        showTooltip.value = true;
        startDeleteTimer();
    } else {
        deleteInactiveItems();
        showTooltip.value = false;
    }
};

// Start the timer to hide the tooltip
const startDeleteTimer = () => {
    if (deleteButtonTimer) clearTimeout(deleteButtonTimer);
    deleteButtonTimer = setTimeout(() => {
        showTooltip.value = false;
    }, 3000); // 3 seconds
};

// Delete inactive items
const deleteInactiveItems = async () => {
    try {
        await shoppingListStore.deleteCheckedItems();
    } catch (error) {
        console.error('Error deleting inactive items:', error);
    }
};

// Toggle item active status
const toggleItemActive = (itemId) => {
    const item = shoppingListStore.items.find(item => item._id === itemId);
    if (item) {
        item.active = !item.active;
        shoppingListStore.updateItem(item._id, item.name, item.quantity, item.unit, item.active);
    }
};

// Handle swipe actions
const handleSwipe = (wrapper, itemId) => {
    // handle swipe action
};
</script>
