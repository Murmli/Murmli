<template>
    <ImageDialog />
    <v-container v-if="currentLog && currentExercise">
        <!-- Übungsdetails -->
        <v-card class="mb-5">
            <v-card-title class="d-flex justify-space-between align-center">
                <span class="exercise-title">{{ currentExercise.name }}</span>
            </v-card-title>
            <v-card-text>
                <!-- Übungszähler -->
                <span v-if="!allExercisesCompleted" class="text-subtitle-1">
                    {{ languageStore.t('training.exercise') }} {{ currentExerciseIndex + 1 }} / {{
                        currentLog.exercises.length }}
                </span>
                <span v-else class="text-subtitle-1 text-success">
                    {{ languageStore.t('training.completed') }}
                </span>

                <!-- Bild anzeigen (falls vorhanden) -->
                <v-img v-if="currentExercise.image && currentExercise.image !== 'dummy'" :src="currentExercise.image"
                    height="150px" contain class="mb-3" style="cursor: pointer"
                    @click="openImageDialog(currentExercise.image)"></v-img>
                <v-alert v-else type="info" outlined dense class="mb-3"
                    :text="languageStore.t('training.noImageAvailable')">
                </v-alert>

                <!-- Letztes Log anzeigen (falls vorhanden) -->
                <div v-if="lastLogForExercise && lastLogForExercise.sets.length > 0" class="mb-4">
                    <v-row>
                        <v-col>
                            <h4 class="mb-2">{{ languageStore.t('training.actualLog') }}</h4>
                            <v-list density="compact" class="pa-0">
                                <v-list-item v-for="(set, index) in currentExercise.sets" :key="`current-${index}`"
                                    class="pa-0">
                                    <v-list-item-title>
                                        {{ index + 1 }}:
                                        <span v-if="set.repetitions !== null"> {{ set.repetitions }} * </span>
                                        <span v-if="set.weight">{{ set.weight }} kg</span>
                                        <span v-if="set.duration">{{ set.duration }}
                                            {{ languageStore.t('training.seconds') }}</span>
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-col>
                        <v-col>
                            <h4 class="mb-2">{{ languageStore.t('training.lastLog') }}</h4>
                            <v-list density="compact" class="pa-0">
                                <v-list-item v-for="(set, index) in lastLogForExercise.sets" :key="`last-${index}`"
                                    class="pa-0">
                                    <v-list-item-title>
                                        {{ index + 1 }}:
                                        <span v-if="set.repetitions !== null"> {{ set.repetitions }} * </span>
                                        <span v-if="set.weight">{{ set.weight }} kg</span>
                                        <span v-if="set.duration">{{ set.duration }}
                                            {{ languageStore.t('training.seconds') }}</span>
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-col>
                    </v-row>
                </div>
                <v-alert v-else type="info" outlined dense class="mb-3"
                    :text="languageStore.t('training.noPreviousLog')">
                </v-alert>
            </v-card-text>
        </v-card>

        <!-- Anleitung der Übung -->
        <v-expansion-panels v-if="currentExercise.instructions" class="mb-5">
            <v-expansion-panel :title="languageStore.t('general.instructions')">
                <v-expansion-panel-text>
                    {{ currentExercise.instructions }}
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <!-- Vorgabewerte (falls vorhanden) -->
        <v-card v-if="currentSet" class="mb-5">
            <v-card-title>{{ languageStore.t('training.suggestedValues') }}</v-card-title>
            <v-card-text>
                <v-row>
                    <v-col v-if="currentMeasurementType !== 'duration' && currentSet.repetitions">
                        <v-btn @click="currentReps = currentSet.repetitions">{{ currentSet.repetitions }} {{
                            languageStore.t('trainingPlans.repetitionsShort')
                        }}</v-btn>
                    </v-col>
                    <v-col v-if="currentMeasurementType === 'duration' && currentSet.duration">
                        <v-btn @click="currentWeightOrTime = currentSet.duration">{{ currentSet.duration }} {{
                            languageStore.t('training.seconds') }}</v-btn>
                    </v-col>
                    <v-col v-if="currentMeasurementType === 'weight' && currentSet.weight">
                        <v-btn @click="currentWeightOrTime = currentSet.weight">{{ currentSet.weight }} {{
                            languageStore.t('trainingPlans.weight') }}</v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card v-if="currentExercise" class="mb-5">
            <v-card-title>{{ languageStore.t('training.difficulty') }}</v-card-title>
            <v-card-text>
                <v-slider v-model="currentDifficulty" :min="1" :max="10" step="1"
                    :disabled="allSetsCompletedForExercise" show-ticks="always" :thumb-color="difficultyColor"
                    :track-fill-color="difficultyColor"></v-slider>
            </v-card-text>
        </v-card>

        <!-- Satzpause Timer -->
        <v-card v-if="isResting" class="mb-5 text-center" color="secondary" dark>
            <v-card-text>
                <div class="text-h5 mb-2">{{ languageStore.t('trainingPlans.restTime') }}</div>
                <v-progress-circular :rotate="360" :size="100" :width="15" :model-value="restTimerProgress"
                    color="primary" class="mb-3">
                    {{ restTimeRemaining }}s
                </v-progress-circular>
                <v-btn @click="skipRest" color="primary" variant="outlined" size="small">
                    {{ languageStore.t('training.skipRest') }}
                </v-btn>
            </v-card-text>
        </v-card>

        <!-- Aktueller Satz -->
        <v-card v-if="currentSet && !allSetsCompletedForExercise" class="my-5">
            <v-progress-linear
                :model-value="trainingProgress"
                height="6"
                color="primary"
                rounded
                class="mb-0"
            />
            <v-card-title>
                {{ languageStore.t('trainingPlans.set') }} {{ currentSetIndex + 1 }} / {{
                    currentExercise.sets.length }}
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="6" v-if="currentMeasurementType !== 'duration'">
                        <v-text-field v-model.number="currentReps"
                            :label="languageStore.t('trainingPlans.repetitionsShort')" type="number" variant="outlined"
                            :placeholder="placeholderReps" density="compact" :disabled="isResting"
                            @focus="clearOnFocus('reps')" @blur="restoreOnBlur('reps')"></v-text-field>
                    </v-col>
                    <v-col cols="6" v-if="currentMeasurementType === 'weight'">
                        <v-text-field v-model.number="currentWeightOrTime"
                            :label="languageStore.t('trainingPlans.weight')" type="number" step="0.5" variant="outlined"
                            :placeholder="placeholderWeightOrTime" density="compact" :disabled="isResting"
                            @focus="clearOnFocus('weightOrTime')" @blur="restoreOnBlur('weightOrTime')"></v-text-field>
                    </v-col>
                    <v-col cols="6" v-if="currentMeasurementType === 'duration'">
                        <v-text-field v-model.number="currentWeightOrTime"
                            :label="languageStore.t('training.timeSeconds')" type="number" variant="outlined"
                            :placeholder="placeholderWeightOrTime" density="compact" :disabled="isResting"
                            @focus="clearOnFocus('weightOrTime')" @blur="restoreOnBlur('weightOrTime')"></v-text-field>
                    </v-col>
                    <v-col cols="6" v-if="currentMeasurementType === 'duration'">
                        <v-btn @click="toggleTimer" :color="timerColor" block>
                            {{ timerButtonLabel }}
                        </v-btn>
                    </v-col>
                </v-row>
                <v-btn @click="completeSet" color="primary" block :disabled="isResting || !canCompleteSet">
                    {{ languageStore.t('training.completeSet') }}
                </v-btn>
            </v-card-text>
        </v-card>

        <!-- Nächste Übung / Training beenden -->
        <v-card v-if="allSetsCompletedForExercise && !allExercisesCompleted" class="mb-5">
            <v-card-text class="text-center">
                <v-icon color="success" size="x-large" class="mb-2">mdi-check-circle</v-icon>
                <div class="text-h6 mb-3">{{ languageStore.t('training.exerciseCompleted') }}</div>
                <v-btn @click="moveToNextExercise" color="primary" block>
                    {{ languageStore.t('training.nextExercise') }}
                </v-btn>
            </v-card-text>
        </v-card>

        <v-card v-if="allExercisesCompleted" class="mb-5">
            <v-card-text class="text-center">
                <v-icon color="success" size="x-large" class="mb-2">mdi-party-popper</v-icon>
                <div class="text-h6 mb-3">{{ languageStore.t('training.allExercisesDone') }}</div>
                <v-btn @click="finishTraining" color="success" block>
                    {{ languageStore.t('training.finishTraining') }}
                </v-btn>
            </v-card-text>
        </v-card>
        <div class="keyboard-spacer"></div>
    </v-container>
    <v-container v-else-if="!currentLog">
        <v-alert type="warning" :text="languageStore.t('training.noCurrentLog')"> </v-alert>
    </v-container>
    <v-container v-else>
        <v-alert type="info" :text="languageStore.t('training.loadingLog')"> </v-alert>
    </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useTrainingStore } from '@/stores/trainingStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import ImageDialog from '@/components/dialogs/ImageDialog.vue';

