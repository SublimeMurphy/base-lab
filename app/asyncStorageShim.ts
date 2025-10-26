type StoredValue = string | null;

type AsyncStorage = {
  getItem: (key: string) => Promise<StoredValue>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};

const memoryStore = new Map<string, string>();

const asyncStorage: AsyncStorage = {
  async getItem(key) {
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  },
  async setItem(key, value) {
    memoryStore.set(key, value);
  },
  async removeItem(key) {
    memoryStore.delete(key);
  },
  async clear() {
    memoryStore.clear();
  },
};

export default asyncStorage;
export const { getItem, setItem, removeItem, clear } = asyncStorage;
