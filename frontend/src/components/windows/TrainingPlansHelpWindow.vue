<template>
    <v-overlay v-model="dialogStore.dialogs.trainingPlansHelpWindow" class="align-center justify-center" contained
        persistent>
        <v-card class="mx-auto" max-width="90%">
            <v-card-title class="text-h6 font-weight-regular justify-space-between">
                <span>{{ currentTitle }}</span>
            </v-card-title>

            <v-window v-model="step">
                <!-- Seite 1 -->
                <v-window-item :value="1">
                    <v-card-text class="text-center">
                        <p>{{ languageStore.t("trainingPlans.help.step1.content") }}</p>
                    </v-card-text>
                </v-window-item>

                <!-- Seite 2 -->
                <v-window-item :value="2">
                    <v-card-text class="text-center">
                        <p>{{ languageStore.t("trainingPlans.help.step2.content") }}</p>
                    </v-card-text>
                </v-window-item>

                <!-- Seite 3 -->
                <v-window-item :value="3">
                    <v-card-text class="text-center">
                        <p>{{ languageStore.t("trainingPlans.help.step3.content") }}</p>
                        <v-btn class="mt-5" color="primary" @click="closeHelpWindow">
                            {{ languageStore.t("general.close") }}
                        </v-btn>
                    </v-card-text>
                </v-window-item>
            </v-window>

            <v-divider></v-divider>

            <v-card-actions>
                <v-btn v-if="step > 1" variant="text" @click="step--">
                    {{ languageStore.t('general.back') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn v-if="step < 3" color="primary" variant="flat" @click="step++">
                    {{ languageStore.t('general.next') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-overlay>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';

const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const step = ref(1);

const currentTitle = computed(() => {
    switch (step.value) {
        case 1:
            return languageStore.t("trainingPlans.help.step1.title");
        case 2:
            return languageStore.t("trainingPlans.help.step2.title");
        default:
            return languageStore.t("trainingPlans.help.step3.title");
    }
});

const closeHelpWindow = () => {
    dialogStore.closeDialog('trainingPlansHelpWindow');
    localStorage.setItem('showTrainingPlansHelpWindow', 'false');
};

onMounted(() => {
    const showHelpWindow = localStorage.getItem('showTrainingPlansHelpWindow');
    if (!showHelpWindow) {
        dialogStore.openDialog('trainingPlansHelpWindow');
    }
});
</script>