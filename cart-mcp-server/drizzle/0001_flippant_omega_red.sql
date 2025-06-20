PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_carts` (
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`added_at` integer DEFAULT '"2025-06-20T22:27:18.730Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-20T22:27:18.730Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_carts`("user_id", "item_id", "quantity", "added_at", "updated_at") SELECT "user_id", "item_id", "quantity", "added_at", "updated_at" FROM `carts`;--> statement-breakpoint
DROP TABLE `carts`;--> statement-breakpoint
ALTER TABLE `__new_carts` RENAME TO `carts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;