const trainingStore = useTrainingStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const currentReps = ref(0);
const currentWeightOrTime = ref(null);
const DEFAULT_DIFFICULTY = 5;
const currentDifficulty = ref(DEFAULT_DIFFICULTY);
const difficultyColor = computed(() => {
    const ratio = (currentDifficulty.value - 1) / 9;
    const hue = (1 - ratio) * 120;
    return `hsl(${hue}, 100%, 50%)`;
});
const originalReps = ref(0);
const originalWeightOrTime = ref(null);
const placeholderReps = ref('');
const placeholderWeightOrTime = ref('');
const isResting = ref(false);
const restTimer = ref(null);
const restTimeRemaining = ref(0);
const restTimerProgress = ref(100);
const timer = ref(null);
const timerRunning = ref(false);
const timerElapsed = ref(0);
const hasPlayedTargetBeep = ref(false);
const timerTargetDuration = ref(null);
let audioContext;

const openImageDialog = (src) => {
    dialogStore.imageSrc = src;
    dialogStore.openDialog('imageDialog');
};

const clearOnFocus = (field) => {
    if (field === 'reps') {
        originalReps.value = currentReps.value;
        placeholderReps.value = originalReps.value ?? '';
        currentReps.value = null;
    } else if (field === 'weightOrTime') {
        originalWeightOrTime.value = currentWeightOrTime.value;
        placeholderWeightOrTime.value = originalWeightOrTime.value ?? '';
        currentWeightOrTime.value = null;
    }
};

