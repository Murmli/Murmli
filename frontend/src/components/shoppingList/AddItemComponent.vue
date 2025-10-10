<template>
    <ShoppingVoiceDialog />
    <div class="w-100 mx-5 mt-5">
        <v-form @submit.prevent="addItem()">
            <v-text-field v-model="newItem" :label="languageStore.t('shoppingList.newItemLabel')"
                :placeholder="languageStore.t('shoppingList.newItemPlaceholder')" outlined density="compact"
                bg-color="white" ref="newItemField" :loading="shoppingListStore.isAddingItem">
                <template v-slot:append-inner>
                    <v-icon @click="openVoiceDialog">mdi-microphone</v-icon>
                </template>
            </v-text-field>
        </v-form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import ShoppingVoiceDialog from '@/components/dialogs/ShoppingVoiceDialog.vue';

const shoppingListStore = useShoppingListStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const newItem = ref('');
const newItemField = ref(null);

const addItem = async () => {
    const trimmedItem = newItem.value.trim();
    if (trimmedItem !== '') {
        shoppingListStore.addItemToShoppingList(trimmedItem);
        newItem.value = '';
    }
};

const openVoiceDialog = () => {
    dialogStore.openDialog('shoppingVoiceDialog');
};
</script>
