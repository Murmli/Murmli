<template>
  <v-container class="d-flex justify-center align-center">
    <v-card class="pa-6 text-center" elevation="4" max-width="400">
      <v-card-title class="text-h5 font-weight-bold">
        {{ languageStore.t("contact.title") }}
      </v-card-title>
      <v-card-subtitle class="mb-4">
        {{ languageStore.t("contact.subtitle") }}
      </v-card-subtitle>

      <v-btn block color="primary" class="mb-3" :href="mailtoLink" target="_blank">
        📧 {{ languageStore.t("contact.email") }}
      </v-btn>

      <v-btn block color="secondary" class="mb-3" :href="discordLink" target="_blank">
        🎮 {{ languageStore.t("contact.discord") }}
      </v-btn>

      <v-card-text class="text-caption">
        {{ languageStore.t("contact.footer") }}
      </v-card-text>
    </v-card>
  </v-container>
</template>

<route lang="yaml">
  meta:
    layout: defaultLayout
    title: "settings.title"
</route>

<script setup>
import { useLanguageStore } from "@/stores/languageStore";

const languageStore = useLanguageStore();
const mailtoLink = "mailto:prompt-engineered@protonmail.com?subject=Murmli%20App";
const discordLink = "https://discord.com/invite/qkxjGEp3Tg";
</script>
