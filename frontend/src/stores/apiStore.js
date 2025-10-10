import axios from "axios";
import { defineStore } from "pinia";
import { useLanguageStore } from "@/stores/languageStore";

// const API_BASE_URL = "https://murmli-dev-api.azurewebsites.net/api/v2";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const API_BASE_URL = "https://murmli.de/api/v2";

const HEADER_SECRET_KEY = import.meta.env.VITE_HEADER_SECRET_KEY;

export const useApiStore = defineStore("apiStore", {
  state: () => ({
    token: localStorage.getItem("sessionToken") || null,
    error: null,
    loadingCount: 0,  // Counter für parallele Anfragen
    cancelTokenSource: null,
    isLoading: false,
  }),

  getters: {
    isCurrentlyLoading(state) {
      return state.loadingCount > 0;
    },
  },

  actions: {
    async apiRequest(method, url, data = null, setLoading = true, options = {}) {
      if (setLoading) {
        this.loadingCount++;
      }
      const cancelSource = axios.CancelToken.source();
      this.cancelTokenSource = cancelSource;

      try {
        this.error = null;
        const baseHeaders = {
          "x-header-secret-key": HEADER_SECRET_KEY,
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        };

        // Merge any custom headers without losing required defaults
        const optionHeaders = options?.headers || {};
        const headers = { ...baseHeaders, ...optionHeaders };

        // Avoid passing headers twice; strip from options before spreading
        const { headers: _omitHeaders, ...restOptions } = options || {};

        const response = await axios({
          method,
          url: `${API_BASE_URL}${url}`,
          data,
          headers,
          withCredentials: true,
          cancelToken: cancelSource.token,
          ...restOptions,
        });

        return response;
      } catch (error) {
        this.error = error;
        return false;
      } finally {
        if (setLoading) {
          this.loadingCount = Math.max(0, this.loadingCount - 1);
        }
      }
    },

    cancelRequest() {
      if (this.cancelTokenSource) {
        this.cancelTokenSource.cancel("Request canceled by the user.");
        this.loadingCount = Math.max(0, this.loadingCount - 1);
        this.cancelTokenSource = null;
      }
    },

    clearError() {
      this.error = null;
    },

    async createSession() {
      try {
        const language = navigator.language || navigator.userLanguage || "en";

        const response = await this.apiRequest("post", "/session/create", {
          language,
        });

        if (response && response.status === 201 && response.data.token) {
          this.token = response.data.token;
          localStorage.setItem("sessionToken", this.token);

          const languageStore = useLanguageStore();
          languageStore.setLocale(language);

          return true;
        }
      } catch (error) {
        // Fehler wird in apiRequest behandelt
      }
      return false;
    },

    async login() {
      if (!this.token) {
        console.warn("No token found, creating a new session first.");
        const sessionCreated = await this.createSession();
        return {
          success: sessionCreated,
          invalidSession: false,
        };
      }

      try {
        const response = await this.apiRequest("post", "/session/login");
        if (response && response.status === 200) {
          return {
            success: true,
            invalidSession: false,
          };
        }
      } catch (error) {
        // Fehler wird in apiRequest behandelt
      }

      const isInvalidSession = Boolean(this.error?.response?.status === 401);
      if (isInvalidSession) {
        this.token = null;
        localStorage.removeItem("sessionToken");
      }

      return {
        success: false,
        invalidSession: isInvalidSession,
      };
    },

    async deleteUser() {
      try {
        const response = await this.apiRequest("delete", "/user/delete");
        if (response.status === 200) {
          this.token = null;
          localStorage.removeItem("sessionToken");
          return true;
        }
      } catch (error) {
        // Fehler wird in apiRequest behandelt
      }
      return false;
    },

    async transcribeAudio(audioBlob) {
      try {
        const formData = new FormData();
        formData.append('file', audioBlob);

        const response = await this.apiRequest("post", "/system/transcribe", formData, false);
        if (response.status === 200) {
          return response.data.text;
        }
      } catch (error) {
        // Fehler wird in apiRequest behandelt
      }
      return false;
    }
  },
});
