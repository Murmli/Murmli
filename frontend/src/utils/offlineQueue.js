import { cache } from './cache';

const PENDING_CHANGES_KEY = 'shoppingListPendingChanges';
const LAST_SYNC_KEY = 'shoppingListLastSync';

/**
 * Queue für ausstehende Änderungen wenn offline
 * Speichert Operationen die synchronisiert werden müssen
 */
export const offlineQueue = {
  /**
   * Fügt eine Operation zur Queue hinzu
   * @param {string} operation - 'create', 'update', 'delete', 'deleteChecked', 'toggleActive'
   * @param {Object} data - Die Daten der Operation
   * @returns {Object} Die erstellte Queue-Operation mit ID
   */
  add(operation, data) {
    const queue = this.getAll();
    const queueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    queue.push(queueItem);
    this.save(queue);
    console.log(`[OfflineQueue] Added ${operation} operation:`, queueItem.id);
    return queueItem;
  },

  /**
   * Holt alle ausstehenden Änderungen
   * @returns {Array} Array ausstehender Operationen
   */
  getAll() {
    return cache.get(PENDING_CHANGES_KEY) || [];
  },

  /**
   * Speichert die Queue
   * @param {Array} queue 
   */
  save(queue) {
    cache.set(PENDING_CHANGES_KEY, queue);
  },

  /**
   * Entfernt eine Operation aus der Queue
   * @param {string} id 
   */
  remove(id) {
    const queue = this.getAll().filter(item => item.id !== id);
    this.save(queue);
    console.log(`[OfflineQueue] Removed operation:`, id);
  },

  /**
   * Markiert eine Operation für Retry
   * @param {string} id 
   */
  markForRetry(id) {
    const queue = this.getAll().map(item => {
      if (item.id === id) {
        return { ...item, retryCount: item.retryCount + 1 };
      }
      return item;
    });
    this.save(queue);
  },

  /**
   * Löscht die komplette Queue
   */
  clear() {
    cache.remove(PENDING_CHANGES_KEY);
    console.log('[OfflineQueue] Cleared all pending changes');
  },

  /**
   * Anzahl ausstehender Änderungen
   * @returns {number}
   */
  getCount() {
    return this.getAll().length;
  },

  /**
   * Speichert den letzten erfolgreichen Sync-Zeitpunkt
   * @param {number} timestamp 
   */
  setLastSync(timestamp) {
    cache.set(LAST_SYNC_KEY, timestamp);
  },

  /**
   * Holt den letzten Sync-Zeitpunkt
   * @returns {number|null}
   */
  getLastSync() {
    return cache.get(LAST_SYNC_KEY);
  },

  /**
   * Wendet alle ausstehenden Änderungen auf lokale Daten an
   * @param {Array} currentItems - Aktuelle Items aus dem Store
   * @returns {Array} Aktualisierte Items
   */
  applyPendingChangesToLocal(currentItems) {
    const queue = this.getAll();
    let items = [...currentItems];

    queue.forEach(queueItem => {
      const { operation, data } = queueItem;
      
      switch (operation) {
        case 'create':
          // Prüfen ob Item bereits existiert (verhindern von Duplikaten)
          const exists = items.some(item => 
            item.name.toLowerCase() === data.name.toLowerCase() && 
            item.category === data.category
          );
          if (!exists) {
            items.push({
              ...data,
              _isPending: true, // Markieren als ausstehend
            });
          }
          break;

        case 'update':
          items = items.map(item => {
            if (item._id === data._id || item.name === data.name) {
              return { ...item, ...data.updates, _isPending: true };
            }
            return item;
          });
          break;

        case 'toggleActive':
          // Verwende den gespeicherten Ziel-Zustand (data.active) statt zu toggeln
          items = items.map(item => {
            if (item._id === data.itemId || item.name === data.itemName) {
              return { ...item, active: data.active, _isPending: true };
            }
            return item;
          });
          break;

        case 'delete':
          items = items.filter(item => 
            item._id !== data._id && item.name !== data.itemName
          );
          break;

        case 'deleteChecked':
          items = items.filter(item => item.active !== false);
          break;

        case 'deleteAll':
          items = [];
          break;
      }
    });

    return items;
  },
};
