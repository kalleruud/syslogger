CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`severity` integer NOT NULL,
	`facility` integer,
	`hostname` text,
	`appname` text,
	`procid` text,
	`msgid` text,
	`message` text NOT NULL,
	`raw` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_logs_timestamp` ON `logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_logs_severity` ON `logs` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_logs_hostname` ON `logs` (`hostname`);--> statement-breakpoint
CREATE INDEX `idx_logs_appname` ON `logs` (`appname`);--> statement-breakpoint
CREATE INDEX `idx_logs_severity_timestamp` ON `logs` (`severity`,`timestamp`);--> statement-breakpoint
CREATE TABLE `logs_tags` (
	`log_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`log_id`, `tag_id`),
	FOREIGN KEY (`log_id`) REFERENCES `logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_logs_tags_tag_id` ON `logs_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);