import { defineStore } from "pinia";
import { ref } from "vue";

// Default language for fallback
const defaultLocale = navigator.language || 'en';
const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Utility function to load language files dynamically
const loadLocaleMessages = async (locale) => {
  try {
    const messages = await import(`../locales/${locale}.json`);
    return messages.default;
  } catch (error) {
    localStorage.setItem("appLocale", defaultLocale);
    console.error(
      `Could not load locale messages for ${locale}, loading default (${defaultLocale}):`,
      error
    );
    // Load default language if an error occurs
    const fallbackMessages = await import(`../locales/${defaultLocale}.json`);
    return fallbackMessages.default;
  }
};

export const useLanguageStore = defineStore("language", () => {
  // Load language from localStorage or set to default
  const savedLocale = localStorage.getItem("appLocale") || defaultLocale;
  const savedTimezone = localStorage.getItem("appTimezone") || systemTimezone;

  const locale = ref(savedLocale);
  const timezone = ref(savedTimezone);
  const messages = ref({}); // holds translation messages
  const isLocaleReady = ref(false);
  let initPromise;

  // Define available languages centrally
  const languages = [
    { text: "United States", value: "en-US" },
    { text: "US - Bostonian", value: "en-US-bx" },
    { text: "US - Southern", value: "en-US-sx" },
    { text: "US - California Style", value: "en-US-cx" },
    { text: "English", value: "en" },
    { text: "Deutsch", value: "de-DE" },
    { text: "Deutsch Jugendslang", value: "de-DY" },
    { text: "Österreich", value: "de-AT" },
    { text: "Bayern", value: "de-BY" },
    { text: "Schwaben", value: "de-SB" },
    { text: "Schweiz", value: "de-CH" },
    { text: "France", value: "fr-FR" },
    { text: "हिन्दी", value: "hi-IN" },
    { text: "中文", value: "zh-CN" }
  ];

  const timezones = [
    { text: 'UTC -12:00', value: 'Etc/GMT+12' },
    { text: 'UTC -11:00', value: 'Pacific/Midway' },
    { text: 'UTC -10:00', value: 'Pacific/Honolulu' },
    { text: 'UTC -09:00', value: 'America/Anchorage' },
    { text: 'UTC -08:00', value: 'America/Los_Angeles' },
    { text: 'UTC -07:00', value: 'America/Denver' },
    { text: 'UTC -06:00', value: 'America/Chicago' },
    { text: 'UTC -05:00', value: 'America/New_York' },
    { text: 'UTC -04:00', value: 'America/Santiago' },
    { text: 'UTC -03:00', value: 'America/Argentina/Buenos_Aires' },
    { text: 'UTC -02:00', value: 'Atlantic/South_Georgia' },
    { text: 'UTC -01:00', value: 'Atlantic/Azores' },
    { text: 'UTC  00:00', value: 'UTC' },
    { text: 'UTC +01:00', value: 'Europe/Berlin' },
    { text: 'UTC +02:00', value: 'Europe/Athens' },
    { text: 'UTC +03:00', value: 'Europe/Moscow' },
    { text: 'UTC +04:00', value: 'Asia/Dubai' },
    { text: 'UTC +05:00', value: 'Asia/Karachi' },
    { text: 'UTC +06:00', value: 'Asia/Dhaka' },
    { text: 'UTC +07:00', value: 'Asia/Bangkok' },
    { text: 'UTC +08:00', value: 'Asia/Shanghai' },
    { text: 'UTC +09:00', value: 'Asia/Tokyo' },
    { text: 'UTC +10:00', value: 'Australia/Sydney' },
    { text: 'UTC +11:00', value: 'Pacific/Noumea' },
    { text: 'UTC +12:00', value: 'Pacific/Fiji' },
    { text: 'UTC +13:00', value: 'Pacific/Tongatapu' },
    { text: 'UTC +14:00', value: 'Pacific/Kiritimati' }
  ];

  const setTimezone = async (newTimezone) => {
    timezone.value = newTimezone;
    localStorage.setItem("appTimezone", newTimezone); // Save language in localStorage
  };

  const setLocale = async (newLocale) => {
    locale.value = newLocale;
    localStorage.setItem("appLocale", newLocale); // Save language in localStorage
    isLocaleReady.value = false;
    messages.value = await loadLocaleMessages(newLocale);
    isLocaleReady.value = true;
  };

  const initLocale = async () => {
    if (isLocaleReady.value) {
      return;
    }

    if (!initPromise) {
      initPromise = (async () => {
        messages.value = await loadLocaleMessages(locale.value);
        isLocaleReady.value = true;
      })().finally(() => {
        initPromise = undefined;
      });
    }

    await initPromise;
  };

  // Helper function for accessing translations
  const t = (key) => {
    const rawTranslation =
      key.split(".").reduce((o, i) => (o ? o[i] : key), messages.value) || key;

    // Replace \n with HTML <br /> tags if rawTranslation is a string
    return typeof rawTranslation === "string"
      ? rawTranslation.replace(/\n/g, "<br />")
      : rawTranslation;
  };

  return {
    locale,
    messages,
    languages,
    timezones,
    timezone,
    setLocale,
    setTimezone,
    initLocale,
    isLocaleReady,
    t,
  };
});
