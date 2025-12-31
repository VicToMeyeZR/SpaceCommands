-- SpaceCommands Supabase Database Schema
-- Run this SQL in your Supabase project's SQL Editor to set up the required tables

-- Table: spacecommands_prefixes
-- Stores custom prefixes for guilds
CREATE TABLE IF NOT EXISTS spacecommands_prefixes (
  guild_id TEXT PRIMARY KEY,
  prefix TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: spacecommands_cooldowns
-- Stores command cooldowns
CREATE TABLE IF NOT EXISTS spacecommands_cooldowns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  cooldown BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: spacecommands_languages
-- Stores language preferences for guilds
CREATE TABLE IF NOT EXISTS spacecommands_languages (
  guild_id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: spacecommands_disabled_commands
-- Stores disabled commands per guild
CREATE TABLE IF NOT EXISTS spacecommands_disabled_commands (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  command TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guild_id, command)
);

-- Table: spacecommands_channel_commands
-- Stores channel-specific command restrictions
CREATE TABLE IF NOT EXISTS spacecommands_channel_commands (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  command TEXT NOT NULL,
  channels TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guild_id, command)
);

-- Table: spacecommands_required_roles
-- Stores required roles for commands
CREATE TABLE IF NOT EXISTS spacecommands_required_roles (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  command TEXT NOT NULL,
  required_roles TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guild_id, command)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cooldowns_name ON spacecommands_cooldowns(name);
CREATE INDEX IF NOT EXISTS idx_cooldowns_type ON spacecommands_cooldowns(type);
CREATE INDEX IF NOT EXISTS idx_disabled_commands_guild ON spacecommands_disabled_commands(guild_id);
CREATE INDEX IF NOT EXISTS idx_channel_commands_guild ON spacecommands_channel_commands(guild_id);
CREATE INDEX IF NOT EXISTS idx_required_roles_guild ON spacecommands_required_roles(guild_id);

-- Enable Row Level Security (RLS) - Optional but recommended
-- ALTER TABLE spacecommands_prefixes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE spacecommands_cooldowns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE spacecommands_languages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE spacecommands_disabled_commands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE spacecommands_channel_commands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE spacecommands_required_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (if using RLS)
-- CREATE POLICY "Enable all access for service role" ON spacecommands_prefixes FOR ALL USING (true);
-- CREATE POLICY "Enable all access for service role" ON spacecommands_cooldowns FOR ALL USING (true);
-- CREATE POLICY "Enable all access for service role" ON spacecommands_languages FOR ALL USING (true);
-- CREATE POLICY "Enable all access for service role" ON spacecommands_disabled_commands FOR ALL USING (true);
-- CREATE POLICY "Enable all access for service role" ON spacecommands_channel_commands FOR ALL USING (true);
-- CREATE POLICY "Enable all access for service role" ON spacecommands_required_roles FOR ALL USING (true);

COMMENT ON TABLE spacecommands_prefixes IS 'Stores custom command prefixes for Discord guilds';
COMMENT ON TABLE spacecommands_cooldowns IS 'Stores command cooldown data';
COMMENT ON TABLE spacecommands_languages IS 'Stores language preferences for Discord guilds';
COMMENT ON TABLE spacecommands_disabled_commands IS 'Stores disabled commands per guild';
COMMENT ON TABLE spacecommands_channel_commands IS 'Stores channel-specific command restrictions';
COMMENT ON TABLE spacecommands_required_roles IS 'Stores required roles for command execution';
