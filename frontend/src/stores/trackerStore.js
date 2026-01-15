import { defineStore } from "pinia";
import { useApiStore } from "./apiStore";
import { useLanguageStore } from '@/stores/languageStore';
import { cache } from '@/utils/cache';

const languageStore = useLanguageStore();

export const useTrackerStore = defineStore("trackerStore", {
  state: () => ({
    date: String(), // Date for the tracker
    tracker: {},
    bodyData: {},
    error: null,
    isAddingItem: false,
    favorites: [], // Favoritenliste für Tracker-Items
    selectedItem: {
      name: String(),
      amount: Number(),
      unit: String(),
      kcal: Number(),
      protein: Number(),
      carbohydrates: Number(),
      fat: Number(),
      healthyRating: Number(),
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
        if (response.status === 200) {
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

    // Ask a question to the calorie tracker
    async askTrackerQuestion(question) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/ask",
          { question }
        );
        return response?.data.answer;
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
        if (response.status === 200) {
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
      const apiStore = useApiStore();
      const formData = new FormData();
      formData.append("trackerId", this.tracker._id);
      formData.append("file", file);

      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/track/audio",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
        if (response.status === 200) {
          this.tracker = response.data.tracker;
          this.saveCache();
          return response.message;
        }
      } catch (error) {
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
        if (response.status === 200) {
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
        if (response.status === 200) {
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

    // Track an activity by text description
    async trackActivity(text) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/track/activity",
          { text, trackerId: this.tracker._id }
        );
        if (response.status === 200) {
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
        if (response.status === 200) {
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
        if (response.status === 200) {
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
        if (response.status === 200) {
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
        if (response.status === 200) {
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
        if (response.status === 200) {
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
        if (response.status === 200) {
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

    // Get the user's body data
    async fetchBodyData() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/bodydata/get"
        );
        if (response.status === 200) {
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
    async calculateRecommendations(workDays = 0, workDaysPAL = 0) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/calorietracker/bodydata/calculate",
          { workDays, workDaysPAL }
        );

        if (response.status === 200) {
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

    // Favoriten-Management für Tracker
    addFavorite(item) {
      if (!item || !item.name) return;
      const exists = this.favorites.some(fav => fav.name === item.name);
      if (!exists) {
        // Speichere das gesamte Item-Objekt als Favorit (Kopie)
        this.favorites.push({ ...item });
        this.saveFavoritesToLocalStorage();
      }
    },

    removeFavorite(itemName) {
      this.favorites = this.favorites.filter(fav => fav.name !== itemName);
      this.saveFavoritesToLocalStorage();
    },

    getFavorites() {
      this.loadFavoritesFromLocalStorage();
      return this.favorites.slice().sort((a, b) => a.name.localeCompare(b.name));
    },

    saveFavoritesToLocalStorage() {
      try {
        localStorage.setItem('trackerFavorites', JSON.stringify(this.favorites));
      } catch (e) {
        console.error('Error saving tracker favorites:', e);
      }
    },

    loadFavoritesFromLocalStorage() {
      try {
        const data = localStorage.getItem('trackerFavorites');
        if (data) {
          this.favorites = JSON.parse(data);
        }
      } catch (e) {
        console.error('Error loading tracker favorites:', e);
      }
    },
  },
});
