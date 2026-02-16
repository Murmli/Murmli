import { defineStore } from "pinia";
import { useApiStore } from "./apiStore";
import { cache } from "@/utils/cache";

export const useTrainingStore = defineStore("trainingStore", {
    state: () => ({
        trainingPlans: [],
        selectedPlanId: null,
        selectedPlan: null,
        selectedDay: null,
        generatedPlan: null,
        generationStatus: null,
        pollInterval: null,
        isPolling: false,
        generationBaseCount: 0,

        trainingLogs: [],
        currentLogId: null,
        currentLog: null,
        logPreview: null,
        latestLog: null,
        currentSet: null,
        error: null,
    }),

    actions: {
        loadCache() {
            const data = cache.get('trainingPlans');
            if (data) {
                this.trainingPlans = data.trainingPlans || [];
                this.selectedPlanId = data.selectedPlanId || null;
                this.selectedPlan = data.selectedPlan || null;
            }
        },

        saveCache() {
            cache.set('trainingPlans', {
                trainingPlans: this.trainingPlans,
                selectedPlanId: this.selectedPlanId,
                selectedPlan: this.selectedPlan,
            });
        },

        clearCache() {
            cache.remove('trainingPlans');
        },

        // Trainings Plans
        async fetchTrainingPlans() {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("get", "/training-plans", null, false);
                if (response.status === 200) {
                    this.trainingPlans = response.data;
                    this.saveCache();
                    return this.trainingPlans;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async fetchTrainingPlan(id = this.selectedPlanId) {
            const rawPlanId =
                id && typeof id === "object"
                    ? id._id || id.id || id.value || (typeof id.toString === "function" ? id.toString() : null)
                    : id;
            const planId = typeof rawPlanId === "string" ? rawPlanId : null;
            if (!planId) {
                this.error = new Error("Ungültige Trainingsplan-ID");
                return null;
            }
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("get", `/training-plans/${planId}`);
                if (response.status === 200) {
                    this.selectedPlan = response.data;
                    this.selectedPlanId = response.data?._id || planId;
                    this.saveCache();
                    return this.selectedPlan;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async createTrainingPlan(data) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("post", "/training-plans", data);
                if (response.status === 201 || response.status === 200) {
                    this.trainingPlans.push(response.data);
                    this.saveCache();
                    return response.data;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async updateTrainingPlan(id, data) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("put", `/training-plans/${id}`, data);
                if (response.status === 200) {
                    this.trainingPlans = this.trainingPlans.map(plan =>
                        plan._id === id ? response.data : plan
                    );
                    if (this.selectedPlan && this.selectedPlan._id === id) {
                        this.selectedPlan = response.data;
                    }
                    this.saveCache();
                    return response.data;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async updatePlanExercise(planId, exerciseId, data) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest(
                    "patch",
                    `/training-plans/${planId}/exercises/${exerciseId}`,
                    data
                );
                if (response.status === 200) {
                    if (this.selectedPlan && this.selectedPlan._id === planId) {
                        for (const day of this.selectedPlan.days) {
                            const ex = day.exercises.find(e => e._id === exerciseId);
                            if (ex) {
                                Object.assign(ex, response.data);
                            }
                        }
                        this.saveCache();
                    }
                    return response.data;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async deleteTrainingPlan(id) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("delete", `/training-plans/${id}`);
                if (response.status === 200 || response.status === 204) {
                    this.trainingPlans = this.trainingPlans.filter(plan => plan._id !== id);
                    if (this.selectedPlan && this.selectedPlan._id === id) {
                        this.selectedPlan = null;
                    }
                    this.saveCache();
                    return true;
                }
            } catch (error) {
                this.error = error;
            }
            return false;
        },

        async generateTrainingPlan(text) {
            const apiStore = useApiStore();
            if (this.generationStatus === 'processing') {
                return { status: 'processing' };
            }
            try {
                const response = await apiStore.apiRequest("post", "/training-plans/generate", { text });
                if (response.status === 200 || response.status === 201) {
                    this.generatedPlan = response.data;
                    this.trainingPlans.push(response.data);
                    this.saveCache();
                    return this.generatedPlan;
                } else if (response.status === 202) {
                    this.generatedPlan = null;
                    this.generationStatus = 'processing';
                    const count = await this.fetchTrainingPlanCount(false);
                    this.generationBaseCount = count || 0;
                    if (this.pollInterval) clearInterval(this.pollInterval);
                    const poll = async () => {
                        if (this.isPolling) return;
                        this.isPolling = true;
                        const currentCount = await this.fetchTrainingPlanCount(false);
                        this.isPolling = false;
                        if (currentCount && currentCount >= this.generationBaseCount + 1) {
                            clearInterval(this.pollInterval);
                            this.pollInterval = null;
                            this.generationStatus = null;
                            await this.fetchTrainingPlans();
                        }
                    };
                    this.pollInterval = setInterval(poll, 5000);
                    return { status: 'processing' };
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async generateTrainingPlanMultimodal({ text, images, audio }) {
            const apiStore = useApiStore();
            if (this.generationStatus === 'processing') {
                return { status: 'processing' };
            }
            this.generationStatus = 'processing';
            try {
                const formData = new FormData();
                
                if (text) {
                    formData.append("text", text);
                }
                
                // Mehrere Bilder hinzufügen
                if (images && images.length > 0) {
                    images.forEach((image, index) => {
                        formData.append(`image_${index}`, image);
                    });
                    formData.append("imageCount", images.length.toString());
                }
                
                // Audio hinzufügen
                if (audio) {
                    formData.append("audio", audio, "recording.wav");
                }

                const response = await apiStore.apiRequest(
                    "post",
                    "/training-plans/generate/multimodal",
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );
                
                if (response.status === 200 || response.status === 201) {
                    this.generatedPlan = response.data;
                    this.trainingPlans.push(response.data);
                    this.saveCache();
                    this.generationStatus = null;
                    return this.generatedPlan;
                } else if (response.status === 202) {
                    this.generatedPlan = null;
                    this.generationStatus = 'processing';
                    const count = await this.fetchTrainingPlanCount(false);
                    this.generationBaseCount = count || 0;
                    if (this.pollInterval) clearInterval(this.pollInterval);
                    const poll = async () => {
                        if (this.isPolling) return;
                        this.isPolling = true;
                        const currentCount = await this.fetchTrainingPlanCount(false);
                        this.isPolling = false;
                        if (currentCount && currentCount >= this.generationBaseCount + 1) {
                            clearInterval(this.pollInterval);
                            this.pollInterval = null;
                            this.generationStatus = null;
                            await this.fetchTrainingPlans();
                        }
                    };
                    this.pollInterval = setInterval(poll, 5000);
                    return { status: 'processing' };
                }
            } catch (error) {
                this.error = error;
                this.generationStatus = null;
            }
            return null;
        },

        async continueTrainingPlan(plan, text = '') {
            const apiStore = useApiStore();
            if (!plan || !plan._id) {
                this.error = new Error('Ungültiger Trainingsplan');
                return null;
            }
            if (this.generationStatus === 'processing') {
                return { status: 'processing' };
            }
            try {
                const payload = {
                    text,
                    plan,
                };
                const response = await apiStore.apiRequest("post", `/training-plans/${plan._id}/continue`, payload);
                if (!response) {
                    return null;
                }
                if (response.status === 200 || response.status === 201) {
                    this.generatedPlan = response.data;
                    this.trainingPlans.push(response.data);
                    this.saveCache();
                    return this.generatedPlan;
                } else if (response.status === 202) {
                    this.generatedPlan = null;
                    this.generationStatus = 'processing';
                    const count = await this.fetchTrainingPlanCount(false);
                    this.generationBaseCount = count || 0;
                    if (this.pollInterval) clearInterval(this.pollInterval);
                    const poll = async () => {
                        if (this.isPolling) return;
                        this.isPolling = true;
                        const currentCount = await this.fetchTrainingPlanCount(false);
                        this.isPolling = false;
                        if (currentCount && currentCount >= this.generationBaseCount + 1) {
                            clearInterval(this.pollInterval);
                            this.pollInterval = null;
                            this.generationStatus = null;
                            await this.fetchTrainingPlans();
                        }
                    };
                    this.pollInterval = setInterval(poll, 5000);
                    return { status: 'processing' };
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async fetchTrainingPlanCount(showLoader = true) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("post", "/training-plans/count", null, showLoader);
                if (response.status === 200) {
                    return response.data.count;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async editTrainingPlanWithText(id, text, preview = false, updatedPlan = null) {
            const apiStore = useApiStore();
            try {
                const payload = preview
                    ? { text, preview: true }
                    : updatedPlan
                        ? { updatedPlan }
                        : { text };
                const response = await apiStore.apiRequest("post", `/training-plans/${id}/edit-text`, payload, false);
                if (response.status === 200) {
                    if (preview) {
                        return {
                            preview: response.data.preview,
                            changes: response.data.changes || []
                        };
                    }
                    this.trainingPlans = this.trainingPlans.map(plan =>
                        plan._id === id ? response.data : plan
                    );
                    if (this.selectedPlan && this.selectedPlan._id === id) {
                        this.selectedPlan = response.data;
                    }
                    this.clearCache();
                    await this.fetchTrainingPlans();
                    return response.data;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async archiveTrainingPlan(id) {
            try {
                const plan = this.trainingPlans.find(p => p._id === id);
                if (!plan) {
                    return null;
                }
                const data = { ...plan, status: 'archived' };
                const updatedPlan = await this.updateTrainingPlan(id, data);
                return updatedPlan;
            } catch (error) {
                this.error = error;
                return null;
            }
        },

        async activateTrainingPlan(id) {
            try {
                const plan = this.trainingPlans.find(p => p._id === id);
                if (!plan) {
                    return null;
                }
                const data = { ...plan, status: 'active' };
                const updatedPlan = await this.updateTrainingPlan(id, data);
                return updatedPlan;
            } catch (error) {
                this.error = error;
                return null;
            }
        },

        async updateTrainingPlanStatus(planId, status) {
            // status: active, archived
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest(
                    "patch",
                    `/training-plans/${planId}/status`,
                    { status }
                );
                if (response.status === 200) {
                    const index = this.trainingPlans.findIndex(p => p._id === planId);
                    if (index !== -1) {
                        this.trainingPlans[index] = response.data;
                    }
                    return response.data;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        // Trainings Logs
        async fetchTrainingLogById(logId) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("get", `/training-logs/${logId}`);
                if (response.status === 200) {
                    this.currentLogId = logId;
                    this.currentLog = response.data;
                    return this.currentLog;
                } else if (response.status === 404) {
                    this.currentLog = null;
                    return null;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async fetchNextLogSet(logId = this.currentLogId ?? this.currentLog?._id) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("get", `/training-logs/${logId}/next-set`);
                if (response.status === 200 && !response.data.message) {
                    this.currentSet = response.data.setDetails;
                    return this.currentSet;
                } else {
                    console.error(response.data.message);
                    this.currentSet = null; // Set currentSet to null if no next set
                    return false;
                }
            } catch (error) {
                this.error = error;
                this.currentSet = null; // Set currentSet to null on error
            }
            return null;
        },

        async fetchLatestTrainingLog(trainingPlanId = this.selectedPlanId, weekday = this.selectedDay) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("get", `/training-logs/last?trainingPlanId=${trainingPlanId}&weekday=${weekday}`);
                if (response.status === 200) {
                    if (response.data && response.data.message) {
                        this.latestLog = null;
                        return null;
                    }
                    this.latestLog = response.data;
                    return this.latestLog;
                } else {
                    this.latestLog = null;
                    return null;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async completeTrainingLog(logId = this.currentLogId ?? this.currentLog?._id) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("post", `/training-logs/${logId}/complete`);
                if (response.status === 200) {
                    this.currentLog = response.data;
                    return this.currentLog;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        // status: enum: ['completed', 'aborted', 'in-progress', 'canceled']
        async updateTrainingLogStatus(logId = this.currentLogId ?? this.currentLog?._id, status) {
            const validStatuses = ['completed', 'aborted', 'in-progress', 'canceled'];
            if (!validStatuses.includes(status)) {
                console.error(`Ungültiger Statuswert: ${status}. Gültige Werte sind: ${validStatuses.join(', ')}`);
                this.error = new Error(`Ungültiger Statuswert: ${status}`);
                return null;
            }

            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("patch", `/training-logs/${logId}/status`, { status });
                if (response.status === 200) {
                    this.currentLog = response.data;
                    return this.currentLog;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async previewTrainingLog(trainingPlanId = this.selectedPlanId, weekday = this.selectedDay) {
            const apiStore = useApiStore();
            try {
                const data = { trainingPlanId, weekday };
                const response = await apiStore.apiRequest("post", "/training-logs/preview", data);
                if (response.status === 200) {
                    this.logPreview = response.data;
                    return this.logPreview;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async createTrainingLog(trainingPlanId = this.selectedPlanId, weekday = this.selectedDay) {
            const apiStore = useApiStore();
            try {
                const data = { trainingPlanId, weekday };
                const response = await apiStore.apiRequest("post", "/training-logs", data);
                if (response.status === 201) {
                    this.trainingLogs.push(response.data);
                    this.currentLog = response.data;
                    this.currentLogId = response.data._id;
                    return this.currentLog;
                }
            } catch (error) {
                console.error("Error creating training log:", error); // Englische Fehlermeldung
                this.error = error;
            }
            return null;
        },

        // Dummy-Funktionen für TrainingLog.vue
        async updateSet(logId, exerciseId, setId, data) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest(
                    "patch",
                    `/training-logs/${logId}/exercises/${exerciseId}/sets/${setId}`,
                    data
                );
                if (response.status === 200) {
                    const updatedSet = response.data;
                    if (this.currentSet && this.currentSet._id === setId) {
                        this.currentSet = { ...this.currentSet, ...updatedSet };
                    }
                    if (this.currentLog) {
                        const exercise = this.currentLog.exercises.find(e => e._id === exerciseId);
                        if (exercise) {
                            const set = exercise.sets.find(s => s._id === setId);
                            if (set) {
                                Object.assign(set, updatedSet);
                            }
                        }
                    }
                    return updatedSet;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async completeSet(logId, exerciseId, setIndex, data) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest(
                    "post",
                    `/training-logs/${logId}/exercises/${exerciseId}/sets/${setIndex}/complete`,
                    data
                );

                if (response.status === 200) {
                    // Update the local state of the current log
                    if (this.currentLog) {
                        const exerciseIndex = this.currentLog.exercises.findIndex(e => e._id === exerciseId);
                        if (exerciseIndex !== -1) {
                            const exercise = this.currentLog.exercises[exerciseIndex];
                            const set = exercise.sets[setIndex];
                            if (set) {
                                const { difficulty, ...setData } = data;
                                Object.assign(set, setData, { completed: true });
                                if (difficulty !== undefined) {
                                    exercise.difficulty = difficulty;
                                }
                            }
                        }
                    }

                    if (response.data && response.data.setDetails) {
                        // Nächster Satz wurde zurückgegeben
                        const nextSet = response.data.setDetails;

                        // Aktuellen Log mit den vom Server gelieferten Satzdetails aktualisieren
                        if (response.data.exerciseLogId === exerciseId) {
                            const exerciseIndex = this.currentLog?.exercises.findIndex(e => e._id === exerciseId);
                            if (exerciseIndex !== undefined && exerciseIndex !== -1) {
                                this.currentLog.exercises[exerciseIndex].sets[response.data.setIndex] = nextSet;
                            }
                        }

                        this.currentSet = nextSet;
                    } else if (response.data && response.data.status === 'completed') {
                        // Training abgeschlossen
                        this.currentSet = null;
                        // Optional: currentLog Status auf 'completed' setzen
                        if (this.currentLog) {
                            this.currentLog.status = 'completed';
                        }
                    } else {
                        console.error("Unerwartete API-Antwort nach Satzabschluss:", response.data);
                        this.currentSet = null; // Setze currentSet auf null bei unerwarteter Antwort
                    }
                    return response.data;
                } else {
                    console.error("Fehler beim Abschließen des Satzes:", response.status, response.data);
                    this.error = new Error(`Fehler beim Abschließen des Satzes: ${response.status}`);
                    return null;
                }
            } catch (error) {
                console.error("Exception beim Abschließen des Satzes:", error);
                this.error = error;
                return null;
            }
        },

        async moveToNextExercise(logId = this.currentLogId ?? this.currentLog?._id) {
            const nextSet = await this.fetchNextLogSet(logId);
            return nextSet;
        },

        async finishTraining(logId = this.currentLogId ?? this.currentLog?._id, data = {}) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("post", `/training-logs/${logId}/complete`, data);
                if (response.status === 200) {
                    this.currentLog = response.data.log || response.data;
                    if (this.currentLog) {
                        this.currentLog.status = 'completed';
                    }
                    this.currentSet = null;
                    this.currentLogId = null;
                    return this.currentLog;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async cancelTraining(logId) {
            const updatedLog = await this.updateTrainingLogStatus(logId, 'canceled');
            if (updatedLog) {
                this.currentSet = null;
                this.currentLogId = null;
            }
            return updatedLog;
        },

        async fetchTrainingFeedback(logId = this.currentLog?._id) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest(
                    "post",
                    `/training-logs/${logId}/feedback`,
                    null,
                    false
                );
                if (response.status === 200) {
                    return response.data;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async trackTrainingCalories(logId = this.currentLog?._id) {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest(
                    "post",
                    `/training-logs/${logId}/calories`,
                    null,
                    false
                );
                if (response.status === 200) {
                    return response.data;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async askTrainingPlanQuestion(payload) {
            const apiStore = useApiStore();
            try {
                const planId = this.selectedPlan?._id;

                let body = {};
                if (typeof payload === 'string') {
                    body.question = payload;
                } else if (Array.isArray(payload)) {
                    body.messages = payload;
                } else {
                    body = payload;
                }

                const response = await apiStore.apiRequest(
                    "post",
                    `/training-plans/${planId}/ask`,
                    body,
                    false
                );
                return response?.data.answer;
            } catch (error) {
                this.error = error;
            }
            return null;
        },

        async fetchTrainingStats() {
            const apiStore = useApiStore();
            try {
                const response = await apiStore.apiRequest("get", "/training-logs/stats");
                if (response.status === 200) {
                    return response.data;
                }
            } catch (error) {
                this.error = error;
            }
            return null;
        }
    },
});