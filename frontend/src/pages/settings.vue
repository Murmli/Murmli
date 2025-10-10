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
          <v-row class="justify-center text-center mt-4 mb-6">
            <v-btn color="primary" variant="tonal" prepend-icon="mdi-help-circle-outline" @click="goHelp">
              {{ languageStore.t('helpPage.openHelpCenter') }}
            </v-btn>
          </v-row>
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

    <!-- App: Rate and Share Links -->
    <v-row class="d-flex justify-center mb-3">
      <v-chip class="px-4" color="primary" text-color="white" variant="elevated" prepend-icon="mdi-heart"
        @click="openLink('https://play.google.com/store/apps/details?id=de.murmli.twa')">
        {{ languageStore.t('navigation.rateApp') }}
      </v-chip>
    </v-row>

    <v-row class="d-flex justify-center">
      <v-btn icon variant="text" @click="shareApp">
        <v-tooltip :text="languageStore.t('navigation.shareApp')" location="top">
          <template #activator="{ props }">
            <v-icon v-bind="props">mdi-share-variant-outline</v-icon>
          </template>
        </v-tooltip>
      </v-btn>

      <v-btn icon variant="text" @click="openLink('mailto:prompt-engineered@protonmail.com?subject=Murmli%20App')">
        <v-tooltip :text="languageStore.t('navigation.email')" location="top">
          <template #activator="{ props }">
            <v-icon v-bind="props" color="cyan-darken-2">mdi-email-outline</v-icon>
          </template>
        </v-tooltip>
      </v-btn>

      <v-btn icon variant="text" @click="openLink('https://discord.com/invite/qkxjGEp3Tg')">
        <v-tooltip :text="'Discord'" location="top">
          <template #activator="{ props }">
            <v-icon v-bind="props" color="deep-purple-accent-2">mdi-chat</v-icon>
          </template>
        </v-tooltip>
      </v-btn>

      <v-btn icon variant="text" @click="openLink('https://www.reddit.com/r/Murmli/')">
        <v-tooltip :text="'Reddit'" location="top">
          <template #activator="{ props }">
            <v-icon v-bind="props" color="red">mdi-reddit</v-icon>
          </template>
        </v-tooltip>
      </v-btn>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
  meta:
    layout: defaultLayout
    title: "settings.title"
</route>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useLanguageStore } from "@/stores/languageStore";
import { useUserStore } from "@/stores/userStore";
import AdminStats from "@/components/general/AdminStats.vue";
import AdminTools from "@/components/general/AdminTools.vue";

const languageStore = useLanguageStore();
const userStore = useUserStore();
const router = useRouter();
userStore.fetchRole();

const panel = ref(0);
const deleteDialog = ref(false);

// Link helpers
const openLink = (url) => {
  window.open(url, '_blank')
}

const shareApp = () => {
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=de.murmli.twa'
  if (navigator.share) {
    navigator.share({ title: 'Murmli', url: playStoreUrl })
  } else {
    navigator.clipboard.writeText(playStoreUrl)
    alert('Copied to the clipboard!')
  }
}

const goHelp = () => {
  router.push('/help')
}
</script>
