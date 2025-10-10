<template>
    <div class="w-100" v-if="trainingStore.trainingPlans && trainingStore.trainingPlans.length">
        <h2 class="pa-2">{{ languageStore.t('general.archive') }}</h2>

        <div v-for="plan in archivedTrainingPlans" :key="plan._id">
            <v-card class="mx-auto mb-4" rounded="lg">
                <v-card-title>{{ plan.name }}</v-card-title>
                <v-card-text @click="openBottomSheet(plan)">
                    <div class="plan-name pa-0 ma-0"></div>
                    <v-row dense class="plan-info">
                        <v-col cols="12" class="py-0 pt-2">
                            {{ plan.days.length }} {{ languageStore.t('trainingPlans.trainingDaysPerWeek') }}
                        </v-col>
                        <v-col cols="12" class="py-0">
                            {{ languageStore.t('general.difficulty') }}: {{ plan.difficulty }}/5
                        </v-col>
                        <v-col cols="12" class="py-0">
                            {{ languageStore.t('general.goal') }}: {{ plan.goal }}
                        </v-col>
                        <v-col cols="12" class="py-0">
                            {{ languageStore.t('general.type') }}: {{ plan.type }}
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </div>

        <v-dialog v-model="bottomSheetVisible" location="top">
            <v-card max-width="500" style="margin-top: 20px;">
                <v-card-title>
                    {{ selectedPlan?.name }}
                </v-card-title>
                <v-card-text>
                    <v-list>
                        <v-list-item @click="activateTrainingPlan">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-check-circle"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('general.activate') }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="editTrainingPlan">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-pencil"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('general.edit') }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="openAskDialog">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-comment-question-outline"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('trainingPlans.ask') }}</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="deleteTrainingPlan">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-delete"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('general.delete') }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn @click="bottomSheetVisible = false">{{ languageStore.t('general.close') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>

    <EditTrainingPlanDialog />
    <AskTrainingPlanDialog v-if="dialogStore.dialogs.askTrainingPlanDialog" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTrainingStore } from '@/stores/trainingStore'
import { useDialogStore } from '@/stores/dialogStore'
import { useLanguageStore } from '@/stores/languageStore'
import EditTrainingPlanDialog from '@/components/dialogs/EditTrainingPlanDialog.vue'
import AskTrainingPlanDialog from '@/components/dialogs/AskTrainingPlanDialog.vue'

const trainingStore = useTrainingStore()
const dialogStore = useDialogStore()
const languageStore = useLanguageStore()

const archivedTrainingPlans = computed(() => trainingStore.trainingPlans.filter(plan => plan.status === 'archived'))

const bottomSheetVisible = ref(false)
const selectedPlan = ref(null)
const selectedTrainingPlan = ref(null)

function openBottomSheet(plan) {
    selectedPlan.value = plan
    trainingStore.selectedPlan = plan
    bottomSheetVisible.value = true
}

function editTrainingPlan() {
    selectedTrainingPlan.value = selectedPlan.value;
    dialogStore.openDialog('editTrainingPlanDialog')
}

function activateTrainingPlan() {
    if (!selectedPlan.value) { return; }

    dialogStore.openConfirmDialog(
        languageStore.t('trainingPlans.activateDialog.title'),
        languageStore.t('trainingPlans.activateDialog.msg'),
        async () => {
            await trainingStore.updateTrainingPlanStatus(selectedPlan.value._id, "active")
            bottomSheetVisible.value = false;
        }
    );
}
async function deleteTrainingPlan() {
    if (!selectedPlan.value) return;

    dialogStore.openConfirmDialog(
        languageStore.t('trainingPlans.deleteDialog.title'),
        languageStore.t('trainingPlans.deleteDialog.msg'),
        async () => {
            await trainingStore.deleteTrainingPlan(selectedPlan.value._id);
            bottomSheetVisible.value = false;
        }
    );
}

function openAskDialog() {
    if (!selectedPlan.value) return;
    dialogStore.openDialog('askTrainingPlanDialog');
    bottomSheetVisible.value = false;
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
</style>