import { defineStore } from "pinia";
import { useApiStore } from "./apiStore";
import { useNetworkStore } from "./networkStore";
import { cache } from "@/utils/cache";
import { offlineQueue } from "@/utils/offlineQueue";

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
    isOffline: false,
    pendingChangesCount: 0,
    isSyncing: false,
    offlineListenersInitialized: false,
  }),

  getters: {
    sortedFavorites(state) {
      return [...state.favorites].sort((a, b) => b.clicks - a.clicks);
    },
    hasPendingChanges(state) {
      return state.pendingChangesCount > 0;
    },
    pendingChangesText(state) {
      return state.pendingChangesCount === 1 
        ? '1 ausstehende Änderung' 
        : `${state.pendingChangesCount} ausstehende Änderungen`;
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

    // Offline functionality methods
    initOfflineSupport() {
      if (this.offlineListenersInitialized) return;
      
      const networkStore = useNetworkStore();
      networkStore.initNetworkListeners();
      
      // Watch for online status changes
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Initial status check
      this.updateOfflineStatus();
      this.updatePendingChangesCount();
      
      this.offlineListenersInitialized = true;
      console.log('[ShoppingListStore] Offline support initialized');
    },

    updateOfflineStatus() {
      const networkStore = useNetworkStore();
      this.isOffline = networkStore.isOffline;
    },

    handleOnline() {
      console.log('[ShoppingListStore] Connection restored - syncing pending changes');
      this.updateOfflineStatus();
      this.syncPendingChanges();
    },

    handleOffline() {
      console.log('[ShoppingListStore] Connection lost - offline mode active');
      this.updateOfflineStatus();
    },

    updatePendingChangesCount() {
      this.pendingChangesCount = offlineQueue.getCount();
    },

    async syncPendingChanges() {
      if (this.isSyncing) return;
      
      const networkStore = useNetworkStore();
      if (!networkStore.isOnline) {
        console.log('[ShoppingListStore] Cannot sync - still offline');
        return;
      }

      this.isSyncing = true;
      networkStore.setSyncInProgress(true);
      
      const queue = offlineQueue.getAll();
      console.log(`[ShoppingListStore] Syncing ${queue.length} pending changes`);
      
      let successCount = 0;
      let failCount = 0;

      for (const queueItem of queue) {
        try {
          await this.executeQueuedOperation(queueItem);
          offlineQueue.remove(queueItem.id);
          successCount++;
        } catch (error) {
          console.error(`[ShoppingListStore] Failed to sync operation ${queueItem.id}:`, error);
          offlineQueue.markForRetry(queueItem.id);
          
          // Nach 3 Fehlversuchen entfernen
          if (queueItem.retryCount >= 3) {
            offlineQueue.remove(queueItem.id);
            failCount++;
          }
        }
      }

      this.updatePendingChangesCount();
      networkStore.recordSyncAttempt();
      networkStore.setSyncInProgress(false);
      this.isSyncing = false;

      console.log(`[ShoppingListStore] Sync complete: ${successCount} success, ${failCount} failed`);
      
      // Nur vom Server aktualisieren wenn:
      // 1. Es Fehler gab (damit wir den aktuellen Stand vom Server holen)
      // 2. Die Liste mit anderen geteilt ist (damit wir deren Änderungen sehen)
      if (failCount > 0 || (this.sharedWith && this.sharedWith.length > 0)) {
        console.log('[ShoppingListStore] Refreshing from server due to failures or shared list');
        await this.readShoppingList(false);
      } else if (successCount > 0) {
        // Bei erfolgreichem Sync ohne Fehler und ohne geteilte Liste:
        // Nur das updatedAt Timestamp aktualisieren, aber die lokale Liste behalten
        // da sie jetzt mit dem Server synchron ist
        this.lastUpdate = new Date().toISOString();
        
        // Entferne alle _isPending Markierungen
        this.items.forEach(item => delete item._isPending);
        this.saveCache();
        console.log('[ShoppingListStore] Local list is now in sync, no server refresh needed');
      }
    },

    async executeQueuedOperation(queueItem) {
      const { operation, data } = queueItem;
      const apiStore = useApiStore();
      
      switch (operation) {
        case 'create':
          await this.addItemToShoppingList(data.text);
          break;
        case 'update':
          await this.updateItem(
            data.itemId,
            data.name,
            data.quantity,
            data.unit,
            data.active,
            data.category
          );
          break;
        case 'toggleActive': {
          // Bei toggleActive den gespeicherten Ziel-Zustand direkt setzen
          // Nicht toggeln, da wir bereits den gewünschten Zustand kennen
          const item = this.items.find(item => item._id === data.itemId);
          if (item) {
            // Direkt den API-Call machen ohne lokale Änderungen
            const request = await apiStore.apiRequest(
              "put",
              "/shoppingList/item/update",
              {
                itemId: data.itemId,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit?.id || 0,
                category: item.category?.id,
                active: data.active, // Der gespeicherte Ziel-Zustand
                listId: this.listId,
              },
              false
            );
            
            if (request.status === 200) {
              // Update local state to match server
              item.active = data.active;
              delete item._isPending;
              this.saveCache();
            }
          }
          break;
        }
        case 'delete':
          await this.deleteItem(data.itemId);
          break;
        case 'deleteChecked': {
          // Direkt alle checked items löschen ohne lokale Filterung
          const request = await apiStore.apiRequest(
            "delete",
            "/shoppingList/item/delete/checked",
            { listId: this.listId },
            false
          );
          if (request.status === 200) {
            // Liste vom Response aktualisieren
            this.items = request.data.list.items;
            this.saveCache();
          }
          break;
        }
        case 'deleteAll':
          await this.deleteAllItems();
          break;
        default:
          console.warn(`[ShoppingListStore] Unknown operation: ${operation}`);
      }
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

      // Initialize offline support
      this.initOfflineSupport();

      this.favorites = this.getFavorites();
      this.loadCache();
      
      // Apply any pending changes to local cache
      const networkStore = useNetworkStore();
      if (networkStore.isOffline && this.items.length > 0) {
        this.items = offlineQueue.applyPendingChangesToLocal(this.items);
        this.updatePendingChangesCount();
      }
      
      await this.fetchCategories();
      if (storedListId) {
        await this.setListId(storedListId, false);
        await this.readShoppingList(true);
      } else {
        await this.createShoppingList();
      }
      
      // If we come back online and have pending changes, sync them
      if (!networkStore.isOffline && this.hasPendingChanges) {
        setTimeout(() => this.syncPendingChanges(), 2000);
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
      const networkStore = useNetworkStore();

      // Wenn offline, nur aus Cache laden
      if (networkStore.isOffline) {
        console.log('[ShoppingListStore] Offline - loading from cache only');
        this.loadCache();
        // Wende ausstehende Änderungen auf den Cache an
        const pendingCount = offlineQueue.getCount();
        if (pendingCount > 0) {
          this.items = offlineQueue.applyPendingChangesToLocal(this.items);
          this.updatePendingChangesCount();
        }
        return;
      }

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
          // Server-Daten als Basis nehmen
          let serverItems = reqList.data.list.items;
          
          // Wenn es ausstehende Änderungen gibt, diese auf die Server-Daten anwenden
          // statt die lokalen Änderungen zu verlieren
          const pendingCount = offlineQueue.getCount();
          if (pendingCount > 0) {
            console.log(`[ShoppingListStore] Applying ${pendingCount} pending changes to server data`);
            // Temporär die Server-Items setzen, damit applyPendingChangesToLocal darauf arbeiten kann
            this.items = serverItems;
            this.items = offlineQueue.applyPendingChangesToLocal(this.items);
          } else {
            // Keine ausstehenden Änderungen - Server-Daten übernehmen
            this.items = serverItems;
          }
          
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
        // Bei Fehler aus Cache laden
        this.loadCache();
      }
    },

    async addItemToShoppingList(text) {
      const apiStore = useApiStore();
      const networkStore = useNetworkStore();
      this.isAddingItem = true;
      
      try {
        const ok = await this.ensureListId();
        if (!ok) {
          throw new Error("No shopping list available");
        }

        // Wenn offline, zur Queue hinzufügen
        if (networkStore.isOffline) {
          console.log('[ShoppingListStore] Offline - queueing item creation:', text);
          
          // Parse einfache Items für lokale Anzeige
          const parsedItems = this.parseSimpleItemText(text);
          parsedItems.forEach(item => {
            this.items.push({
              ...item,
              _isPending: true,
              _id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
          });
          
          offlineQueue.add('create', { text });
          this.updatePendingChangesCount();
          this.saveCache();
          this.isAddingItem = false;
          return;
        }

        this.pendingUpdates++;

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
          if (request.data && request.data.list && request.data.list.updatedAt) {
            this.lastUpdate = request.data.list.updatedAt;
          }
          this.applyCategoryOverrides();
          this.saveCache();
        }
      } catch (error) {
        // Bei Netzwerkfehler, zur Queue hinzufügen
        if (!navigator.onLine || error.message?.includes('network')) {
          console.log('[ShoppingListStore] Network error - queueing item creation:', text);
          offlineQueue.add('create', { text });
          this.updatePendingChangesCount();
          
          // Lokale Anzeige aktualisieren
          const parsedItems = this.parseSimpleItemText(text);
          parsedItems.forEach(item => {
            this.items.push({
              ...item,
              _isPending: true,
              _id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
          });
          this.saveCache();
        } else {
          this.error = error;
        }
      }
      finally {
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
        this.isAddingItem = false;
      }
    },

    // Hilfsmethode zum Parsen einfacher Item-Texte für Offline-Anzeige
    parseSimpleItemText(text) {
      const items = [];
      const lines = text.split(/[,\n]/).map(l => l.trim()).filter(l => l);
      
      lines.forEach(line => {
        // Einfaches Parsing: "2 Äpfel" oder "Milch"
        const match = line.match(/^(\d+(?:\.\d+)?)?\s*(.+)$/);
        if (match) {
          const quantity = parseFloat(match[1]) || 1;
          const name = match[2].trim();
          items.push({
            name,
            quantity,
            unit: { id: 0, name: 'Stück' },
            category: { id: 0, name: 'Sonstiges' },
            active: true,
            recipe: false,
          });
        }
      });
      
      return items.length > 0 ? items : [{
        name: text.trim(),
        quantity: 1,
        unit: { id: 0, name: 'Stück' },
        category: { id: 0, name: 'Sonstiges' },
        active: true,
        recipe: false,
      }];
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
      
      this.pendingUpdates++;
      
      try {
        const request = await apiStore.apiRequest(
          "delete",
          "/shoppingList/item/delete/all",
          { listId: this.listId }
        );
        if (request.status == 200) {
          this.items = [];
          if (request.data && request.data.list && request.data.list.updatedAt) {
            this.lastUpdate = request.data.list.updatedAt;
          }
          this.saveCache();
        }
      } catch (error) {
        this.error = error;
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

    async deleteCheckedItems() {
      const apiStore = useApiStore();
      const networkStore = useNetworkStore();
      
      // Lokal sofort entfernen
      const itemsToDelete = this.items.filter((item) => item.active === false);
      this.items = this.items.filter((item) => item.active !== false);
      this.saveCache();
      
      // Wenn offline, zur Queue hinzufügen
      if (networkStore.isOffline) {
        console.log('[ShoppingListStore] Offline - queueing delete checked items');
        offlineQueue.add('deleteChecked', { listId: this.listId });
        this.updatePendingChangesCount();
        return;
      }
      
      this.pendingUpdates++;

      try {
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
          if (request.data && request.data.list && request.data.list.updatedAt) {
            this.lastUpdate = request.data.list.updatedAt;
          }
          this.saveCache();
        }
      } catch (error) {
        // Bei Netzwerkfehler, zur Queue hinzufügen
        if (!navigator.onLine || error.message?.includes('network')) {
          console.log('[ShoppingListStore] Network error - queueing delete checked items');
          offlineQueue.add('deleteChecked', { listId: this.listId });
          this.updatePendingChangesCount();
          
          // Items bleiben lokal entfernt (optimistisch)
        } else {
          this.error = error;
          // Bei anderen Fehlern, Items wiederherstellen
          this.items = [...this.items, ...itemsToDelete];
          this.saveCache();
        }
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

    async deleteItem(itemId) {
      const apiStore = useApiStore();
      const networkStore = useNetworkStore();
      
      // Lokal sofort entfernen
      const itemToDelete = this.items.find((item) => item._id === itemId);
      this.items = this.items.filter((item) => item._id !== itemId);
      this.saveCache();
      
      // Wenn offline, zur Queue hinzufügen
      if (networkStore.isOffline) {
        console.log('[ShoppingListStore] Offline - queueing item deletion:', itemId);
        offlineQueue.add('delete', { 
          itemId,
          itemName: itemToDelete?.name 
        });
        this.updatePendingChangesCount();
        return;
      }

      this.pendingUpdates++;
      
      try {
        const success = await apiStore.apiRequest(
          "delete",
          "/shoppingList/item/delete",
          { itemId }
        );
        if (!success) {
          // Bei Fehler, Item zurück zur Liste hinzufügen
          if (itemToDelete) {
            this.items.push(itemToDelete);
            this.saveCache();
          }
        } else {
           if (success.data && success.data.list && success.data.list.updatedAt) {
             this.lastUpdate = success.data.list.updatedAt;
           }
        }
      } catch (error) {
        // Bei Netzwerkfehler, zur Queue hinzufügen
        if (!navigator.onLine || error.message?.includes('network')) {
          console.log('[ShoppingListStore] Network error - queueing item deletion:', itemId);
          offlineQueue.add('delete', { 
            itemId,
            itemName: itemToDelete?.name 
          });
          this.updatePendingChangesCount();
        } else {
          this.error = error;
          // Item zurück zur Liste hinzufügen bei anderen Fehlern
          if (itemToDelete) {
            this.items.push(itemToDelete);
            this.saveCache();
          }
        }
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

    async updateItem(itemId, name, quantity, unit, active, category) {
      const apiStore = useApiStore();
      const networkStore = useNetworkStore();
      
      try {
        // Überprüfung, ob unit ein Objekt ist, und Ersetzen mit unit.id
        if (typeof unit === "object" && unit !== null && "id" in unit) {
          unit = unit.id; // Ersetze das Objekt mit seiner ID
        }

        // Item lokal aktualisieren
        const item = this.items.find((item) => item._id === itemId);
        const originalState = item ? { ...item } : null;
        
        if (item) {
          item.name = name;
          item.quantity = quantity;
          item.active = active;
          item._isPending = networkStore.isOffline;
          if (category !== undefined) {
            const catObj = this.categories.find(
              (c) => Number(c.id) === Number(category)
            );
            item.category = { id: Number(category), name: catObj?.name };
          }
        }
        
        this.saveCache();

        // Wenn offline, zur Queue hinzufügen
        if (networkStore.isOffline) {
          console.log('[ShoppingListStore] Offline - queueing item update:', itemId);
          offlineQueue.add('update', { 
            itemId, 
            name, 
            quantity, 
            unit, 
            active, 
            category,
            listId: this.listId 
          });
          this.updatePendingChangesCount();
          
          if (category !== undefined) {
            this.setCategoryOverride(name, category);
          }
          return true;
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
          
          // Remove pending status
          if (item) {
            delete item._isPending;
          }
          this.saveCache();
          return true;
        }
      } catch (error) {
        // Bei Netzwerkfehler, zur Queue hinzufügen
        if (!navigator.onLine || error.message?.includes('network')) {
          console.log('[ShoppingListStore] Network error - queueing item update:', itemId);
          offlineQueue.add('update', { 
            itemId, 
            name, 
            quantity, 
            unit, 
            active, 
            category,
            listId: this.listId 
          });
          this.updatePendingChangesCount();
          
          if (category !== undefined) {
            this.setCategoryOverride(name, category);
          }
          return true;
        } else {
          this.error = error;
          // Bei anderen Fehlern, Original-Zustand wiederherstellen
          const item = this.items.find((item) => item._id === itemId);
          if (item && originalState) {
            Object.assign(item, originalState);
            this.saveCache();
          }
          return false;
        }
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

    async toggleItemActive(itemId, itemName) {
      const apiStore = useApiStore();
      const networkStore = useNetworkStore();
      
      // Item finden und lokal togglen
      const item = this.items.find((item) => item._id === itemId);
      if (!item) return false;
      
      const newActiveState = !item.active;
      item.active = newActiveState;
      item._isPending = networkStore.isOffline;
      this.saveCache();
      
      // Wenn offline, zur Queue hinzufügen
      if (networkStore.isOffline) {
        console.log('[ShoppingListStore] Offline - queueing toggle:', itemId);
        offlineQueue.add('toggleActive', { 
          itemId, 
          itemName,
          active: newActiveState 
        });
        this.updatePendingChangesCount();
        return true;
      }
      
      this.pendingUpdates++;

      try {
        const request = await apiStore.apiRequest(
          "put",
          "/shoppingList/item/update",
          {
            itemId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit?.id || 0,
            category: item.category?.id,
            active: newActiveState,
            listId: this.listId,
          },
          false
        );

        if (request.status == 200) {
          if (request.data && request.data.list && request.data.list.updatedAt) {
            this.lastUpdate = request.data.list.updatedAt;
          }
          delete item._isPending;
          this.saveCache();
          return true;
        }
      } catch (error) {
        // Bei Netzwerkfehler, zur Queue hinzufügen
        if (!navigator.onLine || error.message?.includes('network')) {
          console.log('[ShoppingListStore] Network error - queueing toggle:', itemId);
          offlineQueue.add('toggleActive', { 
            itemId, 
            itemName,
            active: newActiveState 
          });
          this.updatePendingChangesCount();
          return true;
        } else {
          this.error = error;
          // Toggle rückgängig machen
          item.active = !newActiveState;
          this.saveCache();
          return false;
        }
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
