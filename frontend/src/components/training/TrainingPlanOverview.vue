<template>
    <ImageDialog />
    <v-container class="ma-0 pa-0">
        <v-card v-if="selectedDay">
            <v-card-title>{{ trainingStore.selectedPlan.name }}</v-card-title>
            <v-card-text>
                <v-sheet class="mt-4">
                    <h3>{{ languageStore.t('general.weekdays.' + selectedDay) }}</h3>
                    {{ latestPreview.description }}
                </v-sheet>

                <h3 class="mt-6">{{ languageStore.t('training.exercises') }}</h3>
                <v-list>
                    <v-list-item
                        v-for="exercise in latestPreview.exercises"
                        :key="exercise._id"
                        :prepend-avatar="exercise.image !== 'dummy' ? exercise.image : undefined"
                        @click="exercise.image !== 'dummy' && openImageDialog(exercise.image)"
                        style="cursor: pointer"
                    >
                        <v-list-item-title class="wrap-text">{{ exercise.name }}</v-list-item-title>
                        <v-list-item-subtitle class="wrap-text">
                            {{ languageStore.t('trainingPlans.sets') }}: {{ exercise.sets.length || '' }}

                            <span v-if="exercise.repetitions">
                                x {{ exercise.repetitions }} {{ languageStore.t('trainingPlans.repetitionsShort') }}
                            </span>
                        </v-list-item-subtitle>
                        <v-list-item-subtitle v-if="exercise.suggestedWeight != null" class="wrap-text">
                            {{ languageStore.t('trainingPlans.suggestedWeight') }}: {{ exercise.suggestedWeight }} kg
                        </v-list-item-subtitle>
                        <v-list-item-subtitle v-else-if="exercise.duration != null" class="wrap-text">
                            {{ languageStore.t('trainingPlans.suggestedDuration') }}: {{ exercise.duration }} {{ languageStore.t('training.secondsShort') }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions class="justify-center">
                <v-btn color="primary" @click="startTraining" variant="tonal" class="my-1">
                    {{ languageStore.t('training.startTraining') }}
                </v-btn>
            </v-card-actions>
        </v-card>
        <div v-else>
            {{ languageStore.t('training.noDaySelected') }}
        </div>
    </v-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTrainingStore } from '@/stores/trainingStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useDialogStore } from '@/stores/dialogStore'
import ImageDialog from '@/components/dialogs/ImageDialog.vue'

const trainingStore = useTrainingStore()
const languageStore = useLanguageStore()
const dialogStore = useDialogStore()

const openImageDialog = (src) => {
    dialogStore.imageSrc = src
    dialogStore.openDialog('imageDialog')
}

const selectedDay = computed(() => trainingStore.selectedDay)
const latestPreview = computed(() => trainingStore.currentLog || trainingStore.latestLog)

const startTraining = () => {
    trainingStore.createTrainingLog()
}

onMounted(() => {})
</script>

<style scoped>
.wrap-text {
    white-space: normal;
}
</style>