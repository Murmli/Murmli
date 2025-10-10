<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="primary" prominent app class="pt-5 mb-3">
      <v-toolbar-title>Murmli</v-toolbar-title>
    </v-app-bar>

    <!-- No side drawer -->

    <!-- Content -->
    <v-main class="fill-height d-flex flex-column">
      <v-container fluid class="fill-height d-flex flex-column">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
</script>

