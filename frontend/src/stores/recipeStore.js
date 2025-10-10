import { defineStore } from "pinia";
import { useApiStore } from "./apiStore";
import { useLanguageStore } from "./languageStore";
import { cache } from "@/utils/cache";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

const languageStore = useLanguageStore();

export const useRecipeStore = defineStore("recipeStore", {
  state: () => ({
    recipes: [],
    favoriteRecipes: [],
    userRecipes: [],
    currentRecipe: null,
    currentRecipeType: 0, // setCurrentRecipe()
    generatedRecipe: null,
    generationStatus: null,
    pollInterval: null,
    isPolling: false,
    generationBaseCount: 0,
    error: null,
  }),

  actions: {
    loadCache() {
      const data = cache.get('recipes');
      if (data) {
        this.recipes = data.recipes || [];
        this.favoriteRecipes = data.favoriteRecipes || [];
        this.userRecipes = data.userRecipes || [];
        this.currentRecipe = data.currentRecipe || null;
        this.currentRecipeType = data.currentRecipeType || 0;
        this.generatedRecipe = data.generatedRecipe || null;
      }
    },

    saveCache() {
      cache.set('recipes', {
        recipes: this.recipes,
        favoriteRecipes: this.favoriteRecipes,
        userRecipes: this.userRecipes,
        currentRecipe: this.currentRecipe,
        currentRecipeType: this.currentRecipeType,
        generatedRecipe: this.generatedRecipe,
      });
    },
    // Get detailed information for a specific recipe
    async fetchRecipe(recipeId, servings = false) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/recipe/read", { recipeId, servings });

        if (response.status === 200) {
          const isFavoriteFlag = response.data.isFavorite ? 1 : 0;
          this.setCurrentRecipe(response.data, isFavoriteFlag);
          this.saveCache();
          return this.currentRecipe;
        }
      } catch (error) {
        this.error = error;
      }

      return null;
    },

    // Create feedback for a recipe
    async createFeedback(recipeId, content) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/recipe/feedback",
          { recipeId, content, });
        return response || null;
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Add a recipe to favorites
    async addFavoriteRecipe(recipeId) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/recipe/favorite/create",
          { recipeId }
        );
        if (response.status === 201) {
          this.setCurrentRecipe(this.currentRecipe, 1);
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Get a list of favorite recipes
    async fetchFavoriteRecipes(count = null) {
      const apiStore = useApiStore();
      try {
        const url = count
          ? `/recipe/read/favorites?count=${count}`
          : "/recipe/read/favorites";
        const response = await apiStore.apiRequest("post", url);
        if (response.status == 200) {
          this.favoriteRecipes = response.data.favoriteRecipes;
          this.saveCache();
          return this.favoriteRecipes;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Remove a recipe from favorites
    async removeFavoriteRecipe(recipeId) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "delete",
          "/recipe/favorite/delete",
          { recipeId }
        );
        if (response.status === 200) {
          this.favoriteRecipes = this.favoriteRecipes.filter(
            (recipe) => recipe._id !== recipeId
          );
          this.setCurrentRecipe(this.currentRecipe, 0);
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Create a new user recipe with optional image
    async createUserRecipe(recipeText, file = null) {
      const apiStore = useApiStore();
      if (this.generationStatus === 'processing') {
        return { status: 'processing' };
      }
      this.generationStatus = 'processing';
      try {
        const formData = new FormData();
        formData.append("text", recipeText);
        if (file) {
          formData.append("file", file);
        }

        const response = await apiStore.apiRequest(
          "post",
          "/recipe/create/user",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        if (response.status === 200 || response.status === 201) {
          this.generatedRecipe = response.data;
          this.userRecipes.push(response.data);
          this.currentRecipe = response.data;
          this.generationStatus = null;
          this.saveCache();
          return this.generatedRecipe;
        } else if (response.status === 202) {
          this.generatedRecipe = null;
          this.generationStatus = "processing";
          const count = await this.fetchUserRecipeCount(false);
          this.generationBaseCount = count || 0;
          if (this.pollInterval) clearInterval(this.pollInterval);
          const poll = async () => {
            if (this.isPolling) return;
            this.isPolling = true;
            const currentCount = await this.fetchUserRecipeCount(false);
            this.isPolling = false;
            if (currentCount && currentCount >= this.generationBaseCount + 1) {
              clearInterval(this.pollInterval);
              this.pollInterval = null;
              this.generationStatus = null;
              await this.fetchUserRecipes(false);
              alert(languageStore.t('recipes.readyMessage'));
            }
          };
          this.pollInterval = setInterval(poll, 5000);
          return { status: "processing" };
        }
      } catch (error) {
        this.error = error;
        this.generationStatus = null;
      }
      return null;
    },

    // Deletes a user recipe
    async deleteUserRecipe(recipeId) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "delete",
          "/recipe/user/delete",
          { recipeId }
        );
        if (response.status === 200) {
          this.userRecipes = this.userRecipes.filter(
            (recipe) => recipe._id !== recipeId
          );
          this.setCurrentRecipe(this.currentRecipe, 0);
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Get a specific recipe created by the user
    async fetchUserRecipe(recipeId) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/recipe/user/read",
          { recipeId }
        );
        if (response.status === 200) {
          this.currentRecipe = response.data;
          this.saveCache();
          return this.currentRecipe;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Get a list of recipes created by the user
    async fetchUserRecipes(showLoader = true) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/recipe/read/user", null, showLoader);
        if (response.status == 200) {
          this.userRecipes = response.data.recipes;
          this.saveCache();
          return this.userRecipes;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async fetchUserRecipeCount(showLoader = true) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/recipe/read/user/count", null, showLoader);
        if (response.status === 200) {
          return response.data.count;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async editUserRecipe(id, text, preview = false, updatedRecipe = null) {
      const apiStore = useApiStore();
      try {
        const payload = preview
          ? { text, preview: true }
          : updatedRecipe
            ? { updatedRecipe }
            : { text };
        const response = await apiStore.apiRequest(
          "post",
          `/recipe/user/${id}/edit-text`,
          payload,
          false
        );
        if (response && response.status === 200) {
          if (preview) {
            return {
              preview: response.data.preview,
              changes: response.data.changes || []
            };
          }
          const index = this.userRecipes.findIndex(r => r._id === id);
          if (index !== -1) {
            this.userRecipes[index] = response.data;
          }
          this.currentRecipe = response.data;
          this.saveCache();
          return response.data;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async editRecipe(id, text, preview = false, updatedRecipe = null) {
      const apiStore = useApiStore();
      try {
        const payload = preview
          ? { text, preview: true }
          : updatedRecipe
            ? { updatedRecipe }
            : { text };
        const response = await apiStore.apiRequest(
          "post",
          `/recipe/${id}/edit-text`,
          payload,
          false
        );
        if (response && response.status === 200) {
          if (preview) {
            return {
              preview: response.data.preview,
              changes: response.data.changes || []
            };
          }
          this.currentRecipe = response.data;
          this.saveCache();
          return response.data;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async downloadRecipePdf(recipeId, servings = false) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/recipe/download/pdf",
          { recipeId, servings },
          false,
          { responseType: "blob" }
        );
        if (response && response.status === 200) {
          const blob = new Blob([response.data], { type: "application/pdf" });
          if (Capacitor.isNativePlatform()) {
            const base64Data = await blobToBase64(blob);
            const filePath = `recipe_${recipeId}.pdf`;
            await Filesystem.writeFile({
              path: filePath,
              data: base64Data,
              directory: Directory.Documents,
            });
            const { uri } = await Filesystem.getUri({
              path: filePath,
              directory: Directory.Documents,
            });
            await Share.share({
              title: languageStore.t('recipes.shareDialog'),
              files: [uri],
              dialogTitle: languageStore.t('recipes.shareDialog'),
            });
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "recipe.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    async downloadSelectedRecipesPdf(recipes) {
      const apiStore = useApiStore();
      try {
        const payload = {
          recipes: recipes.map((r) => ({
            recipeId: r._id || r.id,
            servings: r.servings,
          })),
        };
        const response = await apiStore.apiRequest(
          "post",
          "/recipe/download/selected/pdf",
          payload,
          false,
          { responseType: "blob" }
        );
        if (response && response.status === 200) {
          const blob = new Blob([response.data], { type: "application/pdf" });
          if (Capacitor.isNativePlatform()) {
            const base64Data = await blobToBase64(blob);
            const filePath = `recipes.pdf`;
            await Filesystem.writeFile({
              path: filePath,
              data: base64Data,
              directory: Directory.Documents,
            });
            const { uri } = await Filesystem.getUri({
              path: filePath,
              directory: Directory.Documents,
            });
            await Share.share({
              title: languageStore.t('recipes.shareDialog'),
              files: [uri],
              dialogTitle: languageStore.t('recipes.shareDialog'),
            });
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "recipes.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    setCurrentRecipe(recipe, recipeType = 0) {
      // recipeType: 0 = Standard, 1 = Favorite, 2 = UserRecipe
      this.currentRecipe = recipe;
      this.currentRecipeType = recipeType;
      this.saveCache();
    },

    clearError() {
      this.error = null;
    },
  },
});
