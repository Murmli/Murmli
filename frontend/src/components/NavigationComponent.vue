<template>
    <div class="d-flex flex-column h-100">
        <!-- Display navigationItems -->
        <v-list>
            <v-list-item v-for="(item, index) in navigationItems" :key="index" :to="item.route" link>
                <v-list-item-title>{{ item.text }}</v-list-item-title>
                <template v-slot:prepend>
                    <v-icon :icon="item.icon" :color="item.color"></v-icon>
                </template>
            </v-list-item>
        </v-list>

        <!-- Spacer to push content to bottom -->
        <v-spacer></v-spacer>

        <!-- App Rating Chip -->
        <v-row class="d-flex justify-center" style="max-height: 50px;">
            <v-chip class="px-4" color="primary" text-color="white" variant="elevated" prepend-icon="mdi-heart"
                @click="openLink('https://play.google.com/store/apps/details?id=de.murmli.twa')">
                {{ languageStore.t('navigation.rateApp') }}
            </v-chip>
        </v-row>

        <!-- Bottom Shortcuts: 5 icons in a row -->
        <v-row class="d-flex align-end mb-10" style="max-height: 50px;">
            <v-col class="d-flex justify-center">
                <v-icon class="mx-1" icon="mdi-share-variant-outline" @click="shareApp"></v-icon>
                <v-icon class="mx-1" color="cyan-darken-2" icon="mdi-email-outline"
                    @click="openLink('mailto:prompt-engineered@protonmail.com?subject=Murmli%20App')"></v-icon>
                <v-icon class="mx-1" color="deep-purple-accent-2" icon="mdi-chat"
                    @click="openLink('https://discord.com/invite/qkxjGEp3Tg')"></v-icon>
                <v-icon class="mx-1" color="red" icon="mdi-reddit"
                    @click="openLink('https://www.reddit.com/r/Murmli/')"></v-icon>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';

const languageStore = useLanguageStore();

const navigationItems = computed(() => [
    {
        text: languageStore.t('navigation.shoppingList'),
        route: '/',
        icon: 'mdi-cart-outline',
        color: 'blue-darken-2'
    },
    {
        text: languageStore.t('navigation.recipes'),
        route: '/recipes',
        icon: 'mdi-book-open-page-variant',
        color: 'amber-darken-2'
    },
    {
        text: languageStore.t('navigation.planner'),
        route: '/planner',
        icon: 'mdi-calendar-month',
        color: 'purple-darken-2'
    },
    {
        text: languageStore.t('navigation.calorieCounter'),
        route: '/tracker',
        icon: 'mdi-food-apple',
        color: 'green-darken-2'
    },
    {
        text: languageStore.t('trainingPlans.title'),
        route: '/trainingPlans',
        icon: 'mdi-dumbbell',
        color: 'red-darken-2'
    },
    {
        text: languageStore.t('navigation.settings'),
        route: '/settings',
        icon: 'mdi-cog-outline',
        color: 'grey-darken-2'
    },
]);

// Open a new window with a given URL
const openLink = (url) => {
    window.open(url, '_blank');
};

// Share functionality
const shareApp = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=de.murmli.twa';

    if (navigator.share) {
        navigator.share({
            title: 'Murmli',
            url: playStoreUrl
        });
    } else {
        navigator.clipboard.writeText(playStoreUrl);
        alert('Copied to the clipboard!');
    }
};
</script>