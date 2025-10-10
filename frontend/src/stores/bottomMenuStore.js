import { defineStore } from 'pinia'

export const useBottomMenuStore = defineStore('bottomMenu', {
  state: () => ({
    // Array of { title: string, action: Function, icon?: string }
    items: [],
    owner: null // string identifier of the current layout owner
  }),
  actions: {
    setItems(items, owner) {
      this.owner = owner ?? this.owner
      this.items = Array.isArray(items) ? items : []
    },
    clearItems(owner) {
      // Only clear if the caller still owns the menu to avoid route race conditions
      if (!owner || this.owner === owner) {
        this.items = []
        this.owner = null
      }
    },
    forceClear() {
      this.items = []
      this.owner = null
    }
  }
})
