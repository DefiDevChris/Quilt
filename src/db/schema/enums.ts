import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['free', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'banned']);
export const unitSystemEnum = pgEnum('unit_system', ['imperial', 'metric']);

export const projectModeEnum = pgEnum('project_mode', ['free-form', 'layout', 'template', 'photo-to-quilt']);
export const gridGranularityEnum = pgEnum('grid_granularity', ['inch', 'half', 'quarter']);
export const ingestSourceTypeEnum = pgEnum('ingest_source_type', ['awin-feed', 'scrapingbee', 'csv']);
