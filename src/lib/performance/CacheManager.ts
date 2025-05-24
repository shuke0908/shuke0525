// 캐시 전략 인터페이스
export interface CacheStrategy {
  get<T>(_key: string): Promise<T | null>;
  set<T>(_key: string, _value: T, _ttl?: number): Promise<void>;
  delete(_key: string): Promise<void>;
  clear(): Promise<void>;
  has(_key: string): Promise<boolean>;
}

// 메모리 캐시 구현
export class MemoryCache implements CacheStrategy {
  private cache = new Map<string, { value: any; expiry: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5분

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // 메모리 사용량 모니터링
  getSize(): number {
    return this.cache.size;
  }

  // 만료된 항목 정리
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// 로컬 스토리지 캐시 구현
export class LocalStorageCache implements CacheStrategy {
  private readonly prefix = 'app_cache_';
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24시간

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);

      if (Date.now() > parsed.expiry) {
        await this.delete(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error('LocalStorage cache get error:', error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const item = {
        value,
        expiry: Date.now() + ttl,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error: unknown) {
      console.error('LocalStorage cache set error:', error);
      // 용량 초과 시 오래된 항목 정리
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        await this.cleanup();
        // 재시도
        try {
          localStorage.setItem(
            this.prefix + key,
            JSON.stringify({
              value,
              expiry: Date.now() + ttl,
              timestamp: Date.now(),
            })
          );
        } catch (retryError) {
          console.error('LocalStorage cache retry failed:', retryError);
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  async has(key: string): Promise<boolean> {
    const item = await this.get(key);
    return item !== null;
  }

  // 만료된 항목 및 오래된 항목 정리
  private async cleanup(): Promise<void> {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

    const items = cacheKeys.map(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        return { key, ...item };
      } catch {
        return { key, expiry: 0, timestamp: 0 };
      }
    });

    // 만료된 항목 제거
    const now = Date.now();
    items.forEach(item => {
      if (now > item.expiry) {
        localStorage.removeItem(item.key);
      }
    });

    // 여전히 용량이 부족하면 오래된 항목부터 제거
    const validItems = items.filter(item => now <= item.expiry);
    if (validItems.length > 50) {
      // 최대 50개 항목 유지
      validItems
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, validItems.length - 50)
        .forEach(item => localStorage.removeItem(item.key));
    }
  }
}

// 세션 스토리지 캐시 구현
export class SessionStorageCache implements CacheStrategy {
  private readonly prefix = 'session_cache_';

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = sessionStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      return parsed.value;
    } catch (error) {
      console.error('SessionStorage cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const item = { value, timestamp: Date.now() };
      sessionStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('SessionStorage cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    sessionStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  async has(key: string): Promise<boolean> {
    return sessionStorage.getItem(this.prefix + key) !== null;
  }
}

// 캐시 계층 설정
export interface CacheLayer {
  name: string;
  strategy: CacheStrategy;
  priority: number;
  ttl: number;
}

// 다층 캐시 매니저
export class MultiLayerCacheManager {
  private layers: CacheLayer[] = [];
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    layerStats: new Map<string, { hits: number; misses: number }>(),
  };

  constructor() {
    // 기본 캐시 계층 설정
    this.addLayer('memory', new MemoryCache(), 1, 5 * 60 * 1000); // 5분
    this.addLayer('session', new SessionStorageCache(), 2, 30 * 60 * 1000); // 30분
    this.addLayer('local', new LocalStorageCache(), 3, 24 * 60 * 60 * 1000); // 24시간
  }

  addLayer(
    name: string,
    strategy: CacheStrategy,
    priority: number,
    ttl: number
  ): void {
    this.layers.push({ name, strategy, priority, ttl });
    this.layers.sort((a, b) => a.priority - b.priority);
    this.metrics.layerStats.set(name, { hits: 0, misses: 0 });
  }

  async get<T>(key: string): Promise<T | null> {
    for (const layer of this.layers) {
      try {
        const value = await layer.strategy.get<T>(key);

        if (value !== null) {
          this.metrics.hits++;
          const layerStats = this.metrics.layerStats.get(layer.name);
          if (layerStats) layerStats.hits++;

          // 상위 계층에 값 복사 (캐시 웜업)
          await this.warmupHigherLayers(key, value, layer.priority);

          return value;
        } else {
          const layerStats = this.metrics.layerStats.get(layer.name);
          if (layerStats) layerStats.misses++;
        }
      } catch (error) {
        console.error(`Cache layer ${layer.name} get error:`, error);
      }
    }

    this.metrics.misses++;
    return null;
  }

  async set<T>(key: string, value: T, customTTL?: number): Promise<void> {
    this.metrics.sets++;

    const setPromises = this.layers.map(async layer => {
      try {
        const ttl = customTTL || layer.ttl;
        await layer.strategy.set(key, value, ttl);
      } catch (error) {
        console.error(`Cache layer ${layer.name} set error:`, error);
      }
    });

    await Promise.allSettled(setPromises);
  }

  async delete(key: string): Promise<void> {
    this.metrics.deletes++;

    const deletePromises = this.layers.map(async layer => {
      try {
        await layer.strategy.delete(key);
      } catch (error) {
        console.error(`Cache layer ${layer.name} delete error:`, error);
      }
    });

    await Promise.allSettled(deletePromises);
  }

  async clear(): Promise<void> {
    const clearPromises = this.layers.map(async layer => {
      try {
        await layer.strategy.clear();
      } catch (error) {
        console.error(`Cache layer ${layer.name} clear error:`, error);
      }
    });

    await Promise.allSettled(clearPromises);

    // 메트릭 초기화
    this.resetMetrics();
  }

  // 상위 계층 웜업
  private async warmupHigherLayers<T>(
    key: string,
    value: T,
    currentPriority: number
  ): Promise<void> {
    const higherLayers = this.layers.filter(
      layer => layer.priority < currentPriority
    );

    const warmupPromises = higherLayers.map(async layer => {
      try {
        await layer.strategy.set(key, value, layer.ttl);
      } catch (error) {
        console.error(`Cache warmup error for layer ${layer.name}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  // 메트릭 조회
  getMetrics() {
    const hitRate =
      this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      layerStats: Object.fromEntries(this.metrics.layerStats),
    };
  }

  // 메트릭 초기화
  private resetMetrics(): void {
    this.metrics.hits = 0;
    this.metrics.misses = 0;
    this.metrics.sets = 0;
    this.metrics.deletes = 0;
    this.metrics.layerStats.forEach(stats => {
      stats.hits = 0;
      stats.misses = 0;
    });
  }

  // 특정 패턴으로 캐시 무효화
  async invalidatePattern(pattern: string): Promise<void> {
    // 메모리 캐시에서 패턴 매칭하여 삭제
    const memoryLayer = this.layers.find(layer => layer.name === 'memory');
    if (memoryLayer?.strategy instanceof MemoryCache) {
      const cache = memoryLayer.strategy as any;
      const keys = Array.from(cache.cache.keys());

      for (const key of keys) {
        if (typeof key === 'string' && key.includes(pattern)) {
          await this.delete(key);
        }
      }
    }
  }

  // 정기적인 정리 작업
  async maintenance(): Promise<void> {
    for (const layer of this.layers) {
      try {
        if (layer.strategy instanceof MemoryCache) {
          layer.strategy.cleanup();
        }
      } catch (error) {
        console.error(
          `Cache maintenance error for layer ${layer.name}:`,
          error
        );
      }
    }
  }
}

// 싱글톤 캐시 매니저 인스턴스
export const cacheManager = new MultiLayerCacheManager();

// 자동 정리 작업 설정
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      cacheManager.maintenance();
    },
    5 * 60 * 1000
  ); // 5분마다 정리
}

// 캐시 데코레이터
export function Cached(key: string, ttl?: number) {
  return function (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}_${JSON.stringify(args)}`;

      // 캐시에서 조회
      let result = await cacheManager.get(cacheKey);

      if (result === null) {
        // 캐시 미스 - 원본 메서드 실행
        result = await method.apply(this, args);

        // 결과를 캐시에 저장
        await cacheManager.set(cacheKey, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
}

// React Query와 통합된 캐시 무효화
export function invalidateQueryCache(queryKeys: string[]): void {
  queryKeys.forEach(async key => {
    await cacheManager.invalidatePattern(key);
  });
}

export default cacheManager;
