<template>
  <div class="admin-stats-container">
    <v-card elevation="2" class="rounded-lg mb-4">
      <v-card-title class="d-flex justify-space-between align-center py-2 px-4">
        <span class="text-subtitle-1 font-weight-bold">{{ languageStore.t('adminStats.title') }}</span>
        <div class="d-flex align-center">
          <v-btn icon="mdi-refresh" variant="text" density="comfortable" :loading="loading" @click="fetchStats"></v-btn>
        </div>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-table density="compact" class="stats-table">
        <thead>
          <tr>
            <th class="text-left py-2">{{ languageStore.t('adminStats.metric') || 'Metrik' }}</th>
            <th class="text-center">{{ languageStore.t('adminStats.period24h') }}</th>
            <th class="text-center">{{ languageStore.t('adminStats.period7d') }}</th>
            <th class="text-center">{{ languageStore.t('adminStats.period30d') }}</th>
          </tr>
        </thead>
        <tbody v-if="!loading">
          <tr v-for="metric in mainMetrics" :key="metric.key">
            <td class="font-weight-medium">
              {{ languageStore.t('adminStats.' + metric.key) }}
            </td>
            <td class="text-center">
              <div class="d-flex flex-column align-center">
                <span class="text-body-2">{{ stats.metrics?.['24h']?.[metric.key]?.current ?? 0 }}</span>
                <span :class="getTrendClass(stats.metrics?.['24h']?.[metric.key]?.diff)" class="text-caption font-weight-bold">
                  {{ formatDiff(stats.metrics?.['24h']?.[metric.key]?.diff) }}
                </span>
              </div>
            </td>
            <td class="text-center">
              <div class="d-flex flex-column align-center">
                <span class="text-body-2">{{ stats.metrics?.['7d']?.[metric.key]?.current ?? 0 }}</span>
                <span :class="getTrendClass(stats.metrics?.['7d']?.[metric.key]?.diff)" class="text-caption font-weight-bold">
                  {{ formatDiff(stats.metrics?.['7d']?.[metric.key]?.diff) }}
                </span>
              </div>
            </td>
            <td class="text-center">
              <div class="d-flex flex-column align-center">
                <span class="text-body-2">{{ stats.metrics?.['30d']?.[metric.key]?.current ?? 0 }}</span>
                <span :class="getTrendClass(stats.metrics?.['30d']?.[metric.key]?.diff)" class="text-caption font-weight-bold">
                  {{ formatDiff(stats.metrics?.['30d']?.[metric.key]?.diff) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <v-divider></v-divider>

      <!-- Global / Smart Insights - Compact -->
      <v-card-text class="pa-3 bg-grey-lighten-4">
        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Total Users</div>
            <div class="text-body-2 font-weight-bold">{{ stats.global?.totalUsers ?? 0 }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Stickiness (DAU/MAU)</div>
            <div class="text-body-2 font-weight-bold" :class="getStickinessClass(stats.global?.stickiness)">
              {{ stats.global?.stickiness ?? 0 }}%
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">AI Cache Saved</div>
            <div class="text-body-2 font-weight-bold text-success">{{ stats.global?.cacheSavedTotal ?? 0 }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div 
              class="text-caption text-medium-emphasis cursor-pointer" 
              @click="showFeedbackDialog = true"
            >
              Unread Feedback
              <v-badge 
                v-if="stats.global?.unreadFeedback > 0" 
                :content="stats.global.unreadFeedback" 
                color="error" 
                inline
                density="compact"
              ></v-badge>
            </div>
            <div class="text-body-2 font-weight-bold" :class="stats.global?.unreadFeedback > 0 ? 'text-error' : ''">
              {{ stats.global?.unreadFeedback ?? 0 }}
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Feedback Dialog -->
    <AdminFeedbackDialog 
      v-model="showFeedbackDialog" 
      @refresh-stats="fetchStats"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useLanguageStore } from '@/stores/languageStore';
import AdminFeedbackDialog from './AdminFeedbackDialog.vue';

const apiStore = useApiStore();
const languageStore = useLanguageStore();

const stats = ref({});
const loading = ref(true);
const showFeedbackDialog = ref(false);

const mainMetrics = [
  { key: 'newUsers' },
  { key: 'activeUsers' },
  { key: 'calorieTrackers' },
  { key: 'shoppingLists' },
  { key: 'generatedRecipes' },
  { key: 'plannerUsage' },
  { key: 'trainingPlans' },
  { key: 'trainingLogs' },
];

const formatDiff = (val) => {
  if (val === undefined || val === 0) return '0';
  return val > 0 ? `+${val}` : String(val);
};

const getTrendClass = (val) => {
  if (!val || val === 0) return 'text-grey';
  return val > 0 ? 'text-success' : 'text-error';
};

const getStickinessClass = (val) => {
  if (val > 20) return 'text-success';
  if (val > 10) return 'text-warning';
  return 'text-error';
};

const fetchStats = async () => {
  loading.value = true;
  try {
    const response = await apiStore.apiRequest('get', '/system/stats');
    if (response && response.status === 200) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchStats();
});
</script>

<style scoped>
.stats-table :deep(th) {
  font-size: 0.75rem !important;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.6) !important;
  background-color: #f5f5f5;
}
.stats-table :deep(td) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
  padding: 4px 8px !important;
}
.stats-table tbody tr:hover {
  background-color: #fafafa;
}
</style>
