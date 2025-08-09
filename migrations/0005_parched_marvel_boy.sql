CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerId` integer,
	`fileId` text,
	`expirationDate` integer,
	`users` text DEFAULT '[]',
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_ownerId_unique` ON `shares` (`ownerId`);