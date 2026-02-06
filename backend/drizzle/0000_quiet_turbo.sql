CREATE TABLE `syslogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`facility` integer,
	`severity` integer,
	`hostname` text,
	`appname` text,
	`procid` text,
	`msgid` text,
	`message` text NOT NULL,
	`raw` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_timestamp` ON `syslogs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_severity` ON `syslogs` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_hostname` ON `syslogs` (`hostname`);--> statement-breakpoint
CREATE INDEX `idx_appname` ON `syslogs` (`appname`);