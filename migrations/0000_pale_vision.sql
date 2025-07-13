CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`externalId` integer,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
