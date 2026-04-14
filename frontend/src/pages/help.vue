<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" lg="8">
        <v-card class="mb-6">
          <v-card-title class="text-h5">
            {{ languageStore.t('helpPage.title') }}
          </v-card-title>
          <v-card-text>
            <p class="mb-0">
              {{ languageStore.t('helpPage.intro') }}
            </p>
          </v-card-text>
        </v-card>

        <v-row class="mb-6 px-3" dense>
          <v-col cols="6">
            <v-btn
              block
              color="primary"
              variant="tonal"
              prepend-icon="mdi-email-outline"
              @click="openLink('mailto:prompt-engineered@protonmail.com?subject=Murmli%20App')"
            >
              {{ languageStore.t('contact.title') }}
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              block
              color="deep-purple-accent-2"
              variant="tonal"
              prepend-icon="mdi-chat"
              @click="openLink('https://discord.com/invite/qkxjGEp3Tg')"
            >
              {{ languageStore.t('contact.discord') }}
            </v-btn>
          </v-col>
          <v-col cols="12" class="mt-1">
            <v-btn
              block
              color="pink-accent-1"
              variant="tonal"
              prepend-icon="mdi-heart"
              @click="forceShowRatingPrompt"
            >
              {{ languageStore.t('navigation.rateApp') }}
            </v-btn>
          </v-col>
        </v-row>

        <v-expansion-panels multiple>
          <v-expansion-panel v-for="section in sections" :key="section.key">
            <v-expansion-panel-title>
              <v-icon class="me-2" color="primary">mdi-play-circle-outline</v-icon>
              {{ languageStore.t(`helpPage.sections.${section.key}.title`) }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="mb-4">
                {{ languageStore.t(`helpPage.sections.${section.key}.description`) }}
              </p>
              <div class="video-wrapper">
                <iframe
                  :title="languageStore.t(`helpPage.sections.${section.key}.title`)"
                  :src="`https://www.youtube.com/embed/${section.videoId}`"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-divider class="my-6"></v-divider>

        <AppPromotionActions />
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: defaultLayout
  title: "helpPage.title"
</route>

<script setup>
import { useLanguageStore } from '@/stores/languageStore';
import AppPromotionActions from '@/components/general/AppPromotionActions.vue';
import { forceShowRatingPrompt } from '@/utils/appRating';

const languageStore = useLanguageStore();

const openLink = (url) => {
  window.open(url, '_blank');
};

const sections = [
  { key: 'overview', videoId: 'RJfGFYFyhtY' },
  { key: 'firstStart', videoId: 'P1ubA9WdcB0' },
  { key: 'shoppingList', videoId: '50lZCo3NloU' },
  { key: 'planner', videoId: 'NyI0AMdiOv8' },
  { key: 'calorieCounter', videoId: '7WpPp_Od2RQ' },
  { key: 'training', videoId: 'M6yLAGcgTls' },
  { key: 'settings', videoId: 'HlO8hwXMVrc' },
];

</script>

<style scoped>
.video-wrapper {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: 12px;
  background-color: #000;
}

.video-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
