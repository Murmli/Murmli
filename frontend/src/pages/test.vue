<template>
  <!-- Go to Test Button-->
  <v-btn :to="'/test'" color="primary" outlined>Go to Test</v-btn>

  <!-- GPS-->
  <v-btn @click="getLocation" color="secondary" outlined>Get GPS Location</v-btn>
  <div v-if="location">
    <p>Latitude: {{ location.latitude }}</p>
    <p>Longitude: {{ location.longitude }}</p>
  </div>

  <!-- Picture-->
  <v-btn @click="takePicture" color="success" outlined>Take Picture</v-btn>
  <div v-if="photoData">
    <img :src="photoData" alt="Captured photo" style="max-width: 100%;" />
  </div>

  <!-- no gutters wichtig!!! ansosnten verrschiebung -->
  <div class="bg-surface-variant mb-6">
    <v-row align="start" style="height: 150px;" no-gutters>
      <v-col v-for="n in 3" :key="n">
        <v-sheet class="pa-2 ma-2">
          .align-start
        </v-sheet>
      </v-col>
    </v-row>
  </div>

  <!-- Change Langauge-->
  <div>
    <!-- Buttons zum Sprachwechsel -->
    <v-btn @click="changeLanguage('en')">English</v-btn>
    <v-btn @click="changeLanguage('de')">Deutsch</v-btn>

    <!-- Texte anzeigen -->
    <p>{{ languageStore.t('greeting') }}</p>
    <p>{{ languageStore.t('goodbye') }}</p>

  </div>

  <div>
    <v-btn @click="resetAll">Alle Daten löschen</v-btn>
  </div>

  <!-- Welome Window -->
  <WelcomeWindow />
</template>

<route lang="yaml">
  meta:
    layout: defaultLayout
    bgColor: yellow
</route>

<script setup>
import { ref } from 'vue'
import { useLanguageStore } from '@/stores/languageStore'

const languageStore = useLanguageStore()

// Ref für Standortdaten
const location = ref(null)

// Ref für das Bild
const photoData = ref(null)

// Funktion zur Abfrage des GPS-Standorts
const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        location.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      },
      error => {
        console.error("Error fetching location:", error)
      }
    )
  } else {
    console.error("Geolocation is not supported by this browser.")
  }
}

// Funktion zur Aufnahme eines Bildes mit der Kamera
const takePicture = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    const video = document.createElement("video") // Korrektur hier
    video.srcObject = stream
    await video.play()

    // Canvas zur Aufnahme des Bildes erstellen
    const canvas = document.createElement("canvas") // Korrektur hier
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext("2d") // Korrektur hier
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Stoppe den Videostream und speichere das Bild
    stream.getTracks().forEach(track => track.stop())
    photoData.value = canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Error capturing photo:", error)
  }
}

// Funktion zur Sprachauswahl
const changeLanguage = (locale) => {
  languageStore.setLocale(locale)
}

// Reset Function
const resetAll = () => {
  localStorage.removeItem("appLocale")
  localStorage.removeItem("sessionToken")
  localStorage.removeItem("shoppingListId")
  localStorage.removeItem("showPlannerHelpWindow")
  localStorage.removeItem("showRecipesHelpWindow")
  localStorage.removeItem("showWelcomeWindow")

  window.location.reload()
}

</script>
