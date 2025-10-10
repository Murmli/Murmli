<template>
    <v-dialog v-model="dialogStore.dialogs.listSortDialog" location="top" scrollable>
        <v-card max-width="500" style="margin-top: 20px;">
            <v-card-title>{{ languageStore.t('shoppingList.sortCategoriesDialog.title') }}</v-card-title>
            <v-card-text>
                {{ languageStore.t('shoppingList.sortCategoriesDialog.text') }}
                <v-list>
                    <v-list-item v-for="(category, index) in categories" :key="category.id" class="m-10 p-0"
                        style="padding: 0; margin: 0;">
                        <div class="d-flex align-center justify-space-between">
                            <div @click="openPositionDialog(index)" style="cursor: pointer;">
                                <span class="mr-3">{{ index + 1 }}.</span>
                                {{ category.name }}
                            </div>
                            <div>
                                <v-btn size="x-small" @click="moveCategory(index, -1)" :disabled="index === 0">
                                    <v-icon>mdi-arrow-up</v-icon>
                                </v-btn>
                                <v-btn size="x-small" @click="moveCategory(index, 1)"
                                    :disabled="index === categories.length - 1">
                                    <v-icon>mdi-arrow-down</v-icon>
                                </v-btn>
                            </div>
                        </div>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeSheet">
                    {{ languageStore.t('general.cancel') }}
                </v-btn>
                <v-btn color="primary" @click="saveOrder">
                    {{ languageStore.t('general.save') }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Dialog for choosing a new position -->
        <v-dialog v-model="positionDialog.visible" max-width="400">
            <v-card>
                <v-card-title>
                    {{ languageStore.t('shoppingList.sortCategoriesDialog.changePositon') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field v-model="positionDialog.newPosition" type="number" :rules="[validatePosition]"
                        :label="languageStore.t('shoppingList.sortCategoriesDialog.newPosition')"
                        required></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="closePositionDialog">
                        {{ languageStore.t('general.cancel') }}
                    </v-btn>
                    <v-btn color="primary" @click="changePosition">
                        {{ languageStore.t('general.confirm') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useDialogStore } from '@/stores/dialogStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const shoppingListStore = useShoppingListStore();

const categories = ref([]);
const positionDialog = ref({
    visible: false,
    categoryIndex: null,
    newPosition: null,
});

const loadCategories = async () => {
    try {
        await shoppingListStore.fetchCategories();
        await shoppingListStore.fetchSortingOrder();

        const sortingOrder = shoppingListStore.sortingOrder;
        categories.value = shoppingListStore.categories.sort(
            (a, b) => sortingOrder.indexOf(Number(a.id)) - sortingOrder.indexOf(Number(b.id))
        );
    } catch (error) {
        console.error('Error fetching categories or sorting order:', error);
    }
};

const validatePosition = (value) => {
    if (value < 1 || value > categories.value.length) {
        return `Position must be between 1 and ${categories.value.length}`;
    }
    return true;
};

const openPositionDialog = (index) => {
    positionDialog.value.categoryIndex = index;
    positionDialog.value.newPosition = index + 1;
    positionDialog.value.visible = true;
};

const closePositionDialog = () => {
    positionDialog.value.visible = false;
    positionDialog.value.categoryIndex = null;
    positionDialog.value.newPosition = null;
};

const changePosition = () => {
    const currentIndex = positionDialog.value.categoryIndex;
    const newIndex = positionDialog.value.newPosition - 1;

    if (newIndex < 0 || newIndex >= categories.value.length || currentIndex === newIndex) {
        closePositionDialog();
        return;
    }

    const movedItem = categories.value.splice(currentIndex, 1)[0];
    categories.value.splice(newIndex, 0, movedItem);

    shoppingListStore.categories = [...categories.value];
    closePositionDialog();
};

const moveCategory = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.value.length) return;
    const movedItem = categories.value.splice(index, 1)[0];
    categories.value.splice(newIndex, 0, movedItem);
    shoppingListStore.categories = [...categories.value];
};

const saveOrder = async () => {
    const sortedIds = categories.value.map((cat) => Number(cat.id));
    try {
        await shoppingListStore.updateCategoriesSorting(sortedIds);
        closeSheet();
    } catch (error) {
        console.error('Error saving category order:', error);
    } finally {
        dialogStore.closeDialog('listSortDialog');
    }
};

const closeSheet = () => {
    dialogStore.closeDialog('listSortDialog');
};

onMounted(() => {
    loadCategories();
});
</script>
