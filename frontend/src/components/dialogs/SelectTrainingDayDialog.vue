<template>
    <v-dialog v-model="dialogStore.dialogs.selectTrainingDayDialog" max-width="400">
        <v-card>
            <v-toolbar color="primary">
                <v-toolbar-title>{{ languageStore.t('trainingPlans.selectDay') }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
                <div class="mb-2">
                    {{ trainingPlan?.name }}
                </div>
                <v-list>
                    <v-list-item v-for="(day, idx) in trainingPlan?.days || []" :key="idx"
                        :active="selectedDayIndex === idx" @click="selectItem(idx, trainingPlan.days[idx].weekday)"
                        class="selectable">
                        <v-list-item-title>
                            {{ languageStore.t('general.weekdays.' + (day.weekday ?? idx)) }}
                        </v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn @click="closeDialog">
                    {{ languageStore.t('general.close') }}
                </v-btn>
                <v-btn color="primary" :disabled="selectedDayIndex === null" @click="train">
                    {{ languageStore.t('general.start') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useRouter } from 'vue-router'; // useRouter importieren
// import router from '@/router' // Direkten Import entfernen

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trainingStore = useTrainingStore();
const router = useRouter(); // Router-Instanz holen

const trainingPlan = trainingStore.selectedPlan

const selectedDayIndex = ref(null)
const selectedDay = ref(null)

function closeDialog() {
    dialogStore.closeDialog('selectTrainingDayDialog')
    selectedDayIndex.value = null
}

function selectItem(index, day) {
    selectedDayIndex.value = index
    selectedDay.value = day
}

function train() {
    if (selectedDayIndex.value !== null && trainingPlan?._id) {
        closeDialog("selectTrainingDayDialog");
        router.push({
            path: '/training',
            query: {
                trainingsPlanId: trainingPlan._id,
                trainingWeekday: selectedDay.value
            }
        });
    } else {
        console.error("No day selected or plan ID is missing.");
        // Optional: Fehlermeldung anzeigen
    }
}

// Reset Auswahl, wenn Dialog geschlossen wird
watch(
    () => dialogStore.dialogs.selectTrainingDayDialog,
    (open) => {
        if (!open) selectedDayIndex.value = null
    }
)
</script>