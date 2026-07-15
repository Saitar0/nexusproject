// Fallback para sessionStorage quando Tauri Store não está disponível
const useSessionStorage = () => {
  return {
    setItem: (key: string, value: string) => sessionStorage.setItem(key, value),
    getItem: (key: string) => sessionStorage.getItem(key),
    removeItem: (key: string) => sessionStorage.removeItem(key),
  };
};

export const storageService = {
  async setToken(token: string) {
    const storage = useSessionStorage();
    storage.setItem('authToken', token);
  },

  async getToken(): Promise<string | null> {
    const storage = useSessionStorage();
    return storage.getItem('authToken');
  },

  async removeToken() {
    const storage = useSessionStorage();
    storage.removeItem('authToken');
  },

  async setUser(user: any) {
    const storage = useSessionStorage();
    storage.setItem('user', JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const storage = useSessionStorage();
    const user = storage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  async removeUser() {
    const storage = useSessionStorage();
    storage.removeItem('user');
  },

  async clearAll() {
    const storage = useSessionStorage();
    storage.removeItem('authToken');
    storage.removeItem('user');
  },
};
