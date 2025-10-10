import { defineStore } from "pinia";
import { useApiStore } from "./apiStore";
import { useShoppingListStore } from "./shoppingListStore";

const MIN_RECIPE_SUGGESTIONS =
  parseInt(import.meta.env.VITE_MIN_RECIPE_SUGGESTIONS) || 5;
const RECIPE_FETCH_COUNT =
  parseInt(import.meta.env.VITE_RECIPE_FETCH_COUNT) || 3;

export const usePlannerStore = defineStore("plannerStore", {
  state: () => ({
    filters: { servings: 2, recipes: 2, prompt: '' },
    selectedRecipes: [],
    selectedRecipeCount: 0,
    recipeSuggestions: JSON.parse(
      localStorage.getItem('recipeSuggestions') || '[]'
    ).slice(0, MIN_RECIPE_SUGGESTIONS),
    isFetching: false,
    error: null,
  }),

  actions: {
    // Get current filter settings
    async fetchFilters() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/planer/filter/read", false);
        if (response.status === 200) {
          this.filters = response.data;
          return this.filters;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Set filter settings
    async setFilters({ servings = null, recipes = null, prompt = null }) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("put", "/planer/filter/set", {
          servings,
          recipes,
          prompt,
        });
        if (response.status === 200 && response.data.message === "Filters updated successfully") {
          this.filters = { servings, recipes, prompt };
          this.recipeSuggestions = [];
          localStorage.removeItem("recipeSuggestions");
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Clear all selected recipes
    async clearSelectedRecipes() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/planer/selected/clear");
        if (
          response.status === 200 &&
          response.data.message === "Selected Recipes cleared successfully"
        ) {
          this.selectedRecipes = [];
          this.selectedRecipeCount = 0;
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Get the list of selected recipes
    async fetchSelectedRecipes() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/planer/selected/read");
        if (response.status === 200 && response.data.selectedRecipes) {
          this.selectedRecipes = response.data.selectedRecipes;
          this.selectedRecipeCount = this.selectedRecipes.length;
          return this.selectedRecipes;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async fetchSelectedRecipeCount(showLoader = true) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/planer/selected/count",
          null,
          showLoader
        );
        if (response.status === 200) {
          this.selectedRecipeCount = response.data.count;
          return response.data.count;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Remove a specific recipe from the selected list
    async removeSelectedRecipe(recipeId) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/planer/selected/remove", {
          recipeId,
        });
        if (
          response.status === 200 &&
          response.data.message === "Removed Recipe from selections successfully"
        ) {
          this.selectedRecipes = this.selectedRecipes.filter(
            (recipe) => recipe._id !== recipeId
          );
          this.selectedRecipeCount = Math.max(0, this.selectedRecipeCount - 1);
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Get recipe suggestions based on filters
    async fetchRecipeSuggestions(showLoading = true) {
      if (this.isFetching) return null;

      if (this.recipeSuggestions.length >= MIN_RECIPE_SUGGESTIONS) {
        return this.recipeSuggestions;
      }

      const fetchCount = RECIPE_FETCH_COUNT;
      if (fetchCount <= 0) {
        return this.recipeSuggestions;
      }

      this.isFetching = true;
      const apiStore = useApiStore();
      const payload = { count: fetchCount };

      try {
        if (!apiStore.token) {
          const sessionCreated = await apiStore.createSession();
          if (!sessionCreated) {
            this.error = apiStore.error || new Error("Failed to initialize session");
            return null;
          }
        }

        let response = await apiStore.apiRequest(
          "post",
          "/planer/suggestions/get",
          payload,
          showLoading
        );

        if (!response && apiStore.error?.response?.status === 401) {
          localStorage.removeItem("sessionToken");
          apiStore.token = null;

          const sessionCreated = await apiStore.createSession();
          if (!sessionCreated) {
            this.error = apiStore.error || new Error("Failed to refresh session");
            return null;
          }

          response = await apiStore.apiRequest(
            "post",
            "/planer/suggestions/get",
            payload,
            showLoading
          );
        }

        if (!response) {
          this.error = apiStore.error;
          return null;
        }

        const { status, data } = response;

        if (status === 200 && Array.isArray(data)) {
          /* 
           * Merge new suggestions with existing ones,
           * avoiding duplicates by _id.
           */
          const merged = [...this.recipeSuggestions];

          data.forEach((recipe) => {
            if (!merged.some((r) => r._id === recipe._id)) {
              merged.push(recipe);
            }
          });

          this.recipeSuggestions = merged;
          localStorage.setItem("recipeSuggestions", JSON.stringify(merged));
          return merged;
        }
      } catch (error) {
        this.error = error;
      } finally {
        this.isFetching = false;
      }

      return null;
    },

    // Vote for a recipe (upvote or downvote)
    async voteRecipe(recipeId, voteType) {
      const apiStore = useApiStore();
      const shoppingListStore = useShoppingListStore();
      try {
        const response = await apiStore.apiRequest("post", "/planer/suggestions/vote", {
          recipeId,
          voteType,
        },
          true);
        // Code 201 if successful voted
        if (response.status === 201) {
          if (voteType === "upvote") {
            // Add the recipe to the local selection when upvoting
            this.selectedRecipes.push(
              this.recipeSuggestions.find((recipe) => recipe._id === recipeId)
            );
          } else {
            // Downvoting should not remove already selected recipes
            // Keep the selected list and count unchanged
          }

          if (typeof response.data?.selectedCount === "number") {
            this.selectedRecipeCount = response.data.selectedCount;
          }
          return { success: true, type: "voted" };
        }
        // Code 200 if voted and Recipes are complete to compile
        if (response.status === 200 || !response) {
          if (typeof response.data?.selectedCount === "number") {
            this.selectedRecipeCount = response.data.selectedCount;
          }
          await shoppingListStore.compileSuggestions(); // Methode aufrufen
          return { success: true, type: "compiled" };
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    removeRecipeSuggestion(recipeId) {
      this.recipeSuggestions = this.recipeSuggestions.filter(
        (recipe) => recipe._id !== recipeId
      );
      localStorage.setItem(
        "recipeSuggestions",
        JSON.stringify(this.recipeSuggestions)
      );
    },

    clearError() {
      this.error = null;
    },
  },
});

