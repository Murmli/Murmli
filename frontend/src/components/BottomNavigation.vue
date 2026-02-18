<template>

    <!-- Floating action for secondary actions (rate/share/links) -->
    <v-btn v-if="hasBottomMenuItems" icon elevation="8" class="position-fixed floating-more-btn"
        @click="moreOpen = true">
        <v-icon>mdi-dots-horizontal</v-icon>
    </v-btn>

    <!-- Bottom sheet: per-layout actions if provided, otherwise fallback actions -->
    <v-bottom-sheet v-if="hasBottomMenuItems" v-model="moreOpen" inset>
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
        </v-card>
    </v-bottom-sheet>

    <!-- New bottom navigation that mirrors the routes from the old list -->
    <v-bottom-navigation v-model="current" grow height="60" class="px-7 app-bottom-navigation">
        <template v-for="item in items" :key="item.value">
            <v-btn :value="item.value" variant="text" :aria-label="item.label"
                :aria-current="current === item.value ? 'page' : undefined">
                <v-icon size="large" :color="current === item.value ? item.color : 'grey-darken-1'">
                    {{ item.icon }}
                </v-icon>
            </v-btn>
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

const hasBottomMenuItems = computed(() => bottomMenuStore.items.length > 0)

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

const scrollToTop = () => {
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' })
    }
}

// When the user taps a nav item, navigate to that route
watch(current, val => {
    if (val && val !== route.path) router.push(val)
})

// When the route changes (programmatic or via other UI), update the nav
watch(
    () => route.path,
    (path, previousPath) => {
        if (path !== current.value) current.value = path
        if (previousPath && path !== previousPath) scrollToTop()
    },
    { immediate: true }
)

// Controls the bottom sheet visibility
const moreOpen = ref(false)

const goSettings = () => {
    router.push('/settings')
}

const goHelp = () => {
    router.push('/help')
}

watch(hasBottomMenuItems, value => {
    if (!value) moreOpen.value = false
})

</script>

<style scoped>
.floating-more-btn {
    right: 16px;
    bottom: 96px;
    z-index: 2000;
}

/* Add padding for iOS safe area and Android 3-button navigation */
.app-bottom-navigation {
    padding-bottom: max(env(safe-area-inset-bottom, 0px), constant(safe-area-inset-bottom, 0px));
}

/* Fallback for older devices without safe-area support */
@supports not (padding-bottom: env(safe-area-inset-bottom)) {
    .app-bottom-navigation {
        padding-bottom: 16px;
    }
}
</style>
