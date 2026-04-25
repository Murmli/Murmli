<template>
  <v-dialog v-model="dialog" max-width="500px">
    <template v-slot:activator="{ props }">
      <v-text-field
        v-model="internalValue"
        :label="label"
        prepend-inner-icon="mdi-image-search"
        readonly
        v-bind="props"
        @click="dialog = true"
      >
        <template v-slot:append-inner>
          <v-icon :icon="internalValue || 'mdi-help-circle-outline'"></v-icon>
        </template>
      </v-text-field>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center">
        <span>{{ languageStore.t('tracker.menu.editIcon') || 'Icon wählen' }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="search"
          label="Suchen..."
          prepend-inner-icon="mdi-magnify"
          clearable
          class="mb-4"
        ></v-text-field>
        <v-row dense class="icon-grid">
          <v-col
            v-for="icon in filteredIcons"
            :key="icon"
            cols="3"
            class="d-flex justify-center pa-2"
          >
            <v-btn
              icon
              variant="tonal"
              :color="internalValue === icon ? 'primary' : ''"
              @click="selectIcon(icon)"
            >
              <v-icon :icon="icon"></v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';

import mdiIcons from '@/assets/mdi-icons.json';

const props = defineProps({
  modelValue: {
    type: String,
    default: 'mdi-food'
  },
  label: {
    type: String,
    default: 'Icon'
  }
});

const emit = defineEmits(['update:modelValue']);

const languageStore = useLanguageStore();
const dialog = ref(false);
const search = ref('');
const internalValue = ref(props.modelValue);

watch(() => props.modelValue, (newVal) => {
  internalValue.value = newVal;
});

const rawCommonIcons = [
  'mdi-apple', 'mdi-banana', 'mdi-bread-slice', 'mdi-carrot', 'mdi-cheese', 'mdi-chicken', 'mdi-coffee', 
  'mdi-corn', 'mdi-egg', 'mdi-fish', 'mdi-food-apple', 'mdi-food-croissant', 'mdi-food-drumstick', 
  'mdi-food-fork-drink', 'mdi-food-hot-dog', 'mdi-food-steak', 'mdi-food-variant', 'mdi-fruit-cherries', 
  'mdi-fruit-citrus', 'mdi-fruit-grapes', 'mdi-fruit-pineapple', 'mdi-fruit-watermelon', 'mdi-hamburger', 
  'mdi-ice-cream', 'mdi-leaf', 'mdi-muffin', 'mdi-noodles', 'mdi-pasta', 'mdi-pizza', 'mdi-popcorn', 
  'mdi-rice', 'mdi-sausage', 'mdi-shrimp', 'mdi-silverware', 'mdi-silverware-fork-knife', 'mdi-taco', 
  'mdi-tea', 'mdi-turkey', 'mdi-water', 'mdi-wine-glass', 'mdi-candy', 'mdi-cookie', 'mdi-cupcake',
  'mdi-donut', 'mdi-egg-fried', 'mdi-food', 'mdi-food-halal', 'mdi-food-kosher', 'mdi-honey',
  'mdi-jam', 'mdi-mushroom', 'mdi-olive', 'mdi-peanut', 'mdi-pepper-hot', 'mdi-pot', 'mdi-seed',
  'mdi-soy-sauce', 'mdi-spoon-sugar', 'mdi-strawberry', 'mdi-vanilla', 'mdi-baguette', 'mdi-bowl-mix',
  'mdi-bowl-rice', 'mdi-burrito', 'mdi-cake-variant', 'mdi-can', 'mdi-cheese-off', 'mdi-chili-hot',
  'mdi-cookie-outline', 'mdi-egg-off', 'mdi-food-outline', 'mdi-kebab-dine', 'mdi-liquor', 'mdi-milk',
  'mdi-omelette', 'mdi-pancake', 'mdi-pie', 'mdi-pizza-outline', 'mdi-pretzel', 'mdi-pumpkin',
  'mdi-salad', 'mdi-shaker', 'mdi-snowflake', 'mdi-steak', 'mdi-wheat', 'mdi-yogurt'
];

const commonIcons = computed(() => {
  return rawCommonIcons.filter(icon => mdiIcons.includes(icon));
});

const filteredIcons = computed(() => {
  if (!search.value) return commonIcons.value;
  const searchTerm = search.value.toLowerCase();
  return mdiIcons.filter(icon => icon.toLowerCase().includes(searchTerm)).slice(0, 100);
});

const selectIcon = (icon) => {
  internalValue.value = icon;
  emit('update:modelValue', icon);
  dialog.value = false;
};
</script>

<style scoped>
.icon-grid {
  max-height: 400px;
  overflow-y: auto;
}
</style>
