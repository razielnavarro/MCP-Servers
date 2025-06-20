CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`category` text,
	`description` text,
	`created_at` integer DEFAULT 1750429370748 NOT NULL,
	`updated_at` integer DEFAULT 1750429370748 NOT NULL
);
