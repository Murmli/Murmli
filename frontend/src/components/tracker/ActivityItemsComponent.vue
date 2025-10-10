<template>
    <div v-if="tracker.activities">
        <!-- Activity Item Card -->
        <v-card @click="openDropdown(item)" class="mb-1" v-for="(item, index) in tracker.activities" :key="index">
            <v-card-title class=" text-subtitle-2">
                {{ item.name }}
            </v-card-title>

            <v-card-subtitle class="text-caption">
                {{ item.duration }} {{ languageStore.t('tracker.minutes') }} ({{ item.caloriesBurned }} kcal {{
                    languageStore.t('tracker.burned') }})
            </v-card-subtitle>
        </v-card>

        <!-- Bottom Sheet -->
        <v-dialog v-model="dropdownMenu" location="top">
            <v-card max-width="500" style="margin-top: 20px;">
                <v-card-title>
                    {{ trackerStore.selectedItem.name }}
                </v-card-title>
                <v-card-text>
                    <v-list>
                        <v-list-item @click="openChangeItem(item)">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-pencil"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('tracker.menu.edit') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="deleteItem()">
                            <template v-slot:prepend>
                                <v-icon color="red" icon="mdi-delete-empty"></v-icon>
                            </template>
                            <v-list-item-title>{{ languageStore.t('tracker.menu.remove') }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn @click="dropdownMenu = false">{{ languageStore.t('general.close') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>

    <!-- Change Item Dialog-->
    <v-dialog v-model="changeItemDialog" persistent max-width="600px">
        <v-card>
            <v-card-title>
                {{ changeItemDialog.name }}
            </v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="trackerStore.selectedItem.name"
                                :label="languageStore.t('shoppingList.nameLabel')" class="w-100" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <v-text-field v-model="trackerStore.selectedItem.caloriesBurned" type="number"
                                :label="languageStore.t('tracker.caloriesBurned')" min="0" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <v-text-field v-model="trackerStore.selectedItem.duration"
                                :label="languageStore.t('tracker.duration')" />
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-btn text @click="changeItemDialog = false">{{ languageStore.t('general.close')
                }}</v-btn>
                <v-spacer></v-spacer>
                <v-btn text color="primary" @click="saveEditedItem">{{ languageStore.t('general.save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();

const tracker = computed(() => trackerStore.tracker || { foodItems: [] });
const dropdownMenu = ref(false);
const changeItemDialog = ref(false);

const originalDuration = ref(0);
const originalCalories = ref(0);

const openDropdown = (item) => {
    trackerStore.selectedItem = item;
    dropdownMenu.value = true;
};

const deleteItem = async () => {
    await trackerStore.removeActivityItem();
    dropdownMenu.value = false;
};

const openChangeItem = () => {
    originalDuration.value = trackerStore.selectedItem.duration;
    originalCalories.value = trackerStore.selectedItem.caloriesBurned;
    changeItemDialog.value = true;
};

const saveEditedItem = async () => {
    await trackerStore.updateActivityItem();
    changeItemDialog.value = false;
    dropdownMenu.value = false;
};

watch(
    () => trackerStore.selectedItem.duration,
    (newDuration) => {
        if (originalDuration.value > 0) {
            const factor = newDuration / originalDuration.value;
            trackerStore.selectedItem.caloriesBurned = Math.round(originalCalories.value * factor);
        }
    }
);
</script>