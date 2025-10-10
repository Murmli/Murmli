<template>
    <div class="w-100">
        <v-card class="mx-auto mb-4" v-if="shoppingListStore.items && shoppingListStore.items.length"
            v-for="(categoryItems, category) in groupedItems" :key="category">
            <v-list bg-color="white">
                <v-list-item class="" v-for="item in categoryItems" :key="item._id"
                    v-touch="{ left: wrapper => handleSwipe(wrapper, item._id), right: wrapper => handleSwipe(wrapper, item._id) }">
                    <!-- Item Title -->
                    <v-list-item-title @click="openDropdown(item)">
                        <div class="align-center d-flex">
                            <span class="w-100 text-capitalize">{{ item.name }}</span>
                            <span class="text-caption">
                                <span v-if="item.quantity && item.quantity > 0">
                                    {{ item.quantity }}
                                    <span v-if="item.unit.id != null"> {{ item.unit.name }}</span>
                                </span>
                            </span>
                        </div>
                    </v-list-item-title>

                    <!-- Icon -->
                    <template v-slot:prepend>
                        <v-badge v-if="item.recipe" color="orange" dot location="bottom end">
                            <v-icon :color="getCategoryColor(item.category.id)"
                                :icon="getCategoryIcon(item.category.id)" size="35">
                            </v-icon>
                        </v-badge>
                        <v-icon v-else :color="getCategoryColor(item.category.id)"
                            :icon="getCategoryIcon(item.category.id)" size="35">
                        </v-icon>
                    </template>

                    <!-- Checked Checkbox -->
                    <template v-slot:append="{ isActive }">
                        <v-checkbox-btn :model-value="isActive" @click="toggleItemActive(item._id)"></v-checkbox-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>

        <!-- Dropdown Menu for Items -->
        <v-bottom-sheet v-model="dropdownMenu">
            <v-card>
                <v-card-title>
                    {{ dropdownItem.name }}
                </v-card-title>
                <v-card-text>
                    <v-list>
                        <v-list-item @click="findAlternatives(dropdownItem._id)">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-magnify"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('shoppingList.findAlternative')
                            }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item v-if="!dropdownItem.recipe" @click="changeItem(dropdownItem)">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-pencil"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('shoppingList.editItem') }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item v-if="dropdownItem.recipe" @click="showLinkedRecipe(dropdownItem)">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-image-filter-frames"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('shoppingList.showRecipe') }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item v-if="!isFavorite(dropdownItem)" @click="addFavorite(dropdownItem)">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-star"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('shoppingList.saveAsFavorite')
                            }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item v-else @click="removeFavorite(dropdownItem)">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-star-off"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('shoppingList.removeFavorite')
                            }}</v-list-item-title>
                        </v-list-item>

                    </v-list>
                </v-card-text>
            </v-card>

        </v-bottom-sheet>

        <!-- Hinweis bei fehlenden Artikeln -->
        <v-alert v-if="noItems" type="info" class="mx-auto mb-4" max-width="500">
            {{ languageStore.t('shoppingList.noItemsMessage') }}
        </v-alert>

        <!-- Info Dialog-->
        <v-dialog v-model="infoDialog.visible" persistent max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="text-h5">{{ infoDialog.title }}</span>
                </v-card-title>
                <v-card-text>
                    {{ infoDialog.text }}
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="infoDialog.visible = false">{{ infoDialog.btnCloseText }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Change Item Dialog-->
        <v-dialog v-model="changeItemDialog.visible" persistent max-width="600px">
            <v-card>
                <v-card-title>
                    {{ changeItemDialog.name }}
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field v-model="changeItemDialog.name"
                                    :label="languageStore.t('shoppingList.nameLabel')" class="w-100" />

                                <v-text-field v-model="changeItemDialog.amount" type="number"
                                    :label="languageStore.t('shoppingList.amountLabel')" min="0" />

                                <v-select v-model="changeItemDialog.unit" :items="units" item-title="name"
                                    item-value="id" :label="languageStore.t('shoppingList.unitLabel')"></v-select>
                                <v-select v-model="changeItemDialog.category" :items="categories" item-title="name"
                                    item-value="id" :label="languageStore.t('shoppingList.categoryLabel')"></v-select>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-btn text @click="changeItemDialog.visible = false">{{ languageStore.t('general.close')
                    }}</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="saveItemChanges">{{ languageStore.t('general.save')
                        }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useLanguageStore } from '@/stores/languageStore'
import { unitRules } from '@/utils/units';

// Stores
const languageStore = useLanguageStore()
const shoppingListStore = useShoppingListStore();
const recipeStore = useRecipeStore();

// Computed Properties 
const noItems = computed(() => {
    const items = shoppingListStore.items;
    return !items || items.length === 0 || items.every(item => !item.active);
});
const activeItems = computed(() => shoppingListStore.items.filter(item => item.active));
const groupedItems = computed(() => {
    if (!activeItems.value || activeItems.value.length === 0) return {};
    return activeItems.value.reduce((groups, item) => {
        const categoryName = item.category?.name || 'Uncategorized';
        if (!groups[categoryName]) groups[categoryName] = [];
        groups[categoryName].push(item);
        return groups;
    }, {});
});

// Varaiables
const dropdownMenu = ref(false);
const dropdownItem = ref(null);

const infoDialog = ref({
    title: 'test',
    text: 'test',
    btnCloseText: 'test',
    visible: false,
});

const changeItemDialog = ref({
    visible: false,
    item: null,
    amount: 0,
    unit: null,
    category: null,
});

const units = computed(() =>
    unitRules.map((u) => ({
        id: u.id,
        name: u.translationKey ? languageStore.t(u.translationKey) : null,
    }))
);

const categories = computed(() => shoppingListStore.categories);

// Functions
const getCategoryIcon = (category) => {
    const icons = {
        0: "mdi-carrot",
        1: "mdi-baguette",
        2: "mdi-cup",
        3: "mdi-fruit-cherries",
        4: "mdi-peanut",
        5: "mdi-cow",
        6: "mdi-snowflake",
        7: "mdi-noodles",
        8: "mdi-chef-hat",
        9: "mdi-soy-sauce",
        10: "mdi-food-drumstick",
        11: "mdi-delete-outline",
        12: "mdi-barley",
        13: "mdi-barley",
        14: "mdi-help",
        15: "mdi-shaker",
        16: "mdi-bottle-soda",
        17: "mdi-taco",
        18: "mdi-fridge-industrial",
        19: "mdi-candy",
        20: "mdi-spray-bottle",
        21: "mdi-shower-head",
        22: "mdi-dog-side"
    };
    return icons[category] || "mdi-help";
};

const getCategoryColor = (category) => {
    const colors = {
        0: "light-green-lighten-1",
        1: "brown-lighten-3",
        2: "lime-lighten-2",
        3: "lime-lighten-1",
        4: "brown-lighten-1",
        5: "light-blue-lighten-4",
        6: "light-blue-darken-4",
        7: "amber-lighten-3",
        8: "pink-lighten-2",
        9: "brown-lighten-4",
        10: "red-lighten-3",
        11: "blue-grey-darken-1",
        12: "amber-darken-2",
        13: "amber-darken-2",
        14: "blue-grey-lighten-3",
        15: "deep-orange-lighten-1",
        16: "brown-lighten-4",
        17: "purple-lighten-2",
        18: "light-blue-lighten-4",
        19: "deep-orange-darken-1",
        20: "blue-grey-darken-4",
        21: "cyan-lighten-4",
        22: "yellow-accent-4"
    };
    return colors[category] || "grey";
};

const openDropdown = (item) => {
    dropdownItem.value = item;
    dropdownMenu.value = true;
}

const findAlternatives = async (itemId) => {
    const item = shoppingListStore.items.find(item => item._id === itemId);
    if (item) {
        const request = await shoppingListStore.fetchItemAlternatives(item._id);

        infoDialog.value = {
            title: languageStore.t('general.information'),
            text: request.text,
            btnCloseText: languageStore.t('general.close'),
            visible: true,
        };

        dropdownMenu.value = false;
    }
}

const showLinkedRecipe = async (item) => {
    const request = await recipeStore.fetchRecipe(item.recipeId);
    infoDialog.value = {
        title: languageStore.t('general.information'),
        text: `${languageStore.t('shoppingList.recipeOwnership')} ${request.title}.`,
        btnCloseText: languageStore.t('general.close'),
        visible: true,
    };

    dropdownMenu.value = false;
}

const changeItem = (item) => {
    if (item) {
        changeItemDialog.value = {
            visible: true,
            name: item.name, // Neuer Name-Field
            item: item,
            amount: item.quantity || 0,
            unit: item.unit?.id || null,
            category: item.category?.id || null,
        };
    }
};

const saveItemChanges = async () => {
    const { item, name, amount, unit, category } = changeItemDialog.value;

    if (item) {
        item.name = name; // Aktualisiere den Namen des Items
        item.quantity = amount;
        item.unit = units.value.find(u => u.id === unit);
        item.category = categories.value.find(c => c.id === category) || item.category;

        shoppingListStore.updateItem(
            item._id,
            item.name,
            item.quantity,
            item.unit.id,
            item.active,
            category
        );
    }

    changeItemDialog.value.visible = false;
    dropdownMenu.value = false;
};

const toggleItemActive = (itemId) => {
    const item = shoppingListStore.items.find(item => item._id === itemId);
    if (item) {
        item.active = !item.active;
        shoppingListStore.updateItem(item._id, item.name, item.quantity, item.unit.id, item.active);
    }
};

const isFavorite = (item) => {
    const favorites = shoppingListStore.getFavorites();
    return favorites.some(favorite => favorite.name === item.name);
};

const addFavorite = (item) => {
    if (item) {
        shoppingListStore.createFavorite(item);
        dropdownMenu.value = false;
    }
};

const removeFavorite = (item) => {
    if (item) {
        shoppingListStore.removeFavorite(item.name);
        dropdownMenu.value = false;
    }
};

const handleSwipe = (wrapper, itemId) => {
    const threshold = 50;
    if (Math.abs(wrapper.offsetX) > threshold) {
        // reserved
    }
};

onMounted(() => {
    if (shoppingListStore.categories.length === 0) {
        shoppingListStore.fetchCategories();
    }
});

</script>
