-- Life OS - Schemas Initialization
CREATE SCHEMA IF NOT EXISTS f1;
CREATE SCHEMA IF NOT EXISTS gaming;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS sports;
CREATE SCHEMA IF NOT EXISTS weather;
CREATE SCHEMA IF NOT EXISTS reading;
CREATE SCHEMA IF NOT EXISTS notes;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS travel;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS shedlock;

-- ShedLock table in shedlock schema
CREATE TABLE IF NOT EXISTS shedlock.shedlock (
    name VARCHAR(64) NOT NULL,
    lock_until TIMESTAMP NOT NULL,
    locked_at TIMESTAMP NOT NULL,
    locked_by VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);

-- Tabela e migração de colunas de canais da Twitch
CREATE TABLE IF NOT EXISTS gaming.user_tracked_twitch_channels (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    record_vod BOOLEAN DEFAULT FALSE NOT NULL,
    record_quality VARCHAR(30) DEFAULT '720p60'
);

ALTER TABLE gaming.user_tracked_twitch_channels ADD COLUMN IF NOT EXISTS record_vod BOOLEAN DEFAULT FALSE;
ALTER TABLE gaming.user_tracked_twitch_channels ADD COLUMN IF NOT EXISTS record_quality VARCHAR(30) DEFAULT '720p60';

-- Tabela de Notificações / Lembretes Personalizados
CREATE TABLE IF NOT EXISTS notifications.custom_notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time VARCHAR(10) NOT NULL,
    recurrence VARCHAR(50) NOT NULL DEFAULT 'DAILY',
    days_of_week VARCHAR(255),
    specific_date DATE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    send_telegram BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
