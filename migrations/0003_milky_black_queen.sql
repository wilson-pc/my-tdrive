PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_files` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`delete` integer DEFAULT false,
	`parentId` text,
	`mimeType` text,
	`size` numeric,
	`duration` numeric,
	`userId` integer,
	`chatId` text,
	`fileId` text,
	`messageId` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`externalId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_files`("id", "name", "delete", "parentId", "mimeType", "size", "duration", "userId", "chatId", "fileId", "messageId", "createdAt", "updatedAt") SELECT "id", "name", "delete", "parentId", "mimeType", "size", "duration", "userId", "chatId", "fileId", "messageId", "createdAt", "updatedAt" FROM `files`;--> statement-breakpoint
DROP TABLE `files`;--> statement-breakpoint
ALTER TABLE `__new_files` RENAME TO `files`;--> statement-breakpoint
PRAGMA foreign_keys=ON;