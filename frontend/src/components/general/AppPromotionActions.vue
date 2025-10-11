<template>
  <div>
    <v-row class="d-flex justify-center mb-3">
      <v-chip
        class="px-4"
        color="primary"
        text-color="white"
        variant="elevated"
        prepend-icon="mdi-heart"
        @click="openLink('https://play.google.com/store/apps/details?id=de.murmli.twa')"
      >
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
  </div>
</template>

<script setup>
import { useLanguageStore } from '@/stores/languageStore';

const languageStore = useLanguageStore();

const openLink = (url) => {
  window.open(url, '_blank');
};

const shareApp = () => {
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=de.murmli.twa';

  if (navigator.share) {
    navigator.share({ title: 'Murmli', url: playStoreUrl });
  } else {
    navigator.clipboard.writeText(playStoreUrl);
    alert('Copied to the clipboard!');
  }
};
</script>
