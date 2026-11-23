CREATE TABLE `account` (
	`id` varchar(64) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` datetime(3),
	`refresh_token_expires_at` datetime(3),
	`scope` text,
	`password` text,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admins` (
	`user_id` varchar(64) NOT NULL,
	CONSTRAINT `admins_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`uid` varchar(64) NOT NULL,
	`items` longtext NOT NULL,
	CONSTRAINT `carts_uid` PRIMARY KEY(`uid`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`code` varchar(20) NOT NULL,
	`type` varchar(10) NOT NULL,
	`value` int NOT NULL,
	`max_discount` int,
	`min_order` int NOT NULL,
	`expires_at` varchar(10) NOT NULL,
	`active` boolean NOT NULL,
	`max_uses` int,
	`once_per_customer` boolean NOT NULL,
	`uses` int NOT NULL DEFAULT 0,
	CONSTRAINT `coupons_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`uid` varchar(64) NOT NULL,
	`product_id` varchar(80) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `favorites_uid_product_id_pk` PRIMARY KEY(`uid`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` varchar(40) NOT NULL,
	`data` mediumblob NOT NULL,
	`type` varchar(20) NOT NULL,
	`by` varchar(64) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` varchar(40) NOT NULL,
	`uid` varchar(64),
	`name` varchar(120) NOT NULL,
	`phone` varchar(10) NOT NULL,
	`quantity` varchar(40) NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'new',
	`notes` text NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3),
	`updated_by` varchar(64),
	`product_id` varchar(80) NOT NULL,
	`supplier_id` varchar(80) NOT NULL,
	`message` text,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(20) NOT NULL,
	`uid` varchar(64) NOT NULL,
	`items` longtext NOT NULL,
	`subtotal` int NOT NULL,
	`discount` int NOT NULL,
	`coupon_code` varchar(20),
	`total` int NOT NULL,
	`address` longtext NOT NULL,
	`status` varchar(20) NOT NULL,
	`pg_state` varchar(12),
	`pg_transaction_id` varchar(100),
	`reserved_until` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	`tracking_note` varchar(300) NOT NULL DEFAULT '',
	`checkout_url` text,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`uid` varchar(64) NOT NULL,
	`address` longtext NOT NULL,
	CONSTRAINT `profiles_uid` PRIMARY KEY(`uid`)
);
--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` varchar(40) NOT NULL,
	`uid` varchar(64),
	`name` varchar(120) NOT NULL,
	`phone` varchar(10) NOT NULL,
	`quantity` varchar(40) NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'new',
	`notes` text NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3),
	`updated_by` varchar(64),
	`title` varchar(200) NOT NULL,
	`category` varchar(80) NOT NULL,
	`city` varchar(80) NOT NULL,
	`budget` varchar(80),
	`details` text,
	CONSTRAINT `requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(64) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(64) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` int NOT NULL,
	`json` longtext NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `site_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock` (
	`product_id` varchar(80) NOT NULL,
	`available` int NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `stock_product_id` PRIMARY KEY(`product_id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(64) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `leads_created_idx` ON `leads` (`created_at`);--> statement-breakpoint
CREATE INDEX `leads_uid_idx` ON `leads` (`uid`);--> statement-breakpoint
CREATE INDEX `orders_uid_created_idx` ON `orders` (`uid`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_uid_coupon_idx` ON `orders` (`uid`,`coupon_code`);--> statement-breakpoint
CREATE INDEX `requirements_created_idx` ON `requirements` (`created_at`);--> statement-breakpoint
CREATE INDEX `requirements_uid_idx` ON `requirements` (`uid`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);