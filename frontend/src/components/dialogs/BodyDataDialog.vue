<template>
    <v-dialog v-model="dialogStore.dialogs.bodyDataDialog" max-width="600">
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.bodyData') }}</v-card-title>
            <v-card-text>
                <!-- Formular für Körperdaten -->
                <v-text-field v-model="localBodyData.height" type="number" :label="languageStore.t('tracker.height')"
                    suffix="cm" class="mb-3"></v-text-field>

                <v-text-field v-model="localBodyData.latestWeight" type="number"
                    :label="languageStore.t('tracker.weight')" suffix="kg" class="mb-3"></v-text-field>

                <v-text-field v-model="localBodyData.birthyear" type="number"
                    :label="languageStore.t('tracker.birthyear')" class="mb-3"></v-text-field>

                <v-select v-model="localBodyData.gender" :items="genderOptions"
                    :label="languageStore.t('tracker.gender.text')" class="mb-3"></v-select>

                <v-text-field v-model="localBodyData.workHoursWeek" type="number"
                    :label="languageStore.t('tracker.workHoursWeek')" class="mb-3"></v-text-field>

                <v-autocomplete v-model="localBodyData.workDaysPAL" :items="palOptions"
                    :label="languageStore.t('tracker.workDaysPAL')" item-title="text" item-value="value" type="number"
                    step="0.1" clearable class="mb-3">
                    <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props" :title="item.raw.text"
                            :subtitle="`PAL: ${item.raw.value}`"></v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                        {{ item.raw.value }}
                    </template>
                </v-autocomplete>
                <div class="py-3 text-center text-caption">
                    {{ languageStore.t('tracker.bodyDataInfo') }}
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="closeDialog">{{ languageStore.t('general.cancel') }}</v-btn>

                <v-btn color="primary" @click="saveBodyData">{{ languageStore.t('general.save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';
import { useDialogStore } from '@/stores/dialogStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();

// Lokale Kopie der Körperdaten
const localBodyData = ref({
    height: null,
    weight: null,
    birthyear: null,
    gender: null,
    workHoursWeek: null,
    workDaysPAL: null
});


// Options für Select-Felder
const genderOptions = [
    { value: 'male', title: languageStore.t('tracker.gender.male') },
    { value: 'female', title: languageStore.t('tracker.gender.female') }
];

const palOptions = computed(() => [
    {
        value: 1.2,
        text: languageStore.t('tracker.palOptions.homeOffice')
    },
    {
        value: 1.3,
        text: languageStore.t('tracker.palOptions.officeWorker')
    },
    {
        value: 1.4,
        text: languageStore.t('tracker.palOptions.teacher')
    },
    {
        value: 1.5,
        text: languageStore.t('tracker.palOptions.salesperson')
    },
    {
        value: 1.6,
        text: languageStore.t('tracker.palOptions.waiter')
    },
    {
        value: 1.7,
        text: languageStore.t('tracker.palOptions.nurse')
    },
    {
        value: 1.8,
        text: languageStore.t('tracker.palOptions.constructionWorker')
    },
    {
        value: 1.9,
        text: languageStore.t('tracker.palOptions.farmer')
    },
    {
        value: 2.0,
        text: languageStore.t('tracker.palOptions.sportsTeacher')
    },
    {
        value: 2.2,
        text: languageStore.t('tracker.palOptions.constructionSite')
    },
    {
        value: 2.4,
        text: languageStore.t('tracker.palOptions.mountainGuide')
    }
]);

// Beim Öffnen des Dialogs Daten laden
onMounted(async () => {
    const fetchedData = await trackerStore.fetchBodyData();
    if (!localBodyData.value) {
        localBodyData.value = fetchedData;
    } else {
        Object.assign(localBodyData.value, fetchedData);
    }
    delete localBodyData.value.dietType;
    delete localBodyData.value.dietLevel;
});


const saveBodyData = async () => {
    try {
        const bodyDataCopy = { ...localBodyData.value };

        if (bodyDataCopy.latestWeight !== trackerStore.bodyData.latestWeight) {
            bodyDataCopy.weight = bodyDataCopy.latestWeight;
        } else {
            delete bodyDataCopy.weight;
        }

        await trackerStore.updateBodyData(bodyDataCopy);
        closeDialog();
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
    }
};

const closeDialog = () => {
    dialogStore.closeDialog('bodyDataDialog');
};
</script>