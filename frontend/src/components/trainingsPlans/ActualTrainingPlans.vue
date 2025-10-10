<template>
    <div v-bind="$attrs" class="w-100 pt-4">
        <v-card class="mx-auto mb-4" rounded="lg" color="primary"
            v-if="trainingStore.trainingPlans && trainingStore.trainingPlans.length">
            <v-card-title>{{ languageStore.t("trainingPlans.activePlan") }}</v-card-title>
            <div v-for="plan in activeTrainingPlans" :key="plan._id">
                <v-card-text @click="openBottomSheet(plan)">
                    <div class="plan-name pa-0 ma-0">{{ plan.name }}</div>
                    <v-row dense class="plan-info">
                        <v-col cols="12" class="py-0 pt-2">
                            {{ languageStore.t("general.progress") }}: {{ plan.currentWeek }}/{{
                                plan.durationWeeks }}
                            {{ languageStore.t("general.weeks") }}
                        </v-col>
                        <v-col cols="12" class="py-0">
                            {{ plan.days.length }} {{ languageStore.t("trainingPlans.trainingDaysPerWeek") }}
                        </v-col>
                    </v-row>
                </v-card-text>
            </div>
        </v-card>

        <v-dialog v-model="bottomSheetVisible" location="top">
            <v-card max-width="500" style="margin-top: 20px;">
                <v-card-title>
                    {{ selectedPlan?.name }}
                </v-card-title>
                <v-card-text>
                    <v-list>
                        <v-list-item @click="openSelectTrainingDayDialog">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-run"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t("trainingPlans.train") }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="openAskDialog">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-comment-question-outline"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t("trainingPlans.ask") }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="openContinueDialog">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-repeat"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t("trainingPlans.continuePlan") }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="editTrainingPlan">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-pencil"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t("general.edit") }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="archiveTrainingPlan">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-close-circle"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t("general.finish") }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn @click="bottomSheetVisible = false">{{ languageStore.t('general.close') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- Dialog für Trainingstag-Auswahl -->
        <SelectTrainingDayDialog v-if="dialogStore.dialogs.selectTrainingDayDialog" />
        <EditTrainingPlanDialog />
        <AskTrainingPlanDialog v-if="dialogStore.dialogs.askTrainingPlanDialog" />
        <ContinueTrainingPlanDialog v-if="dialogStore.dialogs.continueTrainingPlanDialog" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTrainingStore } from '@/stores/trainingStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useDialogStore } from '@/stores/dialogStore'
import EditTrainingPlanDialog from '@/components/dialogs/EditTrainingPlanDialog.vue'
import AskTrainingPlanDialog from '@/components/dialogs/AskTrainingPlanDialog.vue'
import ContinueTrainingPlanDialog from '@/components/dialogs/ContinueTrainingPlanDialog.vue'

const trainingStore = useTrainingStore()
const languageStore = useLanguageStore()
const dialogStore = useDialogStore()
const activeTrainingPlans = computed(() => trainingStore.trainingPlans.filter(plan => plan.status === 'active'))

const bottomSheetVisible = ref(false)
const selectedPlan = ref(null)

function openBottomSheet(plan) {
    selectedPlan.value = plan
    trainingStore.selectedPlan = plan
    bottomSheetVisible.value = true
}

function editTrainingPlan() {
    dialogStore.openDialog('editTrainingPlanDialog')
}

async function archiveTrainingPlan() {
    if (!selectedPlan.value) { return }

    dialogStore.openConfirmDialog(
        languageStore.t('trainingPlans.finishDialog.title'),
        languageStore.t('trainingPlans.finishDialog.msg'),
        async () => {
            await trainingStore.updateTrainingPlanStatus(selectedPlan.value._id, "archived")
            bottomSheetVisible.value = false;
        }
    );
}

function openSelectTrainingDayDialog() {
    if (!selectedPlan.value) { return }
    dialogStore.openDialog('selectTrainingDayDialog')
}

function openAskDialog() {
    if (!selectedPlan.value) { return }
    dialogStore.openDialog('askTrainingPlanDialog')
    bottomSheetVisible.value = false
}

function openContinueDialog() {
    if (!selectedPlan.value) { return }
    dialogStore.openDialog('continueTrainingPlanDialog')
    bottomSheetVisible.value = false
}
</script>

<style scoped>
.plan-subtitle {
    white-space: normal;
    word-break: break-word;
    overflow: visible;
    font-size: 0.85em;
    color: #666;
}

.plan-info {
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
}

.plan-name {
    font-size: 1.4em;
}
</style>