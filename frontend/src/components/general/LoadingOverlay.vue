<template>
    <v-overlay v-model="isLoadingProxy" class="align-center justify-center" absolute>
        <v-container style="height: 100%; overflow-y: auto;">
            <v-row>
                <v-col cols="12">
                    <v-progress-linear color="red" height="7" indeterminate rounded></v-progress-linear>
                </v-col>
            </v-row>
            <v-row justify="center" class="fill-height pt-16">
                <v-col class="d-flex justify-center align-center" cols="auto">
                    <v-btn icon @click="apiStore.cancelRequest" color="red" class="mb-2 fade-button">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </v-overlay>
</template>

<script setup>
import { computed } from 'vue';
import { useApiStore } from '@/stores/apiStore';

const apiStore = useApiStore();

const isLoadingProxy = computed(() => apiStore.isCurrentlyLoading);

</script>

<style scoped>
@keyframes fadeInOut {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}

.fade-button {
    animation: fadeInOut 2s infinite;
}
</style>
