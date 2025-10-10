import { defineStore } from "pinia";
import { useApiStore } from "./apiStore";
import { useLanguageStore } from "@/stores/languageStore"; // Importiere languageStore

export const useUserStore = defineStore("userStore", {
  state: () => ({
    language: localStorage.getItem("appLocale") || null,
    role: localStorage.getItem("userRole") || null,
    id: localStorage.getItem("userId") || null,
    sortingOrder: [],
    error: null,
    startpage: localStorage.getItem("startpage") || "/",
  }),
  getters: {
    isAdmin: (state) => state.role === "administrator",
  },

  actions: {
    // Delete user account
    async deleteUser() {
      const apiStore = useApiStore();
      try {
        localStorage.clear();
        const response = await apiStore.apiRequest("delete", "/user/delete");
        if (response.status === 200) {
          window.location.href = "/";
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Set sorting order for categories
    async setSortingOrder(sorting) {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "put",
          "/user/shoppingList/sorting/set",
          { sort: sorting }
        );
        if (response && response.message === "Sort updated successfully") {
          this.sortingOrder = sorting;
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Get current sorting order for categories
    async fetchSortingOrder() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/user/shoppingList/sorting/get"
        );
        if (response && response.categories) {
          this.sortingOrder = response.categories;
          return this.sortingOrder;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    // Set user's preferred language
    async setLanguage(languageCode) {
      const apiStore = useApiStore();
      const languageStore = useLanguageStore();

      this.language = languageCode;
      await languageStore.setLocale(languageCode);

      try {
        const response = await apiStore.apiRequest(
          "put",
          "/user/language/set",
          {
            language: languageCode,
          }
        );
        if (response.status == 200) {
          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Get user's preferred language
    async fetchLanguage() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/user/language/get"
        );
        if (response.status == 200) {
          this.language = response.data.language;
          return this.language;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async fetchRole() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/user/role/get"
        );
        if (response.status === 200) {
          this.role = response.data.role;
          localStorage.setItem("userRole", this.role);
          return this.role;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    async fetchUserId() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest(
          "post",
          "/user/id/get"
        );
        if (response.status === 200) {
          this.id = response.data.id;
          localStorage.setItem("userId", this.id);
          return this.id;
        }
      } catch (error) {
        this.error = error;
      }
      return null;
    },

    clearError() {
      this.error = null;
    },

    // Export user data as JSON file
    async exportUserData() {
      const apiStore = useApiStore();
      try {
        const response = await apiStore.apiRequest("post", "/user/data/export");
        if (response.status === 201) {
          return response.data.link;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Import user data from JSON file
    async importUserData(file) {
      const apiStore = useApiStore();
      try {
        const fileContent = await file.text();
        const jsonData = JSON.parse(fileContent);

        const response = await apiStore.apiRequest("post", "/user/data/import", jsonData);

        if (response.status == 200 && response.data.token) {
          // Lösche alle gespeicherten localStorage Items
          localStorage.clear();

          localStorage.setItem("sessionToken", response.data.token);
          localStorage.setItem("appLocale", response.data.language);
          localStorage.setItem("shoppingListId", response.data.shoppingList.id);

          this.sortingOrder = response.data.shoppingListSort;

          window.location.href = "/";

          return true;
        }
      } catch (error) {
        this.error = error;
      }
      return false;
    },

    // Set the start page and persist it in localStorage
    setStartpage(page) {
      this.startpage = page;
      localStorage.setItem("startpage", page);
    },

    // Get the current start page
    getStartpage() {
      return this.startpage;
    },
  },
});
