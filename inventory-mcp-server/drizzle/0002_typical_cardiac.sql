PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`category` text,
	`description` text,
	`created_at` integer DEFAULT '"2025-06-20T22:25:49.937Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-20T22:25:49.937Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_items`("id", "name", "price", "stock", "category", "description", "created_at", "updated_at") SELECT "id", "name", "price", "stock", "category", "description", "created_at", "updated_at" FROM `items`;--> statement-breakpoint
DROP TABLE `items`;--> statement-breakpoint
ALTER TABLE `__new_items` RENAME TO `items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;