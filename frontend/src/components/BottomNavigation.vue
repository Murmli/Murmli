<template>

    <!-- Floating action for secondary actions (rate/share/links) -->
    <v-btn icon elevation="8" class="position-fixed floating-more-btn" @click="moreOpen = true">
        <v-icon>mdi-dots-horizontal</v-icon>
    </v-btn>

    <!-- Bottom sheet: per-layout actions if provided, otherwise fallback actions -->
    <v-bottom-sheet v-model="moreOpen" inset>
        <v-card class="pa-2">
            <template v-if="bottomMenuStore.items.length">
                <v-list>
                    <v-list-item v-for="(item, index) in bottomMenuStore.items" :key="index"
                        @click="item.action && item.action(); moreOpen = false">
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item>
                    <v-divider class="my-1" />
                    <v-list-item @click="goHelp(); moreOpen = false">
                        <template #prepend>
                            <v-icon>mdi-help-circle-outline</v-icon>
                        </template>
                        <v-list-item-title>{{ languageStore.t('general.help') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="goSettings(); moreOpen = false">
                        <template #prepend>
                            <v-icon>mdi-cog-outline</v-icon>
                        </template>
                        <v-list-item-title>{{ languageStore.t('settings.title') }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </template>
            <template v-else>
                <v-row class="d-flex justify-center mb-3">
                    <v-chip class="px-4" color="primary" text-color="white" variant="elevated"
                        prepend-icon="mdi-heart"
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

                    <v-btn icon variant="text"
                        @click="openLink('mailto:prompt-engineered@protonmail.com?subject=Murmli%20App')">
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
                <v-row class="d-flex justify-center mt-2">
                    <v-btn variant="tonal" prepend-icon="mdi-help-circle-outline" @click="goHelp(); moreOpen = false">
                        {{ languageStore.t('general.help') }}
                    </v-btn>
                </v-row>
                <v-row class="d-flex justify-center mt-2">
                    <v-btn variant="tonal" prepend-icon="mdi-cog-outline" @click="goSettings(); moreOpen = false">
                        {{ languageStore.t('settings.title') }}
                    </v-btn>
                </v-row>
            </template>
        </v-card>
    </v-bottom-sheet>

    <!-- New bottom navigation that mirrors the routes from the old list -->
    <v-bottom-navigation v-model="current" grow height="60" class="position-fixed bottom-0 w-100">
        <template v-for="item in items" :key="item.value">
            <v-tooltip :text="item.label" location="top">
                <template #activator="{ props }">
                    <v-btn v-bind="props" :value="item.value" variant="text" :aria-label="item.label"
                        :aria-current="current === item.value ? 'page' : undefined">
                        <v-icon size="large" :color="current === item.value ? item.color : 'grey-darken-1'">
                            {{ item.icon }}
                        </v-icon>
                    </v-btn>
                </template>
            </v-tooltip>
        </template>
    </v-bottom-navigation>
</template>

<script setup>
// Using Composition API with Vuetify 3 and Pinia
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLanguageStore } from '@/stores/languageStore'
import { useBottomMenuStore } from '@/stores/bottomMenuStore'

const languageStore = useLanguageStore()
const bottomMenuStore = useBottomMenuStore()
const router = useRouter()
const route = useRoute()

// Mirror the old navigation structure as bottom-nav items
const items = computed(() => [
    {
        label: languageStore.t('navigation.recipes'),
        value: '/recipes',
        icon: 'mdi-book-open-page-variant',
        color: 'amber-darken-2'
    },
    {
        label: languageStore.t('navigation.planner'),
        value: '/planner',
        icon: 'mdi-calendar-month',
        color: 'purple-darken-2'
    },
    {
        label: languageStore.t('navigation.shoppingList'),
        value: '/',
        icon: 'mdi-cart-outline',
        color: 'blue-darken-2'
    },
    {
        label: languageStore.t('trainingPlans.title'),
        value: '/trainingPlans',
        icon: 'mdi-dumbbell',
        color: 'red-darken-2'
    },
    {
        label: languageStore.t('navigation.calorieCounter'),
        value: '/tracker',
        icon: 'mdi-fire',
        color: 'green-darken-2'
    }
])

// Keep the bottom navigation in sync with the current route
const current = ref(route.path)

// When the user taps a nav item, navigate to that route
watch(current, val => {
    if (val && val !== route.path) router.push(val)
})

// When the route changes (programmatic or via other UI), update the nav
watch(
    () => route.path,
    path => {
        if (path !== current.value) current.value = path
    },
    { immediate: true }
)


// Helpers for fallback actions
const openLink = url => {
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

// Controls the bottom sheet visibility
const moreOpen = ref(false)

const goSettings = () => {
    router.push('/settings')
}

const goHelp = () => {
    router.push('/help')
}

</script>

<style scoped>
.floating-more-btn {
    right: 16px;
    bottom: 96px;
    z-index: 2000;
}
</style>
