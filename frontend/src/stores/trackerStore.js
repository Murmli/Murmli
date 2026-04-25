import { defineStore } from "pinia";
import { useApiStore } from "./apiStore";
import { useLanguageStore } from '@/stores/languageStore';
import { cache } from '@/utils/cache';

const languageStore = useLanguageStore();

export const useTrackerStore = defineStore("trackerStore", {
  state: () => ({
    date: String(), // Date for the tracker
    tracker: {},
    history: [], // Letzte 7 Tage Tracker-Daten
    bodyData: {},
    error: null,
    isAddingItem: false,
    favorites: [], // Favoritenliste für Tracker-Items
    indicatorSettings: [
      { key: 'acidBase', enabled: true },
      { key: 'histamine', enabled: true },
    ],
    selectedItem: {
      name: String(),
      amount: Number(),
      unit: String(),
      kcal: Number(),
      protein: Number(),
      carbohydrates: Number(),
      fat: Number(),
      healthyRating: Number(),
      acidBaseScore: Number(),
      histamineLevel: Number(),
      daily: Boolean(),
      _id: String()
    },
    dietTypeOptions: [
      { value: 'balanced', title: languageStore.t('tracker.dietType.balanced') },
      { value: 'lowCarb', title: languageStore.t('tracker.dietType.lowCarb') },
      { value: 'lowFat', title: languageStore.t('tracker.dietType.lowFat') }
    ],
    dietLevelOptions: [
      { value: 'strongLose', title: languageStore.t('tracker.dietLevel.strongLose') },
      { value: 'lose', title: languageStore.t('tracker.dietLevel.lose') },
      { value: 'maintain', title: languageStore.t('tracker.dietLevel.maintain') },
      { value: 'gain', title: languageStore.t('tracker.dietLevel.gain') },
      { value: 'strongGain', title: languageStore.t('tracker.dietLevel.strongGain') },

    ]
  }),

  actions: {
    loadCache() {
      const data = cache.get('tracker');
      if (data) {
        if (data.tracker) {
          this.tracker = data.tracker;
          this.date = data.tracker.date || this.date;
        }
        this.bodyData = data.bodyData || this.bodyData;
      }
    },

    saveCache() {
      cache.set('tracker', {
        tracker: this.tracker,
        bodyData: this.bodyData,
      });
    },

    refreshTracker() {
      return this.fetchTracker(this.date);
    },

    async initializeTracker(date = null) {
      this.loadCache();
      this.loadIndicatorSettings();
      await this.fetchTracker(date);
    },
    // Get the tracker for a specific date (or today if no date is provided)
    async fetchTracker(date = null) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/get",
          date ? { date } : {}
        );
        if (response && response.status === 200) {
          this.tracker = response.data;
          this.date = response.data.date;
          this.saveCache();
          return true
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async fetchHistory() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/history", null, false
        );
        if (response && response.status === 200) {
          this.history = response.data.history;
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Ask a question to the calorie tracker
    async askTrackerQuestion(question) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/ask",
          { question },
          false
        );
        return response?.data.answer;
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Chat with the tracker
    async chatWithTracker(messages) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/chat",
          { messages, trackerId: this.tracker._id },
          false
        );
        if (response && response.status === 200) {
          if (response.data.tracker) {
            this.tracker = response.data.tracker;
            this.saveCache();
          }
          return response.data;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Track a food item by text input
    async trackFoodByText(text) {
      this.isAddingItem = true;
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/track/text",
          {
            text,
            trackerId: this.tracker._id
          },
          false
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.isAddingItem = false;
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.isAddingItem = false;
        this.error = error;
      }
      return null;
    },

    // Add a food item directly without AI processing (for favorites)
    async addFoodItemDirect(item) {
      this.isAddingItem = true;
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/item/add",
          {
            trackerId: this.tracker._id,
            item: {
              name: item.name,
              amount: parseFloat(item.amount),
              unit: item.unit,
              kcal: parseFloat(item.kcal) || 0,
              protein: parseFloat(item.protein) || 0,
              carbohydrates: parseFloat(item.carbohydrates) || 0,
              fat: parseFloat(item.fat) || 0,
              healthyRating: item.healthyRating || 3,
              acidBaseScore: parseFloat(item.acidBaseScore) || 0,
              histamineLevel: parseInt(item.histamineLevel) || 0
            }
          },
          false
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.isAddingItem = false;
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.isAddingItem = false;
        this.error = error;
      }
      return null;
    },

    // Upload an audio file to track Food
    async trackFoodByAudio(file) {
      this.isAddingItem = true;
      const apiStore = useApiStore();
      const formData = new FormData();
      formData.append("trackerId", this.tracker._id);
      formData.append("file", file);

      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/track/audio",
          formData,
          false
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.isAddingItem = false;
          this.saveCache();
          return response.message;
        }
      } catch (error) {
        this.isAddingItem = false;
        this.error = error;
      }
      return null;
    },

    // Track a recipe by recipe ID and portions
    async trackRecipe(recipeId, portions) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/track/recipe",
          { recipeId, portions, trackerId: this.tracker._id }
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.saveCache();
          return response.message;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Track a food item by image upload
    async trackFoodByImage(file, comment = null) {
      this.isAddingItem = true;
      const apiStore = useApiStore();
      const formData = new FormData();
      formData.append("trackerId", this.tracker._id);
      formData.append("file", file);
      if (comment) formData.append("comment", comment);

      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/track/image",
          formData,
          false
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.isAddingItem = false;
          this.saveCache();
          return true
        }
      } catch (error) {
        this.isAddingItem = false;
        this.error = error;
      }
      return null;
    },

    // Track food with multiple modalities (text, images, audio)
    async trackFoodMultimodal({ text, images, audio }) {
      this.isAddingItem = true;
      const apiStore = useApiStore();
      const formData = new FormData();
      formData.append("trackerId", this.tracker._id);

      if (text) {
        formData.append("text", text);
      }

      if (images && images.length > 0) {
        images.forEach((image, index) => {
          formData.append(`images`, image);
        });
      }

      if (audio) {
        formData.append("audio", audio);
      }

      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/track/multimodal",
          formData,
          false
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.isAddingItem = false;
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.isAddingItem = false;
        this.error = error;
      }
      return null;
    },

    // Track an activity by text description
    async trackActivity(text) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/track/activity",
          { text, trackerId: this.tracker._id }
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.saveCache();
          return response.message;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Remove an activity
    async removeActivityItem() {
      const { _id } = this.selectedItem;
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "delete",
          "/calorietracker/activity/remove",
          { trackerId: this.tracker._id, activityId: _id }
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.selectedItem = {};
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async updateActivityItem() {
      const { _id, ...updatedData } = this.selectedItem; // Entfernt _id aus dem Objekt
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/calorietracker/activity/update",
          { trackerId: this.tracker._id, activityId: _id, ...updatedData }
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.selectedItem = {};
          this.saveCache();
          return response.message;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Toggle daily status for a food item in the tracker
    async toggleDaily() {
      const { _id } = this.selectedItem;
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/calorietracker/item/daily/toggle",
          { trackerId: this.tracker._id, foodItemId: _id },
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.selectedItem = {};
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Add a food item from a past tracker to today's tracker
    async addItemToToday() {
      const { _id } = this.selectedItem;
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/item/addtoday",
          { sourceTrackerId: this.tracker._id, foodItemId: _id },
          false
        );
        if (response && response.status === 200) {
          this.selectedItem = {};
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Duplicate a food item within the same tracker
    async duplicateFoodItem() {
      const { _id } = this.selectedItem;
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/item/duplicate",
          { trackerId: this.tracker._id, foodItemId: _id },
          false
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.selectedItem = {};
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Update recommendations for calories and macronutrients
    async updateRecommendations(recommendations) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/calorietracker/set/recommendations",
          { recommendations, trackerId: this.tracker._id }
        );
        if (response.status) {
          this.tracker.recommendations = response.data.recommendations;
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Update a group of food items in the tracker
    async updateFoodGroup(groupId, scalingFactor, name) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/calorietracker/group/update",
          { trackerId: this.tracker._id, groupId, scalingFactor, name }
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.saveCache();
          return response.data.message;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Refine a group of food items using AI
    async refineFoodGroup(groupId, instructions) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/calorietracker/group/refine",
          { trackerId: this.tracker._id, groupId, instructions }
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.saveCache();
          return response.data.message;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Update a food item in the tracker
    async updateFoodItem() {
      const { _id, ...updatedData } = this.selectedItem; // Entfernt _id aus dem Objekt
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/calorietracker/item/update",
          { trackerId: this.tracker._id, foodItemId: _id, ...updatedData }
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          // Wenn das Item in den Favoriten existiert, aktualisiere es dort auch
          const favoriteIndex = this.favorites.findIndex(fav => fav.name === updatedData.name);
          if (favoriteIndex !== -1) {
            this.favorites[favoriteIndex] = { ...updatedData };
            this.saveFavoritesToLocalStorage();
          }
          this.selectedItem = {};
          this.saveCache();
          return response.message;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Remove a food item from the tracker
    async removeFoodItem() {
      const { _id } = this.selectedItem;
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "delete",
          "/calorietracker/item/remove",
          { trackerId: this.tracker._id, foodItemId: _id }
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.selectedItem = {};
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Reorder food items in the tracker
    async reorderItems(itemIds) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/calorietracker/items/reorder",
          { trackerId: this.tracker._id, itemIds },
          false
        );
        if (response && response.status === 200) {
          this.tracker = response.data.tracker;
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Get the user's body data
    async fetchBodyData() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/bodydata/get", null, false
        );
        if (response && response.status === 200) {
          this.bodyData = response.data.bodyData;
          this.saveCache();
          return this.bodyData;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Update body data and weight tracking
    async updateBodyData(bodyData) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/calorietracker/bodydata/update",
          bodyData
        );
        if (response) {
          this.bodyData = { ...this.bodyData, ...bodyData };
          this.saveCache();
          return response.message;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Calculate daily calorie needs based on body data and activity level
    async calculateRecommendations(workDays = 0, workDaysPAL = 0, overrides = {}) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/bodydata/calculate",
          { workDays, workDaysPAL, ...overrides }
        );

        if (response && response.status === 200) {
          return response.data.recommendations;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    clearError() {
      this.error = null;
    },

    // Favoriten-Management für Tracker (Backend-gestützt)
    async fetchFavorites() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("get", "/calorietracker/favorites", null, false);
        if (response && response.status === 200) {
          this.favorites = response.data;
          return this.favorites;
        }
      } catch (error) {
        this.error = error;
      }
      return [];
    },

    async addFavorite(item) {
      if (!item || !item.name) return;
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/calorietracker/favorites/add", { item });
        if (response && response.status === 201) {
          this.favorites.push(response.data);
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    async updateFavorite(id, item) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("put", `/calorietracker/favorites/update/${id}`, { item });
        if (response && response.status === 200) {
          const index = this.favorites.findIndex(fav => fav._id === id);
          if (index !== -1) {
            this.favorites[index] = response.data;
          }
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    async removeFavorite(id) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("delete", `/calorietracker/favorites/remove/${id}`);
        if (response && response.status === 200) {
          this.favorites = this.favorites.filter(fav => fav._id !== id);
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Indicator settings management
    saveIndicatorSettings() {
      try {
        localStorage.setItem('trackerIndicatorSettings', JSON.stringify(this.indicatorSettings));
      } catch (e) {
        console.error('Error saving indicator settings:', e);
      }
    },

    loadIndicatorSettings() {
      try {
        const data = localStorage.getItem('trackerIndicatorSettings');
        if (data) {
          const saved = JSON.parse(data);
          // Merge with defaults to handle new indicators added in future updates
          const defaults = [
            { key: 'acidBase', enabled: true },
            { key: 'histamine', enabled: true },
          ];
          this.indicatorSettings = defaults.map(def => {
            const saved_item = saved.find(s => s.key === def.key);
            return saved_item || def;
          });
        }
      } catch (e) {
        console.error('Error loading indicator settings:', e);
      }
    },

    isIndicatorEnabled(key) {
      const indicator = this.indicatorSettings.find(i => i.key === key);
      return indicator ? indicator.enabled : false;
    },

    getEnabledIndicators() {
      return this.indicatorSettings.filter(i => i.enabled);
    },
  },
});