const restoreOnBlur = (field) => {
    if (field === 'reps') {
        if (currentReps.value === null || currentReps.value === '') {
            currentReps.value = originalReps.value;
        }
        placeholderReps.value = '';
    }
    if (field === 'weightOrTime') {
        if (currentWeightOrTime.value === null || currentWeightOrTime.value === '') {
            currentWeightOrTime.value = originalWeightOrTime.value;
        }
        placeholderWeightOrTime.value = '';
    }
};

// Computed Properties für den Zugriff auf Store-Zustände
const currentLog = computed(() => trainingStore.currentLog);
const currentSet = computed(() => trainingStore.currentSet);
const latestLog = computed(() => trainingStore.latestLog);

// Computed Properties für die Navigation im Log
const currentExerciseIndex = computed(() => {
    if (!currentLog.value || !currentSet.value) return 0;
    const exerciseIndex = currentLog.value.exercises.findIndex(exercise =>
        exercise.sets.some(set => set._id === currentSet.value._id)
    );
    return exerciseIndex !== -1 ? exerciseIndex : 0;
});

const currentSetIndex = computed(() => {
    if (!currentLog.value || !currentSet.value) return 0;
    const exercise = currentLog.value.exercises[currentExerciseIndex.value];
    if (!exercise) return 0;
    const setIndex = exercise.sets.findIndex(set => set._id === currentSet.value._id);
    return setIndex !== -1 ? setIndex : 0;
});

const currentExercise = computed(() => {
    if (!currentLog.value) return null;
    return currentLog.value.exercises[currentExerciseIndex.value];
});

// Computed Property, um das letzte Log für die aktuelle Übung zu finden
const lastLogForExercise = computed(() => {
    if (!latestLog.value || !currentExercise.value) return null;
    return latestLog.value.exercises.find(exercise =>
        exercise.trainingPlanExercise === currentExercise.value.trainingPlanExercise
    );
});

const setDifficultyPreset = (exercise) => {
    if (!exercise) {
        currentDifficulty.value = DEFAULT_DIFFICULTY;
        return;
    }

    if (exercise.difficulty != null) {
        currentDifficulty.value = exercise.difficulty;
        return;
    }

    if (lastLogForExercise.value?.difficulty != null) {
        currentDifficulty.value = lastLogForExercise.value.difficulty;
        return;
    }

    currentDifficulty.value = DEFAULT_DIFFICULTY;
};

watch(currentExercise, (newExercise, oldExercise) => {
    setDifficultyPreset(newExercise);
    if (newExercise && oldExercise && newExercise._id !== oldExercise._id) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}, { immediate: true });

watch(lastLogForExercise, (newLastLog) => {
    if (!currentExercise.value) return;
    if (currentExercise.value.difficulty != null) return;
    if (newLastLog?.difficulty != null) {
        currentDifficulty.value = newLastLog.difficulty;
    }
}, { immediate: true });


