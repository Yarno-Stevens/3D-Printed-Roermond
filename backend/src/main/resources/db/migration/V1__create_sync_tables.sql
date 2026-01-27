-- Sync status tracking
CREATE TABLE sync_status
(
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    sync_type               VARCHAR(50) NOT NULL,
    last_successful_sync    TIMESTAMP NULL,
    last_attempted_sync     TIMESTAMP NULL,
    last_processed_page     INT NULL,
    total_records_processed INT       DEFAULT 0,
    failed_records          INT       DEFAULT 0,
    status                  VARCHAR(50) NOT NULL,
    error_message           VARCHAR(1000) NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sync_type (sync_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers
CREATE TABLE customers
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    woo_commerce_id BIGINT NULL,
    email           VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    last_synced_at  TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_email (email),
    INDEX           idx_email (email),
    INDEX           idx_woo_commerce_id (woo_commerce_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders
CREATE TABLE orders
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    woo_commerce_id BIGINT      NOT NULL,
    order_number    VARCHAR(50),
    total           DECIMAL(10, 2),
    status          VARCHAR(50) NOT NULL,
    customer_id     BIGINT NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    last_synced_at  TIMESTAMP NULL,
    UNIQUE KEY uk_woo_commerce_id (woo_commerce_id),
    INDEX           idx_status (status),
    INDEX           idx_customer (customer_id),
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items
CREATE TABLE order_items
(
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT NOT NULL,
    product_id   BIGINT,
    product_name VARCHAR(255),
    quantity     INT    NOT NULL,
    total        DECIMAL(10, 2),
    metadata     TEXT NULL,
    INDEX        idx_order (order_id),
    INDEX        idx_product (product_id),
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products
CREATE TABLE products
(
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    woo_commerce_id   BIGINT UNIQUE,
    name              VARCHAR(255) NOT NULL,
    slug              VARCHAR(255),
    sku               VARCHAR(100),
    price             DECIMAL(10, 2),
    regular_price     DECIMAL(10, 2),
    sale_price        DECIMAL(10, 2),
    description       TEXT,
    short_description TEXT,
    type              VARCHAR(50),
    status            VARCHAR(50),
    created_at        TIMESTAMP,
    modified_at       TIMESTAMP,
    last_synced_at    TIMESTAMP,
    INDEX             idx_woo_commerce_id (woo_commerce_id),
    INDEX             idx_sku (sku),
    INDEX             idx_status (status),
    INDEX             idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product variations
CREATE TABLE product_variations
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    woo_commerce_id BIGINT UNIQUE,
    product_id      BIGINT NOT NULL,
    sku             VARCHAR(100),
    price           DECIMAL(10, 2),
    regular_price   DECIMAL(10, 2),
    sale_price      DECIMAL(10, 2),
    description     TEXT,
    attributes      TEXT,
    weight          VARCHAR(50),
    dimensions      TEXT,
    status          VARCHAR(50),
    created_at      TIMESTAMP,
    modified_at     TIMESTAMP,
    last_synced_at  TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX           idx_woo_commerce_id (woo_commerce_id),
    INDEX           idx_product_id (product_id),
    INDEX           idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;