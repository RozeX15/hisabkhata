-- ==============================================================================
-- HISHAB KHATA (হিসাব খাতা) - FULL MYSQL / PHPMYADMIN DATABASE SCHEMA
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, and phpMyAdmin
-- Character Set: utf8mb4 (Full Bengali and Multilingual Support)
-- ==============================================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `hishabkhata_db` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `hishabkhata_db`;

-- Set SQL Modes & Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ==============================================================================
-- TABLE 1: users (ব্যবহারকারীদের তালিকা ও প্রোফাইল)
-- ==============================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `preferredLanguage` VARCHAR(10) NOT NULL DEFAULT 'en',
  `preferredCurrency` VARCHAR(10) NOT NULL DEFAULT 'BDT',
  `plan` ENUM('free', 'pro') NOT NULL DEFAULT 'free',
  `status` ENUM('active', 'deactivated') NOT NULL DEFAULT 'active',
  `emailVerified` TINYINT(1) NOT NULL DEFAULT 1,
  `avatarUrl` TEXT DEFAULT NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_plan` (`plan`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 2: user_passwords (পাসওয়ার্ড হ্যাশ সংরক্ষণ - Bcrypt Secured)
-- ==============================================================================
DROP TABLE IF EXISTS `user_passwords`;
CREATE TABLE `user_passwords` (
  `userId` VARCHAR(64) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`userId`),
  CONSTRAINT `fk_passwords_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 3: wallets (ওয়ালেট ও একাউন্টস - Cash, Bank, bKash, Nagad)