// Messart der aktuellen Übung bestimmen
const currentMeasurementType = computed(() => {
    const exercise = currentExercise.value;
    if (!exercise) return 'none';
    if (exercise.measurementType) return exercise.measurementType;
    const firstSet = exercise.sets?.[0];
    if (firstSet?.duration != null) return 'duration';
    if (firstSet?.weight != null) return 'weight';
    return 'repetitions';
});
const isWeightBased = computed(() => currentMeasurementType.value === 'weight');
const isDurationBased = computed(() => currentMeasurementType.value === 'duration');
const targetDuration = computed(() => timerTargetDuration.value);


// Computed Property, um zu prüfen, ob alle Sätze für die aktuelle Übung abgeschlossen sind
const allSetsCompletedForExercise = computed(() => {
    if (!currentExercise.value) return false;
    return currentExercise.value.sets.every(set => set.completed);
});

// Computed Property, um zu prüfen, ob alle Übungen im Log abgeschlossen sind
const allExercisesCompleted = computed(() => {
    if (!currentLog.value) return false;
    return currentLog.value.exercises.every(exercise =>
        exercise.sets.every(set => set.completed)
    );
});


// Fortschritt des gesamten Trainings berechnen
const totalSets = computed(() => {
    if (!currentLog.value) return 0;
    return currentLog.value.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0
    );
});

const completedSets = computed(() => {
    if (!currentLog.value) return 0;
    return currentLog.value.exercises.reduce(
        (sum, exercise) =>
            sum + exercise.sets.filter(set => set.completed).length,
        0
    );
});

const trainingProgress = computed(() => {
    if (totalSets.value === 0) return 0;
    return (completedSets.value / totalSets.value) * 100;
});


// Watcher für currentSet, um Eingabewerte zu aktualisieren
watch(currentSet, (newSet) => {
    if (newSet) {
        const prevSet = currentExercise.value?.sets?.[currentSetIndex.value - 1];

        currentReps.value = prevSet?.repetitions ?? newSet.repetitions ?? 0;

        if (isWeightBased.value) {
            currentWeightOrTime.value = prevSet?.weight ?? newSet.weight ?? 0;
        } else if (isDurationBased.value) {
            currentWeightOrTime.value = prevSet?.duration ?? newSet.duration ?? 0;
        } else {
            currentWeightOrTime.value = null;
        }

        isResting.value = false;
        clearInterval(restTimer.value);
        restTimeRemaining.value = 0;
        restTimerProgress.value = 100;
        clearInterval(timer.value);
        timerRunning.value = false;
        timerElapsed.value = 0;
        timerTargetDuration.value = null;
        hasPlayedTargetBeep.value = false;
    }
}, { immediate: true });

const ensureAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) {
        audioContext = new AudioContextClass();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
};

const playBeep = () => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
};

const maybePlayTargetBeep = () => {
    if (hasPlayedTargetBeep.value) return;
    if (!timerRunning.value) return;
    const target = targetDuration.value;
    if (!target) return;
    if (timerElapsed.value >= target) {
        playBeep();
        hasPlayedTargetBeep.value = true;
    }
};

const captureTargetDuration = () => {
    const parsePositiveNumber = (value) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
    };
    const fromInput = parsePositiveNumber(currentWeightOrTime.value);
    if (fromInput) return fromInput;
    const fromSet = parsePositiveNumber(currentSet.value?.duration);
    if (fromSet) return fromSet;
    return null;
};

const formattedTimer = computed(() => {
    const absTime = Math.abs(timerElapsed.value);
    const minutes = Math.floor(absTime / 60).toString().padStart(2, '0');
    const seconds = (absTime % 60).toString().padStart(2, '0');
    const prefix = timerElapsed.value < 0 ? '-' : '';
    return `${prefix}${minutes}:${seconds}`;
});

const timerButtonLabel = computed(() => {
    return timerRunning.value || timerElapsed.value !== 0
        ? formattedTimer.value
        : languageStore.t('training.timer');
});

const timerColor = computed(() => {
    if (!timerRunning.value) return 'primary';
    return timerElapsed.value <= 0 ? 'error' : 'success';
});

const toggleTimer = () => {
    if (timerRunning.value) {
        clearInterval(timer.value);
        timerRunning.value = false;
        if (timerElapsed.value > 0) {
            currentWeightOrTime.value = timerElapsed.value;
        }
        timerElapsed.value = 0;
        timerTargetDuration.value = null;
        hasPlayedTargetBeep.value = false;
    } else {
        timerTargetDuration.value = captureTargetDuration();
        timerElapsed.value = -3;
        currentWeightOrTime.value = 0;
        timerRunning.value = true;
        hasPlayedTargetBeep.value = false;
        timer.value = setInterval(() => {
            timerElapsed.value++;
            maybePlayTargetBeep();
        }, 1000);
    }
};


