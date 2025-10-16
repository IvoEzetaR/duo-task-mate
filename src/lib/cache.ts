interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes por defecto

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Obtener estadísticas del caché
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instancia global del caché
export const cache = new Cache();

// Limpiar caché periódicamente
setInterval(() => {
  cache.cleanup();
}, 60 * 1000); // Cada minuto

// Claves de caché predefinidas
export const CACHE_KEYS = {
  USERS: 'users',
  TASKS: 'tasks',
  USER_TASKS: (userId: string) => `user_${userId}_tasks`,
  USER_PROFILE: (userId: string) => `user_${userId}_profile`,
  TASK_COMMENTS: (taskId: string) => `task_${taskId}_comments`
} as const;

// Funciones de invalidación específicas
export const invalidateUserCache = (userId: string): void => {
  cache.invalidate(CACHE_KEYS.USER_PROFILE(userId));
  cache.invalidatePattern(`user_${userId}_`);
};

export const invalidateTaskCache = (taskId?: string): void => {
  cache.invalidate(CACHE_KEYS.TASKS);
  if (taskId) {
    cache.invalidate(CACHE_KEYS.TASK_COMMENTS(taskId));
  }
  cache.invalidatePattern('user_.*_tasks');
};

export const invalidateAllCache = (): void => {
  cache.clear();
};

// Wrapper para funciones asíncronas con caché
export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Intentar obtener del caché
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Si no está en caché, ejecutar la función
  try {
    const result = await fn();
    cache.set(key, result, ttl);
    return result;
  } catch (error) {
    // Si hay error, no cachear el resultado
    throw error;
  }
};