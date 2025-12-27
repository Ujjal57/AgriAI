-- SQL file to create a database and table for storing Contact Us submissions
-- Compatible with XAMPP (MySQL / MariaDB). Import via phpMyAdmin or run with mysql client.

-- 1) Create the database (skip if you already have one)
CREATE DATABASE IF NOT EXISTS `agri_ai` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `agri_ai`;

-- 2) Create a contacts table. Stores first/last name, phone, email, message, and timestamps.
DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `message` TEXT NOT NULL,
  `source` VARCHAR(50) DEFAULT 'web',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Example insert (for testing)
INSERT INTO `contacts` (`first_name`, `last_name`, `phone`, `email`, `language`, `message`, `source`) VALUES
('Test','User','9999999999','test@example.com','en','This is a test message from the Contact Us page.','web');
-- 4) Notes
-- Import this file in phpMyAdmin: go to the 'Import' tab, choose this file, and click 'Go'.
-- Or use the mysql CLI: mysql -u root -p < create_contacts_table.sql
-- Adjust database name, user and permissions as needed for production.

-- 5) Create user tables for accounts: farmer, buyer, admin
-- Each table enforces unique phone numbers at the table level. The application
-- enforces uniqueness across all three tables.
DROP TABLE IF EXISTS `farmer`;
CREATE TABLE `farmer` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(255) DEFAULT NULL,
  `aadhar` VARCHAR(32) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `region` VARCHAR(50) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_farmer_phone` (`phone`),
  INDEX `idx_farmer_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `buyer`;
CREATE TABLE `buyer` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(255) DEFAULT NULL,
  `aadhar` VARCHAR(32) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `region` VARCHAR(50) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_buyer_phone` (`phone`),
  INDEX `idx_buyer_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(255) DEFAULT NULL,
  `aadhar` VARCHAR(32) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `region` VARCHAR(50) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_admin_phone` (`phone`),
  INDEX `idx_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example users (password_hash fields are placeholders; do NOT use plaintext passwords):
-- INSERT INTO `farmer` (name, phone, email, aadhar, password_hash) VALUES ('Farmer One','9000000000','farmer@example.com','123456789012','$2b$12$...');

-- ========== Crops table ==========
DROP TABLE IF EXISTS `crops`;
CREATE TABLE `crops` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seller_id` BIGINT UNSIGNED DEFAULT NULL,
  `seller_name` VARCHAR(255) NOT NULL,
  `seller_phone` VARCHAR(20) DEFAULT NULL,
  `region` VARCHAR(50) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `crop_name` VARCHAR(255) NOT NULL,
  `variety` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `quantity_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `price_per_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  -- removed created_day/created_month/created_year and date columns; use created_at timestamp instead
  -- Store disk-backed image path and optional expiry date for each crop listing
  `image_path` VARCHAR(255) DEFAULT NULL,
  `expiry_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_crops_region` (`region`),
  INDEX `idx_crops_seller_id` (`seller_id`),
  INDEX `idx_crops_crop` (`crop_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example insert into crops (for testing)
INSERT INTO `crops` (`seller_name`, `seller_phone`, `region`, `state`, `crop_name`, `variety`, `category`, `quantity_kg`, `price_per_kg`) VALUES
('Sample Seller','9000000000','North','Punjab','Wheat','Local','Food Crops',1000.000,22.50);

