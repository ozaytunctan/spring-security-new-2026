# spring-security-new-2026 - Spring Boot Authentication

Spring Boot ile JWT tabanlı authentication mekanizması:

- **Register / Login** endpointleri
- **Role + Authority** modeli (`User -> Role -> Authority`)
- **Access Token + Refresh Token** yapısı (refresh token rotation)
- **Cache**: Redis ile kullanıcı detayları ve roller/yetkiler cachelenir

## Gereksinimler

- Java 17+
- Maven
- Docker ve Docker Compose (PostgreSQL ve Redis için)

## Docker Compose ile altyapıyı başlatma

PostgreSQL ve Redis servislerini ayağa kaldırmak için:

```bash
docker compose up -d
```

Servisler:
- **PostgreSQL**: `localhost:5432` (db: `securitydb`, user: `postgres`, password: `postgres`)
- **Redis**: `localhost:6379`

Durdurmak için:
```bash
docker compose down
```

Verileri silerek sıfırlamak için:
```bash
docker compose down -v
```

## Çalıştırma

Altyapı (Docker Compose) ayaktayken uygulamayı başlatın:

```bash
mvn spring-boot:run
```

Uygulama: `http://localhost:8080`  
Veritabanı: PostgreSQL (`jdbc:postgresql://localhost:5432/securitydb`)

## Varsayılan roller ve yetkiler

- `ROLE_USER`: `TODO_READ`, `TODO_WRITE`
- `ROLE_ADMIN`: `TODO_READ`, `TODO_WRITE`, `TODO_DELETE`, `USER_MANAGE`

## API

### Register
`POST /api/auth/register`
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret123",
  "roles": ["USER"]
}
```
`roles` alanı boş bırakılırsa varsayılan olarak `ROLE_USER` atanır.

### Login
`POST /api/auth/login`
```json
{
  "username": "alice",
  "password": "secret123"
}
```
Dönen cevap: `accessToken`, `refreshToken`, `roles`, `authorities`.

### Refresh token
`POST /api/auth/refresh`
```json
{
  "refreshToken": "<refresh-token>"
}
```
Refresh token rotation uygulanır (eski token revoke edilir, yenisi üretilir).

### Logout
`POST /api/auth/logout`
```json
{
  "refreshToken": "<refresh-token>"
}
```

### Korumalı örnek endpointler

- `GET /api/demo/profile` — kimliği doğrulanmış herkes
- `GET /api/demo/user` — `ROLE_USER`
- `GET /api/demo/admin` — `ROLE_ADMIN`
- `GET /api/demo/todo/write` — `TODO_WRITE` authority

Authorization header: `Authorization: Bearer <accessToken>`

## Redis Cache Davranışı ve Cache Miss Yönetimi

- **`CacheService`** (`src/main/java/tr/io/otunctan/service/CacheService.java`) `CacheManager` üzerinden merkezi cache işlemlerini yapar:
  - `get(cacheName, key, type)` → **oku** (hit/miss loglanır, hata durumunda miss gibi davranır)
  - `put(cacheName, key, value)` → **yaz**
  - `evict(cacheName, key)` → **sil/delete** (tek anahtar)
  - `clear(cacheName)` → cache'i temizle
- `CustomUserDetailsService.loadUserByUsername(...)` bu servis ile **cache-aside** çalışır:
  1. **Read:** `usersByUsername` Redis'ten okunur. Kayıt varsa (HIT) roller/yetkiler cache'ten döner.
  2. **MISS:** Kayıt yoksa loglanır, kullanıcı rol/yetkileri veritabanından yüklenir.
  3. **Write:** DB'den yüklenen `CustomUserDetails` Redis'e yazılır; sonraki isteklerde roller/yetkiler Redis'ten okunur.
- **Resilience:** Redis GET/PUT/evict hatalarında exception fırlatılmaz, loglanır ve gerekirse DB fallback uygulanır (uygulama kesilmez).
- **`CacheErrorHandler` (`RedisCacheConfig`):** Anotasyon tabanlı cache işlemlerinde oluşabilecek Redis hataları da yakalanır ve loglanır.
- Cache TTL: 10 dakika (`RedisCacheConfig` ve `application.yml`).

Redis bağlantı ayarları: `src/main/resources/application.yml` altındaki `spring.data.redis.*`.

## Notlar

- `app.jwt.secret` değerini production ortamında güçlü ve gizli bir değerle değiştirin.
- Access token süresi varsayılan 15 dk, refresh token süresi 7 gündür (`application.yml`).
- Rol/yetki güncellemelerinde (admin işlemleri vb.) ilgili kullanıcının cache kaydını temizleyin: `cacheService.evict(CustomUserDetailsService.USERS_CACHE, username)` (veya `userDetailsService.evictUserCache(username)`).
- Redis geçici olarak kapalı olsa bile kimlik doğrulama akışı cache miss yönetimi sayesinde DB fallback ile çalışmaya devam eder (performans Redis'e göre düşebilir).

