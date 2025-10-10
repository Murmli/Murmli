import { defineStore } from "pinia";
import { useApiStore } from "./apiStore";
import { cache } from "@/utils/cache";

export const useShoppingListStore = defineStore("shoppingListStore", {
  state: () => ({
    listId: localStorage.getItem("shoppingListId") || null,
    items: [],
    categories: [],
    inviteCode: null,
    inviteTimeRemaining: null,
    sortingOrder: [],
    lastUpdate: null,
    pendingUpdates: 0,
    queuedSseUpdate: null,
    error: null,
    lsFavoritesKey: "favorites",
    lsCategoryOverridesKey: "categoryOverrides",
    favorites: [],
    categoryOverrides: {},
    isOwner: false,
    sharedWith: [],
    recipes: [],
    isAddingItem: false,
    eventSource: null,
  }),

  getters: {
    sortedFavorites(state) {
      return [...state.favorites].sort((a, b) => b.clicks - a.clicks);
    },
  },

  actions: {
    loadCache() {
      const data = cache.get('shoppingList');
      if (data) {
        this.listId = data.listId || this.listId;
        this.items = data.items || [];
        this.categories = (data.categories || []).map(c => ({
          id: Number(c.id),
          name: c.name,
        }));
        this.inviteCode = data.inviteCode || null;
        this.inviteTimeRemaining = data.inviteTimeRemaining || null;
        this.sortingOrder = data.sortingOrder || [];
        this.favorites = data.favorites || this.favorites;
        this.isOwner = data.isOwner || false;
        this.sharedWith = data.sharedWith || [];
        this.recipes = data.recipes || [];
        this.categoryOverrides =
          JSON.parse(localStorage.getItem(this.lsCategoryOverridesKey)) || {};
      }
    },

    saveCache() {
      cache.set('shoppingList', {
        listId: this.listId,
        items: this.items,
        categories: this.categories,
        inviteCode: this.inviteCode,
        inviteTimeRemaining: this.inviteTimeRemaining,
        sortingOrder: this.sortingOrder,
        favorites: this.favorites,
        isOwner: this.isOwner,
        sharedWith: this.sharedWith,
        recipes: this.recipes,
      });
      localStorage.setItem(
        this.lsCategoryOverridesKey,
        JSON.stringify(this.categoryOverrides)
      );
    },

    async ensureListId() {
      if (this.listId) return true;

      const apiStore = useApiStore();

      const storedListId = localStorage.getItem("shoppingListId");
      if (storedListId) {
        await this.setListId(storedListId, true);
        if (this.listId) return true;
      }

      try {
        const reqMyListId = await apiStore.apiRequest("get", "/shoppingList/myShoppingList");
        if (reqMyListId && reqMyListId.status === 200 && reqMyListId.data?.listId) {
          await this.setListId(reqMyListId.data.listId, true);
          return true;
        }
      } catch (e) {
        this.error = e;
      }

      try {
        const request = await apiStore.apiRequest("get", "/shoppingList/create");
        if (request && request.status === 200 && request.data?.list?._id) {
          this.setListId(request.data.list._id);
          this.items = request.data.list.items;
          this.isOwner = request.data.list.isOwner;
          this.sharedWith = request.data.list.sharedWith || [];
          this.recipes = request.data.list.recipes;
          this.applyCategoryOverrides();
          this.lastUpdate = request.data.list.updatedAt;
          this.saveCache();
          return true;
        }
      } catch (e) {
        this.error = e;
      }

      return false;
    },

    startStream() {
      this.stopStream();
      if (!this.listId) {
        return;
      }
      if (this.isOwner && this.sharedWith.length === 0) {
        return;
      }
      const apiStore = useApiStore();
      const token = apiStore.token;
      const secret = import.meta.env.VITE_HEADER_SECRET_KEY;
      const url = `${import.meta.env.VITE_API_BASE_URL}/shoppingList/stream/${this.listId}?token=${token}&secret=${secret}`;
      this.eventSource = new EventSource(url);
      this.eventSource.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          data = null;
        }

        if (data && data.updatedAt) {
          const incoming = new Date(data.updatedAt).getTime();

          if (this.pendingUpdates > 0) {
            const queued = this.queuedSseUpdate
              ? new Date(this.queuedSseUpdate).getTime()
              : 0;
            if (incoming > queued) {
              this.queuedSseUpdate = data.updatedAt;
            }
            return;
          }

          const current = this.lastUpdate
            ? new Date(this.lastUpdate).getTime()
            : 0;
          if (incoming > current) {
            this.lastUpdate = data.updatedAt;
            this.refreshShoppingList();
          }
        } else if (this.pendingUpdates === 0) {
          this.refreshShoppingList();
        } else {
          this.queuedSseUpdate = Date.now();
        }
      };
      this.eventSource.onerror = () => {
        this.stopStream();
      };
    },

    stopStream() {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    },

    refreshShoppingList() {
      // Do not trigger the global loading overlay when the list is refreshed via
      // server sent events. This allows users to continue working without the
      // screen being darkened.
      return this.readShoppingList(false);
    },
    async initializeShoppingList() {
      const storedListId = localStorage.getItem("shoppingListId");

      this.favorites = this.getFavorites();
      this.loadCache();
      await this.fetchCategories();
      if (storedListId) {
        await this.setListId(storedListId, false);
        await this.readShoppingList(true);
      } else {
        await this.createShoppingList();
      }
    },

    async createShoppingList() {
      const apiStore = useApiStore();
      try {
        const request = await apiStore.apiRequest(
          "get",
          "/shoppingList/create"
        );

        if (request.status == 200) {
          this.setListId(request.data.list._id);
          this.items = request.data.list.items;
          this.listId = request.data.list._id;
          this.isOwner = request.data.list.isOwner;
          this.sharedWith = request.data.list.sharedWith || [];
          this.recipes = request.data.list.recipes;
          this.applyCategoryOverrides();
          this.lastUpdate = request.data.list.updatedAt;
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async deleteShoppingList() {
      const apiStore = useApiStore();
      try {
        const request = await apiStore.apiRequest(
          "delete",
          "/shoppingList/delete",
          { listId: this.listId }
        );
        if (request.status == 200) {
          this.listId = null;
          this.items = [];
          this.recipes = [];
          localStorage.removeItem("shoppingListId");
          this.saveCache();
          await this.createShoppingList();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async readShoppingList(showLoading = false) {
      const apiStore = useApiStore();

      try {
        const reqList = await apiStore.apiRequest(
          "post",
          "/shoppingList/read",
          {
            listId: this.listId,
          },
          showLoading
        );

        if (reqList.status == 200) {
          this.items = reqList.data.list.items;
          this.listId = reqList.data.list._id;
          this.isOwner = reqList.data.list.isOwner;
          this.sharedWith = reqList.data.list.sharedWith || [];
          this.recipes = reqList.data.list.recipes;
          this.applyCategoryOverrides();
          this.lastUpdate = reqList.data.list.updatedAt;
          this.saveCache();

          if (this.isOwner) {
            if (this.sharedWith.length > 0) {
              this.startStream();
            } else {
              this.stopStream();
            }
          } else {
            this.startStream();
          }
        } else if (!reqList) {
          const reqMyListId = await apiStore.apiRequest(
            "get",
            "/shoppingList/myShoppingList"
          );
          this.setListId(reqMyListId.data.listId, true);
        }
      } catch (error) {
        this.error = error;
      }
    },

    async addItemToShoppingList(text) {
      const apiStore = useApiStore();
      this.isAddingItem = true;
      try {
        const ok = await this.ensureListId();
        if (!ok) {
          throw new Error("No shopping list available");
        }
        const request = await apiStore.apiRequest(
          "post",
          "/shoppingList/item/create/text",
          {
            text,
            listId: this.listId,
          },
          false
        );

        if (request.status == 200) {
          this.items = request.data.list.items;
          this.applyCategoryOverrides();
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
      finally {
        this.isAddingItem = false;
      }
    },

    async voiceToItem(audioBlob) {
      const apiStore = useApiStore();
      this.isAddingItem = true;
      try {
        // Erstelle FormData für den Audio-Upload
        const ok = await this.ensureListId();
        if (!ok) {
          throw new Error("No shopping list available");
        }
        const formData = new FormData();
        formData.append('file', audioBlob);
        formData.append('listId', this.listId);
        const request = await apiStore.apiRequest(
          "post",
          "/shoppingList/item/create/audio",
          formData,
          false,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
        if (request.status == 200) {
          this.items = request.data.list.items;
          this.applyCategoryOverrides();
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
      finally {
        this.isAddingItem = false;
      }
    },

    async deleteAllItems() {
      const apiStore = useApiStore();
      try {
        const request = await apiStore.apiRequest(
          "delete",
          "/shoppingList/item/delete/all",
          { listId: this.listId }
        );
        if (request.status == 200) {
          this.items = [];
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async deleteCheckedItems() {
      const apiStore = useApiStore();
      try {
        this.items = this.items.filter((item) => item.active !== false);
        const request = await apiStore.apiRequest(
          "delete",
          "/shoppingList/item/delete/checked",
          {
            listId: this.listId,
          },
          false
        );
        if (request.status == 200) {
          this.items = request.data.list.items;
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async deleteItem(itemId) {
      const apiStore = useApiStore();
      try {
        const success = await apiStore.apiRequest(
          "delete",
          "/shoppingList/item/delete",
          { itemId }
        );
        if (success) {
          this.items = this.items.filter((item) => item._id !== itemId);
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async updateItem(itemId, name, quantity, unit, active, category) {
      const apiStore = useApiStore();
      try {
        // Überprüfung, ob unit ein Objekt ist, und Ersetzen mit unit.id
        if (typeof unit === "object" && unit !== null && "id" in unit) {
          unit = unit.id; // Ersetze das Objekt mit seiner ID
        }

        // Item lokal aktualisieren
        const item = this.items.find((item) => item._id === itemId);
        if (item) {
          item.name = name;
          item.quantity = quantity;
          item.active = active;
          if (category !== undefined) {
            const catObj = this.categories.find(
              (c) => Number(c.id) === Number(category)
            );
            item.category = { id: Number(category), name: catObj?.name };
          }
        }

        this.pendingUpdates++;

        // API-Anfrage senden
        const request = await apiStore.apiRequest(
          "put",
          "/shoppingList/item/update",
          {
            itemId,
            name,
            quantity,
            unit,
            category,
            active,
            listId: this.listId,
          },
          false
        );

        if (request.status == 200) {
          if (category !== undefined) {
            this.setCategoryOverride(name, category);
          }
          
          if (request.data && request.data.list && request.data.list.updatedAt) {
            this.lastUpdate = request.data.list.updatedAt;
          }
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
        return false;
      } finally {
        this.pendingUpdates--;
        if (this.pendingUpdates === 0 && this.queuedSseUpdate) {
          const incoming = new Date(this.queuedSseUpdate).getTime();
          const current = this.lastUpdate
            ? new Date(this.lastUpdate).getTime()
            : 0;
          if (incoming > current) {
            this.lastUpdate = this.queuedSseUpdate;
            await this.refreshShoppingList();
          }
          this.queuedSseUpdate = null;
        }
      }
    },

    async fetchCategories() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/user/shoppingList/categories/read",
          { listId: this.listId }
        );
        if (response.status == 200) {
          this.categories = response.data.categories.map(c => ({
            id: Number(c.id),
            name: c.name,
          }));
          this.applyCategoryOverrides();
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async updateCategoriesSorting(sort) {
      // sort must by array with ids [2,4, ...]
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/user/shoppingList/sorting/set",
          { sort }
        );
        if (response.status == 200) {
          await this.readShoppingList();
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async fetchSortingOrder() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/shoppingList/item/sorting"
        );
        if (response.status == 200) {
          this.sortingOrder = response.data.sorting;
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async fetchItemAlternatives(itemId) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/shoppingList/item/alternative",
          { itemId, listId: this.listId }
        );
        return response ? response.data.alternatives : [];
      } catch (error) {
        this.error = error;
      }
      return [];
    },

    async addRecipe(recipeId, servings) {
      const apiStore = useApiStore();
      try {
        const request = await apiStore.apiRequest(
          "post",
          "/shoppingList/recipe/add",
          { recipeId, servings, listId: this.listId }
        );
        if (request.status === 200) {
          this.items = request.data.list.items;
          this.recipes = request.data.list.recipes;
          this.applyCategoryOverrides();
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
    },

    async removeRecipe(recipeId) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "delete",
          "/shoppingList/recipe/remove",
          { listId: this.listId, recipeId }
        );
        if (response.status === 200) {
          this.items = this.items.filter((item) => item.recipeId !== recipeId);
          this.recipes = this.recipes.filter((recipe) => recipe._id !== recipeId);
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async deleteAllRecipes() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "delete",
          "/shoppingList/recipe/remove/all",
          { listId: this.listId }
        );
        if (response.status === 200) {
          this.recipes = [];
          this.saveCache();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
    },

    async deleteAllIngredients() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "delete",
          "/shoppingList/item/delete/ingredients",
          { listId: this.listId }
        );
        if (response.status === 200) {
          this.items = this.items.filter((item) => !item.recipe);
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async compileSuggestions() {
      const apiStore = useApiStore();
      try {
        const request = await apiStore.apiRequest(
          "post",
          "/shoppingList/suggestions/compile",
          { listId: this.listId }

        );
        if (request.status === 200) {
          this.items = request.data.list.items;
          this.recipes = request.data.list.recipes;
          this.applyCategoryOverrides();
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
      }
    },

    async fetchLastUpdate() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/shoppingList/lastUpdate"
        );
        if (response && response.lastUpdate) {
          this.lastUpdate = response.lastUpdate;
        }
      } catch (error) {
        this.error = error;
      }
    },

    async clearInvites(removeUserId = null) {
      const apiStore = useApiStore();
      try {
        // Prepare payload
        const payload = {
          listId: this.listId,
          id: removeUserId || false, // Set id directly as a string if removeUserId is provided
        };

        // API request
        const req = await apiStore.apiRequest(
          "post",
          "/shoppingList/invite/clear",
          payload
        );

        // Handle response
        if (req.status == 200) {
          if (removeUserId) {
            // Filter sharedWith array
            this.sharedWith = this.sharedWith.filter(
              (id) => id !== removeUserId
            );
          } else {
            // Clear all invites
            this.inviteCode = null;
            this.inviteExpiry = null;
            this.sharedWith = [];
          }
          if (this.sharedWith.length === 0) {
            this.stopStream();
          }
        }
      } catch (error) {
        this.error = error;
      }
    },

    async createInvite() {
      const apiStore = useApiStore();
      try {
        const request = await apiStore.apiRequest(
          "post",
          "/shoppingList/invite/create",
          { listId: this.listId }
        );
        if (request.status === 200) {
          this.inviteCode = request.data.inviteCode;
          this.inviteTimeRemaining = request.data.timeRemaining;
        }
      } catch (error) {
        this.error = error;
      }
    },

    async joinList(inviteCode) {
      const apiStore = useApiStore();
      try {
        const request = await apiStore.apiRequest(
          "post",
          "/shoppingList/invite/join",
          { inviteCode }
        );
        if (request.status === 200) {
          request.data.listId;
          this.setListId(request.data.listId, true);
          return { success: true };
        }
      } catch (error) {
        this.error = error;
        throw error;
      }
    },

    async setListId(listId, readAfterSet = false) {
      this.listId = listId;
      localStorage.setItem("shoppingListId", listId);
      this.saveCache();
      if (readAfterSet) { this.readShoppingList(); }
    },

    async leaveList() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/shoppingList/invite/leave",
          { listId: this.listId }
        );
        if (response.status === 200) {
          this.listId = response.data.listId;
          this.setListId(this.listId, true);
          this.saveCache();
          this.stopStream();
          return true;
        }
      } catch (error) {
        this.error = error;
      }
    },

    async readInvite() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/shoppingList/invite/read",
          { listId: this.listId }
        );
        if (response.status == 200 && response.data.inviteCode) {
          this.inviteCode = response.data.inviteCode;
          this.inviteTimeRemaining = response.data.timeRemaining;
        }
      } catch (error) {
        this.error = error;
      }
    },

    createFavorite(item) {
      const existingFavorite = this.favorites.find(
        (fav) => fav.name === item.name
      );

      if (existingFavorite) {
        existingFavorite.item = item;
      } else {
        item.clicks = 0;
        this.favorites.push(item);
      }

      // Aktualisiere auch den Local Storage
      localStorage.setItem(this.lsFavoritesKey, JSON.stringify(this.favorites));
    },

    getFavorites() {
      const favorites =
        JSON.parse(localStorage.getItem(this.lsFavoritesKey)) || [];
      return favorites.sort((a, b) => b.clicks - a.clicks);
    },

    removeFavorite(itemName) {
      this.favorites = this.favorites.filter((fav) => fav.name !== itemName);
      localStorage.setItem(this.lsFavoritesKey, JSON.stringify(this.favorites));
    },

    setCategoryOverride(itemName, categoryId) {
      this.categoryOverrides[itemName.toLowerCase()] = Number(categoryId);
      localStorage.setItem(
        this.lsCategoryOverridesKey,
        JSON.stringify(this.categoryOverrides)
      );
    },

    applyCategoryOverrides() {
      this.items.forEach((item) => {
        const override = this.categoryOverrides[item.name.toLowerCase()];
        if (override != null) {
          const cat = this.categories.find(
            (c) => Number(c.id) === Number(override)
          );
          item.category = {
            id: Number(override),
            name: cat ? cat.name : item.category?.name,
          };
        }
      });
    },

    async addFavoriteToShoppingList(item) {
      const favorite = this.favorites.find((fav) => fav.name === item.name);
      const existingItem = this.items.find((item) => item.name === favorite.name);

      if (favorite) {
        favorite.clicks += 1;
        localStorage.setItem(this.lsFavoritesKey, JSON.stringify(this.favorites));
      }

      if (existingItem && !existingItem.active) {
        this.updateItem(
          existingItem._id,
          existingItem.name,
          existingItem.quantity,
          existingItem.unit.id,
          true
        );
      } else {
        this.addItemToShoppingList(`${favorite.name} ${favorite.quantity} ${favorite.unit.name}`);
      }
    },

    clearError() {
      this.error = null;
    },
  },
});
