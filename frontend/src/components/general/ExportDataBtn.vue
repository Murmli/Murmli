<template>
    <v-btn color="primary" @click="exportData">{{ languageStore.t("settings.export") }}</v-btn>
</template>

<script setup>
import { useLanguageStore } from "@/stores/languageStore";
import { useUserStore } from "@/stores/userStore";

const languageStore = useLanguageStore();
const userStore = useUserStore();

const exportData = async () => {
    const url = await userStore.exportUserData();
    window.open(url, '_blank');
};

</script>