// Methoden
const completeSet = async () => {
    if (!currentLog.value || !currentExercise.value || !currentSet.value) return;

    clearInterval(timer.value);
    timerRunning.value = false;
    timerElapsed.value = 0;
    timerTargetDuration.value = null;
    hasPlayedTargetBeep.value = false;

    // Daten für das Update vorbereiten
    const updateData = { completed: true };
    if (isWeightBased.value) {
        updateData.repetitions = currentReps.value;
        updateData.weight = currentWeightOrTime.value;
    } else if (isDurationBased.value) {
        updateData.duration = currentWeightOrTime.value;
    } else {
        updateData.repetitions = currentReps.value;
    }

    const isLastSet =
        currentSetIndex.value === currentExercise.value.sets.length - 1;
    if (isLastSet) {
        updateData.difficulty = currentDifficulty.value;
    }


    // Satz im Store aktualisieren und als abgeschlossen markieren
    await trainingStore.completeSet(
        currentLog.value._id,
        currentExercise.value._id,
        currentSetIndex.value, // Pass the set index
        updateData
    );

    // Wenn es weitere Sätze in der aktuellen Übung gibt und nicht alle abgeschlossen sind,
    // starte den Ruhe-Timer, falls ein Ruhe-Intervall definiert ist
    if (
        currentSet.value &&
        !allSetsCompletedForExercise.value &&
        currentSet.value.restAfterSet > 0
    ) {
        startRestTimer(currentSet.value.restAfterSet);
    } else if (allSetsCompletedForExercise.value && !allExercisesCompleted.value) {
        // Wenn alle Sätze der aktuellen Übung abgeschlossen sind, aber nicht alle Übungen,
        // wird der Watcher für currentSet ein neues Set (der nächsten Übung) laden,
        // oder currentSet wird null, wenn keine weiteren Sets/Übungen vorhanden sind.
        // Die Logik für "Nächste Übung" wird durch die v-if-Bedingung im Template gesteuert.
    } else if (allExercisesCompleted.value) {
        // Wenn alle Übungen abgeschlossen sind, wird die Logik für "Training beenden" durch die v-if-Bedingung im Template gesteuert.
    }
};

const canCompleteSet = computed(() => {
    if (isWeightBased.value) {
        return (currentReps.value || 0) > 0 && (currentWeightOrTime.value || 0) > 0;
    }
    if (isDurationBased.value) {
        return (currentWeightOrTime.value || 0) > 0;
    }
    return (currentReps.value || 0) > 0;
});

const startRestTimer = (duration) => {
    isResting.value = true;
    restTimeRemaining.value = duration;
    restTimerProgress.value = 100;

    restTimer.value = setInterval(() => {
        restTimeRemaining.value--;
        restTimerProgress.value = (restTimeRemaining.value / duration) * 100;

        if (restTimeRemaining.value <= 0) {
            clearInterval(restTimer.value);
            isResting.value = false;
            // Optional: Automatisch zum nächsten Set/Übung wechseln, wenn der Timer abgelaufen ist
            // trainingStore.fetchNextLogSet(currentLog.value._id);
        }
    }, 1000);
};


const skipRest = () => {
    clearInterval(restTimer.value);
    isResting.value = false;
    restTimeRemaining.value = 0;
    restTimerProgress.value = 100;
    // Manuelles Fetchen des nächsten Sets, wenn die Pause übersprungen wird
    trainingStore.fetchNextLogSet(currentLog.value._id);
};

const moveToNextExercise = async () => {
    if (!currentLog.value) return;
    // Die Logik zum Laden des nächsten Sets/der nächsten Übung wird durch fetchNextLogSet im Store gehandhabt.
    await trainingStore.fetchNextLogSet(currentLog.value._id);
};

const finishTraining = async () => {
    if (!currentLog.value) return;
    await trainingStore.finishTraining(currentLog.value._id);
};



onMounted(async () => {
    if (currentLog.value) {
        await trainingStore.fetchNextLogSet(currentLog.value._id);
    }
    if (!latestLog.value && trainingStore.selectedPlan?._id && trainingStore.selectedDay !== null) {
        await trainingStore.fetchLatestTrainingLog(trainingStore.selectedPlan._id, trainingStore.selectedDay);
    }
});

onUnmounted(() => {
    clearInterval(restTimer.value);
    clearInterval(timer.value);
});

</script>

<style scoped>
.exercise-title {
    white-space: normal;
    line-height: 1.2;
    text-align: left;
}

/* Optional: Füge hier spezifische Styles hinzu */
.v-card-title span:first-child {
    margin-right: auto;
    /* Pusht den Übungszähler nach rechts */
}

.keyboard-spacer {
    height: 40vh;
}
</style>
