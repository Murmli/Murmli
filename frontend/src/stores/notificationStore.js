import { defineStore } from "pinia";
import { ref } from "vue";
import { useApiStore } from "./apiStore";

export const useNotificationStore = defineStore("notificationStore", () => {
  const messages = ref([]);
  const unreadCount = ref(0);
  const lastKnownCount = ref(0);
  const currentMessage = ref(null);
  const isDialogOpen = ref(false);
  const pollInterval = ref(null);
  const isPolling = ref(false);

  const POLL_INTERVAL_MS = 10000;

  async function fetchUnreadCount() {
    const apiStore = useApiStore();
    try {
      const response = await apiStore.apiRequest(
        "post",
        "/messages/unread/count",
        null,
        false
      );
      if (response && response.status === 200) {
        unreadCount.value = response.data.count;
        return response.data.count;
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
    return 0;
  }

  async function fetchMessages(limit = 20) {
    const apiStore = useApiStore();
    try {
      const response = await apiStore.apiRequest(
        "post",
        "/messages/read",
        { limit, unreadOnly: false },
        false
      );
      if (response && response.status === 200) {
        messages.value = response.data.messages;
        return response.data.messages;
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
    return [];
  }

  async function markAsRead(messageIds) {
    const apiStore = useApiStore();
    try {
      const response = await apiStore.apiRequest(
        "post",
        "/messages/mark-read",
        { messageIds },
        false
      );
      if (response && response.status === 200) {
        messages.value = messages.value.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        );
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }

  async function checkForNewMessages() {
    if (isPolling.value) return;
    isPolling.value = true;

    try {
      const newCount = await fetchUnreadCount();
      if (newCount > lastKnownCount.value && newCount > 0) {
        const newMessages = await fetchMessages(newCount);
        const unreadMessages = newMessages.filter((m) => !m.read);
        if (unreadMessages.length > 0) {
          showNotification(unreadMessages[0]);
        }
      }
      lastKnownCount.value = newCount;
    } finally {
      isPolling.value = false;
    }
  }

  function showNotification(message) {
    currentMessage.value = message;
    isDialogOpen.value = true;
  }

  function closeNotification() {
    if (currentMessage.value) {
      markAsRead([currentMessage.value._id]);
    }
    isDialogOpen.value = false;
    currentMessage.value = null;
  }

  function startPolling() {
    if (pollInterval.value) return;
    pollInterval.value = setInterval(checkForNewMessages, POLL_INTERVAL_MS);
    checkForNewMessages();
  }

  function stopPolling() {
    if (pollInterval.value) {
      clearInterval(pollInterval.value);
      pollInterval.value = null;
    }
  }

  async function initialize() {
    const count = await fetchUnreadCount();
    lastKnownCount.value = count;
    if (count > 0) {
      const allMessages = await fetchMessages(count);
      const unreadMessages = allMessages.filter((m) => !m.read);
      if (unreadMessages.length > 0) {
        showNotification(unreadMessages[0]);
      }
    }
    startPolling();
  }

  return {
    messages,
    unreadCount,
    currentMessage,
    isDialogOpen,
    lastKnownCount,
    fetchUnreadCount,
    fetchMessages,
    markAsRead,
    checkForNewMessages,
    showNotification,
    closeNotification,
    startPolling,
    stopPolling,
    initialize,
  };
});
