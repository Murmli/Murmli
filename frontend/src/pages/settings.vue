<template>
  <v-container>
    <!-- Konto -->
    <v-expansion-panels v-model="panel">
      <v-expansion-panel>
        <v-expansion-panel-title>{{ languageStore.t("settings.account") }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <!-- Sprache -->
          <LanguageSelect />
          <StartpageSelect />
          <div class="justify-center text-center">
            <UserIdDisplay class="pb-5" />

            <!-- Export / Import -->
            <v-row class="justify-center text-center mb-5">
              <ExportDataBtn />
            </v-row>

            <v-row class="justify-center text-center mb-5">
              <ImportDataBtn />
            </v-row>
            <v-divider class="my-4"></v-divider>

            <!-- Account löschen mit doppelte Sicherheit -->
            <DeleteAccountBtn />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="userStore.isAdmin">
        <v-expansion-panel-title>{{ languageStore.t('adminStats.title') }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <AdminStats />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="userStore.isAdmin">
        <v-expansion-panel-title>{{ languageStore.t('adminTools.title') }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <AdminTools />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Bestätigung zum Löschen -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>{{ languageStore.t("settings.confirmDeleteTitle") }}</v-card-title>
        <v-card-text>{{ languageStore.t("settings.confirmDeleteText") }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="deleteAccount">{{ languageStore.t("settings.confirmDelete") }}</v-btn>
          <v-btn color="grey" @click="deleteDialog = false">{{ languageStore.t("settings.cancel") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-divider class="my-6"></v-divider>

    <AppPromotionActions />
  </v-container>
</template>

<route lang="yaml">
  meta:
    layout: defaultLayout
    title: "settings.title"
</route>

<script setup>
import { ref } from "vue";
import { useLanguageStore } from "@/stores/languageStore";
import { useUserStore } from "@/stores/userStore";
import AdminStats from "@/components/general/AdminStats.vue";
import AdminTools from "@/components/general/AdminTools.vue";
import AppPromotionActions from "@/components/general/AppPromotionActions.vue";

const languageStore = useLanguageStore();
const userStore = useUserStore();
userStore.fetchRole();

const panel = ref(0);
const deleteDialog = ref(false);
</script>
