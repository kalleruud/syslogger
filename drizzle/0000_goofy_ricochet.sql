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
CREATE INDEX `idx_logs_severity_timestamp` ON `logs` (`severity`,`timestamp`);