-- ========== Deals table (buyers) ==========
-- Stores deals created by buyers when they express interest in a crop.
DROP TABLE IF EXISTS `deals`;
CREATE TABLE `deals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `buyer_id` BIGINT UNSIGNED DEFAULT NULL,
  `buyer_name` VARCHAR(255) NOT NULL,
  `buyer_phone` VARCHAR(20) DEFAULT NULL,
  `region` VARCHAR(50) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,          -- New column for crop category
  `crop_name` VARCHAR(255) NOT NULL,
  `variety` VARCHAR(100) DEFAULT NULL,           -- New column for crop variety
  `quantity_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `image_path` VARCHAR(255) DEFAULT NULL,
  `delivery_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_deals_buyer_id` (`buyer_id`),
  INDEX `idx_deals_buyer_phone` (`buyer_phone`),
  INDEX `idx_deals_crop` (`crop_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example insert into deals (for testing)
INSERT INTO `deals` 
(`buyer_id`, `buyer_name`, `buyer_phone`, `region`, `state`, `category`, `crop_name`, `variety`, `quantity_kg`, `image_path`) 
VALUES
(NULL, 'Sample Buyer', '9111111111', 'North', 'Punjab', 'Food Crops', 'Wheat', 'Sharbati', 5.000, NULL);

-- ========== Purchase Notifications ==========
-- Stores notifications created when a buyer purchases from a farmer. Farmers will see these in the app.
DROP TABLE IF EXISTS `purchase_notifications`;
CREATE TABLE `purchase_notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `farmer_id` BIGINT NULL,
  `farmer_phone` VARCHAR(32) DEFAULT NULL,
  `crop_id` BIGINT NULL,
  `crop_name` VARCHAR(255) DEFAULT NULL,
  `variety` VARCHAR(255) DEFAULT NULL,
  `quantity_kg` DECIMAL(12,3) DEFAULT NULL,
  `buyer_name` VARCHAR(255) DEFAULT NULL,
  `buyer_email` VARCHAR(255) DEFAULT NULL,
  `buyer_phone` VARCHAR(32) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_purchase_farmer` (`farmer_id`),
  INDEX `idx_purchase_farmer_phone` (`farmer_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: add variety to existing purchase_notifications table if missing
ALTER TABLE `purchase_notifications` ADD COLUMN IF NOT EXISTS `variety` VARCHAR(255) DEFAULT NULL;

-- ========== Cart table ==========
-- Stores cart items added by signed-in users. Each row represents a single item
-- added to cart for a specific user (buyer or farmer). Backends should insert
-- rows on "Add to cart" and remove rows when an item is removed or the cart is cleared.
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_type` VARCHAR(16) NOT NULL DEFAULT 'buyer', -- 'buyer' or 'farmer'
  `user_id` BIGINT NULL,
  `buyer_id` BIGINT NULL,                             -- referenced user id when available
  `user_phone` VARCHAR(32) DEFAULT NULL,           -- fallback phone to identify user
  `crop_id` BIGINT NULL,
  `crop_name` VARCHAR(255) DEFAULT NULL,
  `variety` VARCHAR(255) DEFAULT NULL,
  `quantity_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `price_per_kg` DECIMAL(12,3) DEFAULT NULL,
  `image_path` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `total_quantity` DECIMAL(12,3) DEFAULT 0.000,
  `total_price` DECIMAL(12,2) DEFAULT 0.00,
  `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cart_user` (`user_type`, `user_id`, `user_phone`),
  INDEX `idx_cart_crop` (`crop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Idempotent migration: add cart table and columns if missing (MySQL 8+)
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `user_type` VARCHAR(16) NOT NULL DEFAULT 'buyer';
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `user_id` BIGINT NULL;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `user_phone` VARCHAR(32) DEFAULT NULL;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `crop_id` BIGINT NULL;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `crop_name` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `variety` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `quantity_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `price_per_kg` DECIMAL(12,3) DEFAULT NULL;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `image_path` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `category` VARCHAR(100) DEFAULT NULL;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `total_quantity` DECIMAL(12,3) DEFAULT 0.000;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `total_price` DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE `cart` ADD COLUMN IF NOT EXISTS `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Add an index on category for faster category-based aggregations and lookups
ALTER TABLE `cart` ADD INDEX IF NOT EXISTS `idx_cart_category` (`category`);

-- Populate existing cart rows with the crop category when possible (one-time idempotent update)
UPDATE `cart` c
LEFT JOIN `crops` cr ON cr.id = c.crop_id
SET c.category = cr.category
WHERE (c.category IS NULL OR c.category = '')
  AND c.crop_id IS NOT NULL
  AND cr.category IS NOT NULL;

-- ========== Buyer-specific Cart table (cart_b) ==========
DROP TABLE IF EXISTS `cart_b`;
CREATE TABLE `cart_b` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_type` VARCHAR(16) NOT NULL DEFAULT 'buyer',
  `user_id` BIGINT NULL,
  `user_phone` VARCHAR(32) DEFAULT NULL,
  `crop_id` BIGINT NULL,
  `crop_name` VARCHAR(255) DEFAULT NULL,
  `variety` VARCHAR(255) DEFAULT NULL,
  `quantity_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `price_per_kg` DECIMAL(12,3) DEFAULT NULL,
  `image_path` VARCHAR(255) DEFAULT NULL,
  `total_quantity` DECIMAL(12,3) DEFAULT 0.000,
  `total_price` DECIMAL(12,2) DEFAULT 0.00,
  `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cart_b_user` (`user_type`, `user_id`, `user_phone`),
  INDEX `idx_cart_b_crop` (`crop_id`)
);

-- Idempotent alters for cart_b
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `user_type` VARCHAR(16) NOT NULL DEFAULT 'buyer';
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `user_id` BIGINT NULL;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `user_phone` VARCHAR(32) DEFAULT NULL;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `crop_id` BIGINT NULL;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `crop_name` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `variety` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `quantity_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `price_per_kg` DECIMAL(12,3) DEFAULT NULL;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `image_path` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `total_quantity` DECIMAL(12,3) DEFAULT 0.000;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `total_price` DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE `cart_b` ADD COLUMN IF NOT EXISTS `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ========== Buyer Orders table ==========
-- Stores finalized buyer orders placed at checkout, including payment details.
DROP TABLE IF EXISTS `buyer_orders`;
CREATE TABLE `buyer_orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` VARCHAR(64) NOT NULL,
  `farmer_id` BIGINT UNSIGNED NOT NULL,
  `buyer_id` BIGINT UNSIGNED DEFAULT NULL,
  `crop_name` VARCHAR(255) NOT NULL,
  `quantity_kg` DECIMAL(12,3) NOT NULL,
  `price_per_kg` DECIMAL(12,2) NOT NULL,
  `total` DECIMAL(12,2) NOT NULL,
  `payment_method` VARCHAR(16) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_inv
  
  
  oice_id` (`invoice_id`),
  INDEX `idx_farmer_id` (`farmer_id`),
  INDEX `idx_buyer_id` (`buyer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Import this file in phpMyAdmin: go to the 'Import' tab, choose this file, and click 'Go'.
-- Or use the mysql CLI: mysql -u root -p < create_contacts_table.sql
-- If you're using XAMPP on Windows, start Apache & MySQL via the XAMPP Control Panel, then import via phpMyAdmin (http://localhost/phpmyadmin).
-- Keep SMTP credentials and DB credentials outside source control (use .env or system environment variables).

-- ========== Migration: add `region` and `state` to existing tables (idempotent) ===========
-- These ALTER statements are safe to run multiple times on MySQL 8+. If your MySQL
-- version does not support ADD COLUMN IF NOT EXISTS, you can run the ALTER only
-- once, or check for column existence before running.

ALTER TABLE `farmer` ADD COLUMN IF NOT EXISTS `region` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `farmer` ADD COLUMN IF NOT EXISTS `state` VARCHAR(100) DEFAULT NULL;

ALTER TABLE `buyer` ADD COLUMN IF NOT EXISTS `region` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `buyer` ADD COLUMN IF NOT EXISTS `state` VARCHAR(100) DEFAULT NULL;

ALTER TABLE `admin` ADD COLUMN IF NOT EXISTS `region` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `admin` ADD COLUMN IF NOT EXISTS `state` VARCHAR(100) DEFAULT NULL;

-- Example normalization: convert common region values to Title Case and canonical words
-- (e.g. 'north' -> 'North'). For single-word regions this works well.
-- Run these only after verifying backups.
UPDATE `farmer` SET region = CONCAT(UCASE(LEFT(TRIM(region),1)), LCASE(SUBSTRING(TRIM(region),2))) WHERE region IS NOT NULL AND region != '';
UPDATE `buyer` SET region = CONCAT(UCASE(LEFT(TRIM(region),1)), LCASE(SUBSTRING(TRIM(region),2))) WHERE region IS NOT NULL AND region != '';
UPDATE `admin` SET region = CONCAT(UCASE(LEFT(TRIM(region),1)), LCASE(SUBSTRING(TRIM(region),2))) WHERE region IS NOT NULL AND region != '';

-- Example normalization for state names (basic): title-case multi-word states.
-- This uses simple SQL functions and handles most Western-style names. For complex
-- locales you may prefer to do normalization in your application code.
UPDATE `farmer` SET state = CONCAT(UCASE(LEFT(TRIM(state),1)), LCASE(SUBSTRING(TRIM(state),2))) WHERE state IS NOT NULL AND state != '';
UPDATE `buyer` SET state = CONCAT(UCASE(LEFT(TRIM(state),1)), LCASE(SUBSTRING(TRIM(state),2))) WHERE state IS NOT NULL AND state != '';
UPDATE `admin` SET state = CONCAT(UCASE(LEFT(TRIM(state),1)), LCASE(SUBSTRING(TRIM(state),2))) WHERE state IS NOT NULL AND state != '';

-- If you prefer to set a default region for rows with NULL region, for example 'North':
-- UPDATE `farmer` SET region = 'North' WHERE region IS NULL OR region = '';

-- SQLite note: ALTER TABLE in SQLite is limited. To add columns in SQLite use:
--   ALTER TABLE farmer ADD COLUMN region TEXT;
--   ALTER TABLE farmer ADD COLUMN state TEXT;
-- The application already handles SQLite schema initialization in the backend code.

-- End of migration additions
-- Migration: add address column to farmer, buyer, admin tables
-- Run this against your MySQL (XAMPP) agri_ai database, e.g. using mysql CLI or phpMyAdmin.
ALTER TABLE `farmer` ADD COLUMN IF NOT EXISTS `address` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `buyer` ADD COLUMN IF NOT EXISTS `address` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `admin` ADD COLUMN IF NOT EXISTS `address` VARCHAR(255) DEFAULT NULL;

-- Add language preference column for users (farmer, buyer, admin)
ALTER TABLE `farmer` ADD COLUMN IF NOT EXISTS `lang` VARCHAR(10) DEFAULT 'en';
ALTER TABLE `buyer` ADD COLUMN IF NOT EXISTS `lang` VARCHAR(10) DEFAULT 'en';
ALTER TABLE `admin` ADD COLUMN IF NOT EXISTS `lang` VARCHAR(10) DEFAULT 'en';

-- If your MySQL installation still has a `date` column on crops (older experiments), drop it now
-- This will remove the separate `date` column in favor of the created_day/month/year fields
-- Remove legacy date/created_* columns if present; we will rely on created_at TIMESTAMP
ALTER TABLE `crops` DROP COLUMN IF EXISTS `date`;
ALTER TABLE `crops` DROP COLUMN IF EXISTS `created_day`;
ALTER TABLE `crops` DROP COLUMN IF EXISTS `created_month`;
ALTER TABLE `crops` DROP COLUMN IF EXISTS `created_year`;

-- Ensure seller_id exists on crops table (idempotent for MySQL 8+)
ALTER TABLE `crops` ADD COLUMN IF NOT EXISTS `seller_id` BIGINT UNSIGNED DEFAULT NULL;
ALTER TABLE `crops` ADD INDEX IF NOT EXISTS `idx_crops_seller_id` (`seller_id`);

-- Ensure image columns exist on crops table (idempotent migration)
-- Add disk-backed image path column (store filename relative to backend/uploads)
ALTER TABLE `crops` ADD COLUMN IF NOT EXISTS `image_path` VARCHAR(255) DEFAULT NULL;
-- Add optional expiry date for crop listings
ALTER TABLE `crops` ADD COLUMN IF NOT EXISTS `expiry_date` DATE DEFAULT NULL;
-- Add category column to crops table (idempotent on MySQL 8+)
ALTER TABLE `crops` ADD COLUMN IF NOT EXISTS `category` VARCHAR(100) DEFAULT NULL;
-- Add variety column to crops table (idempotent on MySQL 8+)
ALTER TABLE `crops` ADD COLUMN IF NOT EXISTS `variety` VARCHAR(255) DEFAULT NULL;

-- If your MySQL version doesn't support IF NOT EXISTS for ADD COLUMN, run:
-- ALTER TABLE `farmer` ADD COLUMN `address` VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE `buyer` ADD COLUMN `address` VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE `admin` ADD COLUMN `address` VARCHAR(255) DEFAULT NULL;
