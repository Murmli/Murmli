<template>
    <v-dialog v-model="dialogStore.dialogs.imageDialog" max-width="600">
        <v-card>
            <v-img :src="dialogStore.imageSrc" max-height="500" contain></v-img>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { useDialogStore } from '@/stores/dialogStore';

const dialogStore = useDialogStore();
</script>
