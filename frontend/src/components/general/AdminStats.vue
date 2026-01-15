<template>
  <div class="admin-stats-container">
    <v-row>
      <!-- Growth Section -->
      <v-col cols="12" md="4">
        <v-card class="h-100" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-account-plus</v-icon>
            {{ languageStore.t('adminStats.growth') }}
          </v-card-title>
          <v-card-text>
            <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.usersToday') }}
              </div>
              <div class="d-flex align-center">
                <span class="text-h6 mr-2">{{ stats.usersToday ?? '-' }}</span>
                <v-chip
                  v-if="stats.usersTodayDiff !== undefined"
                  :color="diffColor(stats.usersTodayDiff)"
                  size="x-small"
                  label
                >
                  <v-icon start size="x-small">{{ diffIcon(stats.usersTodayDiff) }}</v-icon>
                  {{ formatDiff(stats.usersTodayDiff) }}
                </v-chip>
              </div>
            </div>

            <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.usersLast7Days') }}
              </div>
              <div class="d-flex align-center">
                <span class="text-h6 mr-2">{{ stats.usersLast7Days ?? '-' }}</span>
                <v-chip
                  v-if="stats.usersLast7DaysDiff !== undefined"
                  :color="diffColor(stats.usersLast7DaysDiff)"
                  size="x-small"
                  label
                >
                  <v-icon start size="x-small">{{ diffIcon(stats.usersLast7DaysDiff) }}</v-icon>
                  {{ formatDiff(stats.usersLast7DaysDiff) }}
                </v-chip>
              </div>
            </div>

            <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.usersLast30Days') }}
              </div>
              <div class="d-flex align-center">
                <span class="text-h6 font-weight-bold mr-2">{{ stats.usersLast30Days ?? '-' }}</span>
              </div>
            </div>

            <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.usersLast90Days') }}
              </div>
              <div class="d-flex align-center">
                <span class="text-h6 font-weight-bold mr-2">{{ stats.usersLast90Days ?? '-' }}</span>
              </div>
            </div>

             <div class="stat-item">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.usersWeek') }}
              </div>
              <div class="d-flex align-center">
                <span class="text-h6 mr-2">{{ stats.usersThisWeek ?? '-' }}</span>
                 <v-chip
                  v-if="stats.usersThisWeekDiff !== undefined"
                  :color="diffColor(stats.usersThisWeekDiff)"
                  size="x-small"
                  label
                >
                  <v-icon start size="x-small">{{ diffIcon(stats.usersThisWeekDiff) }}</v-icon>
                  {{ formatDiff(stats.usersThisWeekDiff) }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Activity Section -->
      <v-col cols="12" md="4">
        <v-card class="h-100" elevation="2">
          <v-card-title class="d-flex align-center">
             <v-icon color="success" class="mr-2">mdi-chart-line</v-icon>
            {{ languageStore.t('adminStats.activity') }}
          </v-card-title>
          <v-card-text>
            <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.activeToday') }}
              </div>
              <div class="d-flex align-center">
                <span class="text-h6 mr-2">{{ stats.activeUsersToday ?? '-' }}</span>
                <v-chip
                  v-if="stats.activeUsersTodayDiff !== undefined"
                  :color="diffColor(stats.activeUsersTodayDiff)"
                  size="x-small"
                  label
                >
                  <v-icon start size="x-small">{{ diffIcon(stats.activeUsersTodayDiff) }}</v-icon>
                  {{ formatDiff(stats.activeUsersTodayDiff) }}
                </v-chip>
              </div>
            </div>

            <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.activeWeek') }}
              </div>
              <div class="d-flex align-center">
                <span class="text-h6 mr-2">{{ stats.activeUsersThisWeek ?? '-' }}</span>
                 <v-chip
                  v-if="stats.activeUsersThisWeekDiff !== undefined"
                  :color="diffColor(stats.activeUsersThisWeekDiff)"
                  size="x-small"
                  label
                >
                  <v-icon start size="x-small">{{ diffIcon(stats.activeUsersThisWeekDiff) }}</v-icon>
                  {{ formatDiff(stats.activeUsersThisWeekDiff) }}
                </v-chip>
              </div>
            </div>

            <v-divider class="my-3"></v-divider>
             <div class="stat-item mb-2">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.plannerToday') }}
              </div>
               <div class="d-flex align-center">
                  <span class="text-body-1 mr-2">{{ stats.plannerUsersToday ?? '-' }}</span>
                   <span :class="diffClass(stats.plannerUsersTodayDiff)" class="text-caption">({{ formatDiff(stats.plannerUsersTodayDiff) }})</span>
               </div>
            </div>
             <div class="stat-item">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.calorieTrackerToday') }}
              </div>
               <div class="d-flex align-center">
                  <span class="text-body-1 mr-2">{{ stats.calorieTrackerUsersToday ?? '-' }}</span>
                   <span :class="diffClass(stats.calorieTrackerUsersTodayDiff)" class="text-caption">({{ formatDiff(stats.calorieTrackerUsersTodayDiff) }})</span>
               </div>
            </div>


          </v-card-text>
        </v-card>
      </v-col>

      <!-- Smart Insights Section -->
      <v-col cols="12">
        <v-card class="h-100" elevation="3" rounded="lg">
          <v-card-item class="bg-deep-purple-lighten-5 py-4">
             <template v-slot:prepend>
               <v-avatar color="deep-purple-lighten-4" rounded="0">
                 <v-icon color="deep-purple-darken-2">mdi-brain</v-icon>
               </v-avatar>
             </template>
            <v-card-title class="text-deep-purple-darken-3 font-weight-bold">
              {{ languageStore.t('adminStats.smartInsights') }}
            </v-card-title>
          </v-card-item>

          <v-card-text class="pt-6">
            <v-row>
              <!-- AI Efficiency -->
              <v-col cols="12" md="4">
                <v-sheet class="d-flex align-center pa-4 bg-grey-lighten-4 rounded-lg h-100">
                  <v-avatar color="white" size="48" class="elevation-1 mr-4">
                     <v-icon color="success" size="28">mdi-molecule</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">
                      {{ languageStore.t('adminStats.aiCacheSaved') }}
                    </div>
                    <div class="text-h5 font-weight-bold ml-1">
                      {{ stats.cacheSavedTotal ?? 0 }}
                    </div>
                  </div>
                </v-sheet>
              </v-col>
              
              <!-- Stickiness -->
              <v-col cols="12" md="4">
                 <v-sheet class="d-flex align-center pa-4 bg-grey-lighten-4 rounded-lg h-100 position-relative">
                   <div class="mr-4 position-relative">
                      <v-progress-circular
                        :model-value="stats.stickiness ?? 0"
                        :color="stats.stickiness > 20 ? 'success' : 'warning'"
                        size="56"
                        width="6"
                        bg-color="grey-lighten-2"
                      >
                        <span class="text-subtitle-2 font-weight-bold">{{ stats.stickiness }}%</span>
                      </v-progress-circular>
                   </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1 d-flex align-center">
                      {{ languageStore.t('adminStats.stickiness') }}
                      <v-tooltip location="top">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" size="x-small" class="ml-1" color="grey">mdi-help-circle-outline</v-icon>
                          </template>
                          <span>{{ languageStore.t('adminStats.stickinessHint') }}</span>
                      </v-tooltip>
                    </div>
                    <div class="text-caption font-weight-medium">
                       MAU: {{ stats.activeUsersMonthly ?? 0 }}
                    </div>
                  </div>
                </v-sheet>
              </v-col>

              <!-- Feedback -->
              <v-col cols="12" md="4">
                 <v-sheet 
                    class="d-flex align-center pa-4 rounded-lg h-100 cursor-pointer transition-swing" 
                    :class="stats.unreadFeedback > 0 ? 'bg-orange-lighten-5' : 'bg-grey-lighten-4'"
                    v-ripple
                 >
                   <v-badge 
                      :content="stats.unreadFeedback" 
                      color="error" 
                      :model-value="stats.unreadFeedback > 0"
                      location="top end"
                      offset-x="10"
                      offset-y="10"
                      class="mr-4"
                   >
                     <v-avatar color="white" size="48" class="elevation-1">
                        <v-icon :color="stats.unreadFeedback > 0 ? 'orange-darken-2' : 'grey'" size="28">
                            {{ stats.unreadFeedback > 0 ? 'mdi-message-alert' : 'mdi-message-check' }}
                        </v-icon>
                     </v-avatar>
                   </v-badge>
                   
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">
                      {{ languageStore.t('adminStats.unreadFeedback') }}
                    </div>
                   <div class="text-h5 font-weight-bold ml-1" :class="{'text-orange-darken-3': stats.unreadFeedback > 0}">
                       {{ stats.unreadFeedback ?? 0 }}
                   </div>
                  </div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Content Section -->
      <v-col cols="12" md="4">
        <v-card class="h-100" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon color="info" class="mr-2">mdi-database</v-icon>
            {{ languageStore.t('adminStats.content') }}
          </v-card-title>
          <v-card-text>
             <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.recipes24h') }}
              </div>
              <span class="text-h6">{{ stats.recipesLast24h ?? '-' }}</span>
            </div>

             <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.trainingPlans24h') }}
              </div>
              <span class="text-h6">{{ stats.trainingPlansLast24h ?? '-' }}</span>
            </div>

            <div class="stat-item mb-3">
              <div class="text-caption text-medium-emphasis">
                {{ languageStore.t('adminStats.trainingLogsWeek') }}
              </div>
               <div class="d-flex align-center">
                <span class="text-h6 mr-2">{{ stats.trainingLogsThisWeek ?? '-' }}</span>
                  <v-chip
                  v-if="stats.trainingLogsThisWeekDiff !== undefined"
                  :color="diffColor(stats.trainingLogsThisWeekDiff)"
                  size="x-small"
                  label
                >
                  <v-icon start size="x-small">{{ diffIcon(stats.trainingLogsThisWeekDiff) }}</v-icon>
                  {{ formatDiff(stats.trainingLogsThisWeekDiff) }}
                </v-chip>
               </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Detailed Breakdown (Optional/Collapsible or simply additional rows) -->
       <v-col cols="12">
           <v-expansion-panels>
               <v-expansion-panel>
                   <v-expansion-panel-title>{{ languageStore.t('adminStats.details') || 'Details' }}</v-expansion-panel-title>
                   <v-expansion-panel-text>
                        <v-row dense>
                             <v-col cols="12" sm="6" md="4">
                                {{ languageStore.t('adminStats.plannerUsersTotal') }}: {{ stats.plannerUsersTotal ?? '-' }}
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                {{ languageStore.t('adminStats.calorieTrackerTotal') }}: {{ stats.calorieTrackerUsersTotal ?? '-' }}
                            </v-col>
                             <v-col cols="12" sm="6" md="4">
                                {{ languageStore.t('adminStats.shoppingUpdatedToday') }}: {{ stats.shoppingListUsersToday ?? '-' }}
                                 <span :class="diffClass(stats.shoppingListUsersTodayDiff)">({{ formatDiff(stats.shoppingListUsersTodayDiff) }})</span>
                            </v-col>
                        </v-row>
                   </v-expansion-panel-text>
               </v-expansion-panel>
           </v-expansion-panels>
       </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useLanguageStore } from '@/stores/languageStore';

const apiStore = useApiStore();
const languageStore = useLanguageStore();

const stats = ref({});

const formatDiff = (val) => {
  if (val > 0) return `+${val}`;
  return String(val);
};

const diffClass = (val) => {
  if (val > 0) return 'text-success';
  if (val < 0) return 'text-error';
  return '';
};

const diffColor = (val) => {
    if (val > 0) return 'success';
    if (val < 0) return 'error';
    return undefined; // default
}

const diffIcon = (val) => {
    if (val > 0) return 'mdi-arrow-up';
    if (val < 0) return 'mdi-arrow-down';
    return 'mdi-minus';
}

onMounted(async () => {
  const response = await apiStore.apiRequest('get', '/system/stats');
  if (response && response.status === 200) {
    stats.value = response.data;
  }
});
</script>

<style scoped>
.stat-item {
    line-height: 1.2;
}
</style>
