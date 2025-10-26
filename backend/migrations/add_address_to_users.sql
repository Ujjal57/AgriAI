-- Migration: add address column to farmer, buyer, admin tables
-- Run this against your MySQL (XAMPP) agri_ai database, e.g. using mysql CLI or phpMyAdmin.
ALTER TABLE `farmer` ADD COLUMN IF NOT EXISTS `address` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `buyer` ADD COLUMN IF NOT EXISTS `address` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `admin` ADD COLUMN IF NOT EXISTS `address` VARCHAR(255) DEFAULT NULL;

-- If your MySQL version doesn't support IF NOT EXISTS for ADD COLUMN, run:
-- ALTER TABLE `farmer` ADD COLUMN `address` VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE `buyer` ADD COLUMN `address` VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE `admin` ADD COLUMN `address` VARCHAR(255) DEFAULT NULL;
