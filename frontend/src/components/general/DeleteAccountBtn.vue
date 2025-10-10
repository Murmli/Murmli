<template>
    <v-btn color="error" @click="confirmDeleteAccount"> {{ languageStore.t("settings.deleteAccount") }} </v-btn>
</template>

<script setup>
import { useLanguageStore } from "@/stores/languageStore";
import { useUserStore } from "@/stores/userStore";
import { useDialogStore } from "@/stores/dialogStore";

const languageStore = useLanguageStore();
const userStore = useUserStore();
const dialogStore = useDialogStore();

const confirmDeleteAccount = () => {
    dialogStore.openConfirmDialog(
        languageStore.t("settings.confirmDeleteTitle"),
        languageStore.t("settings.confirmDeleteText"),
        deleteAccount,
    );
};

const deleteAccount = async () => {
    const success = await userStore.deleteUser();
    if (success) {
        alert(languageStore.t("settings.accountDeleted"));
    } else {
        alert(languageStore.t("settings.deleteError"));
    }
};

</script>