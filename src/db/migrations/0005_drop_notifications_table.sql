-- Migration: 0005_drop_notifications_table.sql
-- Purpose: Remove the notifications table and its indexes.
--   In-app notification system has been removed from the application.

DROP INDEX IF EXISTS "idx_notifications_userId_isRead";
DROP INDEX IF EXISTS "idx_notifications_userId_createdAt";
DROP TABLE IF EXISTS "notifications";
