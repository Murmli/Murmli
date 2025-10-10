<template>
    <v-dialog v-model="dialogStore.dialogs.shareListDialog" location="top" scrollable>
        <v-card class="text-center" max-width="500" style="margin-top: 20px;">
            <v-card-title>{{ languageStore.t('shoppingList.shareList') }}</v-card-title>
            <v-card-text>
                <!-- Inhalt für Besitzer der Liste -->
                <template v-if="shoppingListStore.isOwner">
                    <template v-if="shoppingListStore.sharedWith.length > 0">
                        <v-table height="280px">
                            <tbody>
                                <tr v-for="(id, index) in shoppingListStore.sharedWith" :key="index">
                                    <td>{{ id }}</td>
                                    <td>
                                        <v-btn :color="deleteConfirm[id] ? 'red' : 'grey'" size="x-small"
                                            @click="handleDeleteConfirmation(id)">
                                            x
                                        </v-btn>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </template>
                    <template v-else>
                        <p class="py-10">{{ languageStore.t('shoppingList.noSharedUsers') }}</p>
                    </template>

                    <p>{{ languageStore.t('shoppingList.inviteCode') }}</p>

                    <v-otp-input v-model="inviteDetails.code" length="5" variant="filled"
                        :readonly="shoppingListStore.isOwner"></v-otp-input>
                    <p v-if="inviteDetails.validity && shoppingListStore.isOwner" class="text-caption">
                        {{ inviteDetails.validity }} {{ languageStore.t('shoppingList.inviteCodeExpires') }}
                    </p>
                    <div class="d-flex flex-column gap-2">
                        <v-btn color="primary" @click="createInvite" :disabled="!!inviteDetails.code">
                            {{ languageStore.t('shoppingList.createInvite') }}
                        </v-btn>
                        <v-btn color="success" @click="joinList" :disabled="!isValidOtp">
                            {{ languageStore.t('shoppingList.joinList') }}
                        </v-btn>
                    </div>
                </template>

                <!-- Inhalt für Nicht-Besitzer -->
                <template v-else>
                    <p>{{ languageStore.t('shoppingList.joinedList') }}</p>
                    <v-btn color="error" class="my-2" @click="leaveList">
                        {{ languageStore.t('shoppingList.leaveList') }}
                    </v-btn>
                </template>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn @click="closeDialog">{{ languageStore.t('general.close') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useDialogStore } from '@/stores/dialogStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const shoppingListStore = useShoppingListStore();

const inviteDetails = ref({
    code: null,
    validity: null,
});

const deleteConfirm = ref({}); // Temporäre Bestätigung für Löschaktionen

let inviteTimer = null;

const createInvite = async () => {
    try {
        await shoppingListStore.createInvite();
        inviteDetails.value.code = shoppingListStore.inviteCode;
        inviteDetails.value.validity = shoppingListStore.inviteTimeRemaining;
        startInviteTimer();
    } catch (error) {
        console.error('Error creating invite:', error);
    }
};

const handleDeleteConfirmation = (id) => {
    if (deleteConfirm.value[id]) {
        deleteConfirm.value[id] = false;
        shoppingListStore.clearInvites(id);
    } else {
        deleteConfirm.value[id] = true;
    }
};

const leaveList = async () => {
    try {
        const response = await shoppingListStore.leaveList();
        if (response) {
            localStorage.setItem('shoppingListId', response.listId);
            dialogStore.closeDialog("shareListDialog")
        }
    } catch (error) {
        console.error('Error leaving list:', error);
    }
};

const isValidOtp = computed(() => {
    return inviteDetails.value.code && inviteDetails.value.code.length === 5 && /^\d{5}$/.test(inviteDetails.value.code);
});

const joinList = async () => {
    if (!isValidOtp.value) return;

    try {
        await shoppingListStore.joinList(inviteDetails.value.code);
        shoppingListStore.items = [];
        shoppingListStore.readShoppingList();
        dialogStore.closeDialog("shareListDialog")
    } catch (error) {
        console.error('Error joining list:', error);
    }
};

const closeDialog = () => {
    dialogStore.closeDialog('shareListDialog');
};

const startInviteTimer = () => {
    if (inviteTimer) clearInterval(inviteTimer);

    inviteTimer = setInterval(() => {
        if (inviteDetails.value.validity > 0) {
            inviteDetails.value.validity -= 1;
        } else {
            inviteDetails.value.code = null;
            inviteDetails.value.validity = null;
            clearInterval(inviteTimer);
        }
    }, 1000);
};

onMounted(() => {
    shoppingListStore.readInvite();
});

</script>
