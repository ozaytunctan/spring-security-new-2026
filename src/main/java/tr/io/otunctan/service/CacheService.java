package tr.io.otunctan.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheService.class);

    private final CacheManager cacheManager;

    public CacheService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Cache'ten değer okur (read).
     * Cache bulunamazsa, kayıt yoksa (miss) veya Redis hatası oluşursa Optional.empty() döner.
     */
    public <T> Optional<T> get(String cacheName, Object key, Class<T> type) {
        Cache cache = resolveCache(cacheName);
        if (cache == null) {
            return Optional.empty();
        }
        try {
            T value = cache.get(key, type);
            if (value != null) {
                log.debug("Cache HIT: cache='{}', key='{}'", cacheName, key);
                return Optional.of(value);
            }
            log.info("Cache MISS: cache='{}', key='{}'", cacheName, key);
            return Optional.empty();
        } catch (Exception ex) {
            log.warn("Cache READ hatası (miss gibi değerlendirildi): cache='{}', key='{}', reason='{}'",
                    cacheName, key, ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Cache'e değer yazar (write/put).
     * Hata durumunda exception fırlatmaz, loglar ve akışa devam eder.
     */
    public void put(String cacheName, Object key, Object value) {
        if (value == null) {
            return;
        }
        Cache cache = resolveCache(cacheName);
        if (cache == null) {
            return;
        }
        try {
            cache.put(key, value);
            log.debug("Cache PUT: cache='{}', key='{}'", cacheName, key);
        } catch (Exception ex) {
            log.warn("Cache PUT hatası: cache='{}', key='{}', reason='{}'",
                    cacheName, key, ex.getMessage());
        }
    }

    /**
     * Cache'ten belirli bir anahtarı siler (delete/evict).
     */
    public void evict(String cacheName, Object key) {
        Cache cache = resolveCache(cacheName);
        if (cache == null) {
            return;
        }
        try {
            cache.evict(key);
            log.info("Cache EVICT: cache='{}', key='{}'", cacheName, key);
        } catch (Exception ex) {
            log.warn("Cache EVICT hatası: cache='{}', key='{}', reason='{}'",
                    cacheName, key, ex.getMessage());
        }
    }

    /**
     * Cache'i tamamen temizler (clear).
     */
    public void clear(String cacheName) {
        Cache cache = resolveCache(cacheName);
        if (cache == null) {
            return;
        }
        try {
            cache.clear();
            log.info("Cache CLEAR: cache='{}'", cacheName);
        } catch (Exception ex) {
            log.warn("Cache CLEAR hatası: cache='{}', reason='{}'", cacheName, ex.getMessage());
        }
    }

    private Cache resolveCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache == null) {
            log.warn("Cache bulunamadı: '{}'", cacheName);
        }
        return cache;
    }
}