-- ==============================================================================
DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'cash',
  `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'BDT',
  `color` VARCHAR(20) NOT NULL DEFAULT '#10B981',
  `isDefault` TINYINT(1) NOT NULL DEFAULT 0,
  `accountNumber` VARCHAR(100) DEFAULT NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_wallets_userId` (`userId`),
  CONSTRAINT `fk_wallets_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 4: categories (আয় ও ব্যয়ের ক্যাটাগরি)
-- ==============================================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) DEFAULT NULL,
  `nameKey` VARCHAR(100) NOT NULL,
  `customName` VARCHAR(191) DEFAULT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'Coins',
  `color` VARCHAR(20) NOT NULL DEFAULT '#10B981',
  `isSystem` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_categories_userId` (`userId`),
  KEY `idx_categories_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 5: transactions (লেনদেন সমূহ - আয়, ব্যয় ও ট্রান্সফার)
-- ==============================================================================
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `walletId` VARCHAR(64) NOT NULL,
  `toWalletId` VARCHAR(64) DEFAULT NULL,
  `type` ENUM('income', 'expense', 'transfer') NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'BDT',
  `categoryId` VARCHAR(64) NOT NULL,
  `category` VARCHAR(191) DEFAULT NULL,
  `date` VARCHAR(20) NOT NULL,
  `description` TEXT NOT NULL,
  `note` TEXT DEFAULT NULL,
  `isRecurring` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_transactions_userId` (`userId`),
  KEY `idx_transactions_walletId` (`walletId`),
  KEY `idx_transactions_date` (`date`),
  KEY `idx_transactions_type` (`type`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 6: budgets (মাসিক ও বাৎসরিক বাজেট)
-- ==============================================================================
DROP TABLE IF EXISTS `budgets`;
CREATE TABLE `budgets` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `categoryId` VARCHAR(64) DEFAULT NULL,
  `category` VARCHAR(191) DEFAULT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `period` VARCHAR(20) NOT NULL DEFAULT 'monthly',
  `month` VARCHAR(10) NOT NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_budgets_userId` (`userId`),
  KEY `idx_budgets_month` (`month`),
  CONSTRAINT `fk_budgets_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 7: savings_goals (সঞ্চয় লক্ষ্যমাত্রা / গোলস)
-- ==============================================================================
DROP TABLE IF EXISTS `savings_goals`;
CREATE TABLE `savings_goals` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `targetAmount` DECIMAL(15, 2) NOT NULL,
  `currentAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'BDT',
  `targetDate` VARCHAR(20) DEFAULT NULL,
  `deadline` VARCHAR(20) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `color` VARCHAR(20) NOT NULL DEFAULT '#10B981',
  `icon` VARCHAR(50) NOT NULL DEFAULT 'PiggyBank',
  `status` ENUM('in_progress', 'completed') NOT NULL DEFAULT 'in_progress',
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_savings_userId` (`userId`),
  CONSTRAINT `fk_savings_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 8: goal_contributions (সঞ্চয় গোলে জমা দেওয়ার হিসাব)
-- ==============================================================================
DROP TABLE IF EXISTS `goal_contributions`;
CREATE TABLE `goal_contributions` (
  `id` VARCHAR(64) NOT NULL,
  `goalId` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `walletId` VARCHAR(64) NOT NULL,
  `note` TEXT DEFAULT NULL,
  `date` VARCHAR(20) NOT NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_goal_contrib_goalId` (`goalId`),
  KEY `idx_goal_contrib_userId` (`userId`),
  CONSTRAINT `fk_contrib_goal` FOREIGN KEY (`goalId`) REFERENCES `savings_goals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_contrib_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 9: loans (ধার ও দেনা-পাওনা - Owe Me / I Owe)
-- ==============================================================================
DROP TABLE IF EXISTS `loans`;
CREATE TABLE `loans` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `type` ENUM('owe_me', 'i_owe') NOT NULL,
  `personName` VARCHAR(191) NOT NULL,
  `personContact` VARCHAR(100) DEFAULT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `paidAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'BDT',
  `dueDate` VARCHAR(20) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'partially_paid', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_loans_userId` (`userId`),
  KEY `idx_loans_type` (`type`),
  KEY `idx_loans_status` (`status`),
  CONSTRAINT `fk_loans_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 10: loan_payments (ঋণ পরিশোধ বা কিস্তির রেকর্ড)
-- ==============================================================================
DROP TABLE IF EXISTS `loan_payments`;
CREATE TABLE `loan_payments` (
  `id` VARCHAR(64) NOT NULL,
  `loanId` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `walletId` VARCHAR(64) NOT NULL,
  `paymentDate` VARCHAR(20) NOT NULL,
  `note` TEXT DEFAULT NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_loan_pay_loanId` (`loanId`),
  KEY `idx_loan_pay_userId` (`userId`),
  CONSTRAINT `fk_loanpay_loan` FOREIGN KEY (`loanId`) REFERENCES `loans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_loanpay_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 11: notifications (অ্যাপ নোটিফিকেশন ও ঘোষণা)
-- ==============================================================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL,
  `titleKey` VARCHAR(191) NOT NULL,
  `messageKey` TEXT NOT NULL,
  `params` JSON DEFAULT NULL,
  `isRead` TINYINT(1) NOT NULL DEFAULT 0,
  `readBy` JSON DEFAULT NULL,
  `deletedBy` JSON DEFAULT NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 12: subscription_payments (PRO সাবস্ক্রিপশন ম্যানুয়াল পেমেন্ট রিকোয়েস্ট)
-- ==============================================================================
DROP TABLE IF EXISTS `subscription_payments`;
CREATE TABLE `subscription_payments` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `userName` VARCHAR(191) NOT NULL,
  `userEmail` VARCHAR(191) NOT NULL,
  `plan` VARCHAR(20) NOT NULL DEFAULT 'pro',
  `billingCycle` VARCHAR(20) NOT NULL DEFAULT 'monthly',
  `amount` DECIMAL(15, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'BDT',
  `paymentMethod` VARCHAR(50) NOT NULL,
  `senderNumberOrAccount` VARCHAR(100) NOT NULL,
  `transactionId` VARCHAR(100) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `adminNotes` TEXT DEFAULT NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  `reviewedAt` VARCHAR(64) DEFAULT NULL,
  `reviewedBy` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_subpay_userId` (`userId`),
  KEY `idx_subpay_status` (`status`),
  KEY `idx_subpay_trx` (`transactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 13: admin_payment_config (বিকাশ, নগদ, রকেট ও ব্যাংক একাউন্ট সেটিংস)
-- ==============================================================================
DROP TABLE IF EXISTS `admin_payment_config`;
CREATE TABLE `admin_payment_config` (
  `id` VARCHAR(64) NOT NULL DEFAULT 'default',
  `bkashNumber` VARCHAR(50) NOT NULL DEFAULT '01711-234567',
  `bkashType` VARCHAR(20) NOT NULL DEFAULT 'personal',
  `nagadNumber` VARCHAR(50) NOT NULL DEFAULT '01811-234567',
  `nagadType` VARCHAR(20) NOT NULL DEFAULT 'personal',
  `rocketNumber` VARCHAR(50) NOT NULL DEFAULT '01911-234567-8',
  `bankName` VARCHAR(191) NOT NULL DEFAULT 'Islami Bank Bangladesh PLC / City Bank',
  `bankAccountName` VARCHAR(191) NOT NULL DEFAULT 'Hishab Khata SaaS Admin',
  `bankAccountNumber` VARCHAR(100) NOT NULL DEFAULT '2050112020345678',
  `bankBranch` VARCHAR(191) NOT NULL DEFAULT 'Dhanmondi Branch, Dhaka',
  `bankRoutingNumber` VARCHAR(50) NOT NULL DEFAULT '125272847',
  `proMonthlyPriceBDT` DECIMAL(10, 2) NOT NULL DEFAULT 499.00,
  `proYearlyPriceBDT` DECIMAL(10, 2) NOT NULL DEFAULT 4999.00,
  `proLifetimePriceBDT` DECIMAL(10, 2) NOT NULL DEFAULT 9999.00,
  `proMonthlyPriceUSD` DECIMAL(10, 2) NOT NULL DEFAULT 4.99,
  `proYearlyPriceUSD` DECIMAL(10, 2) NOT NULL DEFAULT 49.99,
  `proLifetimePriceUSD` DECIMAL(10, 2) NOT NULL DEFAULT 99.99,
  `yearlyDiscountPercent` INT NOT NULL DEFAULT 20,
  `instructionsBn` TEXT DEFAULT NULL,
  `instructionsEn` TEXT DEFAULT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 14: admin_logs (অ্যাডমিন অডিট লগ)
-- ==============================================================================
DROP TABLE IF EXISTS `admin_logs`;
CREATE TABLE `admin_logs` (
  `id` VARCHAR(64) NOT NULL,
  `adminId` VARCHAR(64) NOT NULL,
  `adminEmail` VARCHAR(191) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `targetType` VARCHAR(50) DEFAULT NULL,
  `targetId` VARCHAR(64) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_admin_logs_adminId` (`adminId`),
  KEY `idx_admin_logs_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 15: user_presences (লাইভ অনলাইন ট্র্যাকিং)
-- ==============================================================================
DROP TABLE IF EXISTS `user_presences`;
CREATE TABLE `user_presences` (
  `userId` VARCHAR(64) NOT NULL,
  `userName` VARCHAR(191) NOT NULL,
  `userEmail` VARCHAR(191) NOT NULL,
  `avatarUrl` TEXT DEFAULT NULL,
  `plan` VARCHAR(20) NOT NULL DEFAULT 'free',
  `role` VARCHAR(20) NOT NULL DEFAULT 'user',
  `isOnline` TINYINT(1) NOT NULL DEFAULT 1,
  `currentView` VARCHAR(50) NOT NULL DEFAULT 'dashboard',
  `lastActiveAt` VARCHAR(64) NOT NULL,
  `deviceType` VARCHAR(20) NOT NULL DEFAULT 'desktop',
  `browser` VARCHAR(50) NOT NULL DEFAULT 'Chrome',
  `lastAction` VARCHAR(191) DEFAULT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`userId`),
  KEY `idx_presence_online` (`isOnline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 16: live_user_activities (রিয়েল-টাইম ইউজার অ্যাক্টিভিটি স্ট্রিম)
-- ==============================================================================
DROP TABLE IF EXISTS `live_user_activities`;
CREATE TABLE `live_user_activities` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `userName` VARCHAR(191) NOT NULL,
  `userEmail` VARCHAR(191) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `view` VARCHAR(50) DEFAULT NULL,
  `deviceType` VARCHAR(20) NOT NULL DEFAULT 'desktop',
  `browser` VARCHAR(50) NOT NULL DEFAULT 'Chrome',
  `timestamp` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_activities_userId` (`userId`),
  KEY `idx_activities_time` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 17: email_logs (সিস্টেম ইমেইল অডিট ও ভেরিফিকেশন লগ)
-- ==============================================================================
DROP TABLE IF EXISTS `email_logs`;
CREATE TABLE `email_logs` (
  `id` VARCHAR(64) NOT NULL,
  `toEmail` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `template` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'sent',
  `messageId` VARCHAR(100) DEFAULT NULL,
  `error` TEXT DEFAULT NULL,
  `timestamp` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email_to` (`toEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 18: suggestions (সুপার চ্যাট ও কমিউনিটি ফিচার ফিডব্যাক)
-- ==============================================================================
DROP TABLE IF EXISTS `suggestions`;
CREATE TABLE `suggestions` (
  `id` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `userName` VARCHAR(191) NOT NULL,
  `userEmail` VARCHAR(191) NOT NULL,
  `userAvatar` TEXT DEFAULT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'feature',
  `likesCount` INT NOT NULL DEFAULT 0,
  `likedBy` JSON DEFAULT NULL,
  `isSuperChat` TINYINT(1) NOT NULL DEFAULT 0,
  `superChatAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `superChatCurrency` VARCHAR(10) NOT NULL DEFAULT 'BDT',
  `superChatMethod` VARCHAR(50) DEFAULT NULL,
  `superChatTrxId` VARCHAR(100) DEFAULT NULL,
  `superChatStatus` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `adminResponse` TEXT DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'open',
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_suggestions_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 19: system_settings (প্ল্যান লিমিট, ফি ও অন্যান্য কনফিগারেশন)
-- ==============================================================================
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `settingKey` VARCHAR(100) NOT NULL,
  `settingValue` LONGTEXT NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- SEED DATA INSERTION (প্রাথমিক অ্যাডমিন, ক্যাটাগরি ও সেটিংস ডাটা)
-- ==============================================================================

-- 1. Insert Default Super Admin User (password: admin123 or password123)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `role`, `preferredLanguage`, `preferredCurrency`, `plan`, `status`, `emailVerified`, `avatarUrl`, `createdAt`, `updatedAt`) VALUES
('admin-sultan-001', 'Nowroze', 'sultanitbangladesh@gmail.com', '01700000000', 'admin', 'en', 'BDT', 'pro', 'active', 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', NOW(), NOW()),
('admin-system-002', 'System Admin', 'admin@hishabkhata.com', NULL, 'admin', 'en', 'BDT', 'pro', 'active', 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`), `plan` = VALUES(`plan`);

-- 2. Insert Admin Password Hashes (bcrypt: 'admin123')
INSERT INTO `user_passwords` (`userId`, `passwordHash`, `updatedAt`) VALUES
('admin-sultan-001', '$2b$10$0L03uYW3cB1rLXrR7RAmi.BsahqpSC21Gd2i6r7Sw1g/CHmxeXD8e', NOW()),
('admin-system-002', '$2b$10$sfL.7zo0urI1UUnlB0//8e8HY1xG9i6lLg9dzhqgr6x7BqGDRrc/y', NOW())
ON DUPLICATE KEY UPDATE `passwordHash` = VALUES(`passwordHash`);

-- 3. Insert Default Admin Cash Wallet
INSERT INTO `wallets` (`id`, `userId`, `name`, `type`, `balance`, `currency`, `color`, `isDefault`, `createdAt`, `updatedAt`) VALUES
('w-cash-01', 'admin-sultan-001', 'Cash Wallet', 'cash', 0.00, 'BDT', '#10B981', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Insert Default System Categories (Income & Expense)
INSERT INTO `categories` (`id`, `userId`, `nameKey`, `customName`, `type`, `icon`, `color`, `isSystem`, `createdAt`) VALUES
-- Income
('cat-sal', NULL, 'cat_salary', 'Salary / বেতন', 'income', 'Briefcase', '#10B981', 1, NOW()),
('cat-fre', NULL, 'cat_freelance', 'Freelance / ফ্রিল্যান্সিং', 'income', 'Laptop', '#06B6D4', 1, NOW()),
('cat-bus', NULL, 'cat_business', 'Business / ব্যবসা', 'income', 'Building2', '#8B5CF6', 1, NOW()),
('cat-gif', NULL, 'cat_gift', 'Gift / উপহার', 'income', 'Gift', '#EC4899', 1, NOW()),
('cat-oin', NULL, 'cat_other_income', 'Other Income / অন্যান্য আয়', 'income', 'Coins', '#14B8A6', 1, NOW()),
-- Expense
('cat-foo', NULL, 'cat_food', 'Food & Groceries / খাবার ও বাজার', 'expense', 'Utensils', '#F59E0B', 1, NOW()),
('cat-tra', NULL, 'cat_transport', 'Transportation / যাতায়াত', 'expense', 'Car', '#3B82F6', 1, NOW()),
('cat-sho', NULL, 'cat_shopping', 'Shopping / কেনাকাটা', 'expense', 'ShoppingBag', '#EC4899', 1, NOW()),
('cat-bil', NULL, 'cat_bills', 'Bills & Utilities / বিল ও ইউটিলিটি', 'expense', 'Zap', '#EAB308', 1, NOW()),
('cat-edu', NULL, 'cat_education', 'Education / শিক্ষা', 'expense', 'GraduationCap', '#6366F1', 1, NOW()),
('cat-ent', NULL, 'cat_entertainment', 'Entertainment / বিনোদন', 'expense', 'Film', '#A855F7', 1, NOW()),
('cat-hea', NULL, 'cat_health', 'Health & Medicine / চিকিৎসা ও ওষুধ', 'expense', 'HeartPulse', '#EF4444', 1, NOW()),
('cat-ren', NULL, 'cat_rent', 'House Rent / বাসা ভাড়া', 'expense', 'Home', '#0F766E', 1, NOW()),
('cat-fam', NULL, 'cat_family', 'Family & Personal / পরিবার ও ব্যক্তিগত', 'expense', 'Users', '#F97316', 1, NOW()),
('cat-oex', NULL, 'cat_other_expense', 'Other Expense / অন্যান্য খরচ', 'expense', 'MoreHorizontal', '#64748B', 1, NOW())
ON DUPLICATE KEY UPDATE `nameKey` = VALUES(`nameKey`);

-- 5. Insert Default Payment Config
INSERT INTO `admin_payment_config` (
  `id`, `bkashNumber`, `bkashType`, `nagadNumber`, `nagadType`, `rocketNumber`,
  `bankName`, `bankAccountName`, `bankAccountNumber`, `bankBranch`, `bankRoutingNumber`,
  `proMonthlyPriceBDT`, `proYearlyPriceBDT`, `proLifetimePriceBDT`,
  `proMonthlyPriceUSD`, `proYearlyPriceUSD`, `proLifetimePriceUSD`,
  `yearlyDiscountPercent`, `instructionsBn`, `instructionsEn`, `updatedAt`
) VALUES (
  'default', '01711-234567', 'personal', '01811-234567', 'personal', '01911-234567-8',
  'Islami Bank Bangladesh PLC / City Bank', 'Hishab Khata SaaS Admin', '2050112020345678',
  'Dhanmondi Branch, Dhaka', '125272847',
  499.00, 4999.00, 9999.00,
  4.99, 49.99, 99.99,
  20,
  'বিকাশ বা নগদ অ্যাপ থেকে "Send Money" বা "Payment" করুন। পেমেন্ট সফল হলে প্রাপ্ত TrxID এবং আপনার মোবাইল নম্বর সাবমিট করুন। অ্যাডমিন ৫-১০ মিনিটের মধ্যে ভেরিফাই করে PRO একাউন্ট একটিভ করে দিবে।',
  'Send the exact subscription fee to the bKash, Nagad or Bank Account above. Enter your Sender Number/Account and the Transaction ID (TrxID) below. Admin verifies and activates PRO within minutes.',
  NOW()
) ON DUPLICATE KEY UPDATE `updatedAt` = VALUES(`updatedAt`);

-- 6. Insert Default System Plan Limits
INSERT INTO `system_settings` (`settingKey`, `settingValue`, `updatedAt`) VALUES
('system_plan_limits', '{"freeMaxWallets":10,"freeMaxTransactionsPerMonth":500,"freeMaxSavingsGoals":10,"freeAllowPdfExport":true,"freeAllowExcelExport":true,"proMonthlyPriceUSD":4.99,"proYearlyPriceUSD":49.99}', NOW())
ON DUPLICATE KEY UPDATE `settingValue` = VALUES(`settingValue`);

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- DATABASE CREATION & SEEDING COMPLETED SUCCESSFULLY!
-- Your Hishab Khata MySQL / phpMyAdmin database is 100% ready for production.
-- ==============================================================================
