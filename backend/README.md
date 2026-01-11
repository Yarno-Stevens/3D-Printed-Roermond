# WooCommerce Sync Backend (Java 25)

Spring Boot applicatie voor het synchroniseren van WooCommerce orders en klanten naar een lokale MySQL database.

**✨ Geconfigureerd voor Java 25!**

## Features

✅ **Automatische synchronisatie** met WooCommerce API  
✅ **Incremental sync** - alleen gewijzigde data wordt opgehaald  
✅ **Paginering** - geen limiet op aantal orders/klanten  
✅ **Error recovery** - hervat waar het gebleven was bij crashes  
✅ **Rate limiting** - beschermt je WooCommerce API  
✅ **REST API** voor monitoring en statistieken  
✅ **Scheduled cron jobs** voor automatische sync  
✅ **Java 25 ready** - nieuwste Java versie support

## Tech Stack

- **Java 25** (OpenJDK 25.0.1+)
- Spring Boot 3.4.1
- MySQL 8.0+
- Flyway (database migrations)
- Lombok 1.18.36
- Maven

## Quick Start

```bash
# 1. Pas application.properties aan (database + WooCommerce credentials)
# 2. Build & run
mvn clean install
mvn spring-boot:run
```

## Java 25 Configuratie

Dit project is specifiek geconfigureerd voor Java 25:
- Spring Boot 3.4.1 (nieuwste versie)
- Lombok 1.18.36 (Java 25 compatible)
- Maven Compiler Plugin 3.13.0

### Als je Lombok errors krijgt:

**Fix 1 - IntelliJ IDEA:**
1. File > Invalidate Caches > Invalidate and Restart
2. Settings > Plugins > Installeer "Lombok" plugin
3. Settings > Build > Compiler > Annotation Processors > Enable ✓

**Fix 2 - Command line:**
```bash
mvn clean install -U
```

**Fix 3 - Verifieer Java versie:**
```bash
java -version  # Moet 25.0.1+ zijn
echo $JAVA_HOME
```

## API Endpoints

- `GET /api/admin/sync/dashboard` - Sync status overzicht
- `GET /api/admin/sync/orders/recent` - Recent gesyncte orders  
- `GET /api/admin/sync/stats` - Statistieken
- `POST /api/admin/sync/trigger` - Manual sync starten

## Database Setup

```sql
CREATE DATABASE woocommerce_sync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## WooCommerce API Keys

1. WooCommerce > Settings > Advanced > REST API
2. Add Key met **Read** permissions
3. Kopieer key + secret naar application.properties

## Troubleshooting

**Error: ExceptionInInitializerError met Lombok**
→ Run `mvn clean install -U`  
→ Update IntelliJ Lombok plugin  
→ Enable Annotation Processing

**Database connection failed**
→ Check application.properties credentials  
→ Verifieer MySQL draait

**Rate limit errors**
→ Verhoog `woocommerce.sync.rate-limit-ms=2000`

## Licentie

Proprietary - Embediq © 2024-2026
