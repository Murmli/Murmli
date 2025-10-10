<template>
    <v-dialog v-model="dialog" max-width="500">
        <v-card>
            <v-card-title>{{ languageStore.t('general.error') }}</v-card-title>
            <v-card-text>
                <p class="pb-3">{{ languageStore.t('general.errorMessage') }}</p>
                <code>Reason: {{ apiStore.error?.response?.data?.message || apiStore.error?.message || 'Unknown error' }}</code>
            </v-card-text>

            <v-card-actions>
                <v-btn icon @click="copyToClipboard"><v-icon icon="mdi-content-copy"></v-icon></v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="closeDialog">{{
                    languageStore.t('general.close') }}</v-btn>
                <v-btn color="error" @click="reportError">{{ languageStore.t('general.report') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useLanguageStore } from '@/stores/languageStore';

// Initialize the store
const languageStore = useLanguageStore();
const apiStore = useApiStore();
const dialog = ref(false);

// Watch for changes in the apiStore.error
watch(
    () => apiStore.error,
    (newError) => {
        if (newError) {
            dialog.value = true; // Show the dialog if there's an error
        }
    }
);

// Close the dialog and reset the error state
const closeDialog = () => {
    dialog.value = false;
    apiStore.clearError();
};

// Close the dialog and reset the error state
const reportError = () => {
    const error = apiStore.error;
    if (error?.config?.headers) {
        delete error.config.headers["x-header-secret-key"];
    }

    const emailPayload = {
        message: error?.response?.data?.message || error?.message,
        request: {
            method: error?.config?.method,
            url: error?.config?.url,
            data: error?.config?.data,
        },
        response: error?.response?.data,
    };

    const subject = encodeURIComponent("Murmli Error");
    const body = encodeURIComponent(`Error: ${JSON.stringify(emailPayload, null, 2)} \n\n`);
    const mailtoLink = `mailto:prompt-engineered@protonmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink; // Opens the mail client
    closeDialog();
};

const copyToClipboard = async () => {
    const error = apiStore.error;
    if (error?.config?.headers) {
        delete error.config.headers["x-header-secret-key"];
    }

    const clipboardPayload = {
        message: error?.response?.data?.message || error?.message,
        request: {
            method: error?.config?.method,
            url: error?.config?.url,
            data: error?.config?.data,
        },
        response: error?.response?.data,
    };

    const errorMessage = apiStore.error ? JSON.stringify(clipboardPayload, null, 2) : "Unknown error";
    try {
        await navigator.clipboard.writeText(errorMessage);
    } catch (err) {
        console.error("Failed to copy:", err);
    }
};
</script>
