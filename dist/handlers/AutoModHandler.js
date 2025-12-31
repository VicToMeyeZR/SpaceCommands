"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
/**
 * Handler for Discord AutoMod features
 * Provides utilities for creating, managing, and listening to AutoMod rules and actions
 */
class AutoModHandler {
    _client;
    _instance;
    _actionHandlers = [];
    _ruleCache = new Map(); // guildId -> ruleId -> rule
    constructor(instance) {
        this._instance = instance;
        this._client = instance.client;
        this.setUp();
    }
    setUp() {
        // Listen for AutoMod action executions
        this._client.on('autoModerationActionExecution', async (execution) => {
            if (this._instance.debug) {
                console.log(`SpaceCommands > AutoMod action executed in guild ${execution.guild.id}, rule: ${execution.ruleId}`);
            }
            await this.triggerActionHandlers(execution);
        });
        // Listen for AutoMod rule creation
        this._client.on('autoModerationRuleCreate', (rule) => {
            this.cacheRule(rule);
            if (this._instance.debug) {
                console.log(`SpaceCommands > AutoMod rule created: ${rule.name} (${rule.id}) in guild ${rule.guild.id}`);
            }
        });
        // Listen for AutoMod rule updates
        this._client.on('autoModerationRuleUpdate', (oldRule, newRule) => {
            this.cacheRule(newRule);
            if (this._instance.debug) {
                console.log(`SpaceCommands > AutoMod rule updated: ${newRule.name} (${newRule.id}) in guild ${newRule.guild.id}`);
            }
        });
        // Listen for AutoMod rule deletion
        this._client.on('autoModerationRuleDelete', (rule) => {
            this.uncacheRule(rule.guild.id, rule.id);
            if (this._instance.debug) {
                console.log(`SpaceCommands > AutoMod rule deleted: ${rule.name} (${rule.id}) in guild ${rule.guild.id}`);
            }
        });
    }
    /**
     * Create an AutoMod rule in a guild
     */
    async createRule(guild, config) {
        try {
            const rule = await guild.autoModerationRules.create({
                name: config.name,
                eventType: config.eventType,
                triggerType: config.triggerType,
                triggerMetadata: config.triggerMetadata,
                actions: config.actions,
                enabled: config.enabled ?? true,
                exemptRoles: config.exemptRoles,
                exemptChannels: config.exemptChannels,
            });
            this.cacheRule(rule);
            if (this._instance.debug) {
                console.log(`SpaceCommands > Created AutoMod rule: ${rule.name} (${rule.id}) in guild ${guild.id}`);
            }
            return rule;
        }
        catch (error) {
            console.error('SpaceCommands > Error creating AutoMod rule:', error);
            return null;
        }
    }
    /**
     * Update an existing AutoMod rule
     */
    async updateRule(guild, ruleId, config) {
        try {
            const rule = await guild.autoModerationRules.edit(ruleId, {
                name: config.name,
                eventType: config.eventType,
                triggerMetadata: config.triggerMetadata,
                actions: config.actions,
                enabled: config.enabled,
                exemptRoles: config.exemptRoles,
                exemptChannels: config.exemptChannels,
            });
            this.cacheRule(rule);
            if (this._instance.debug) {
                console.log(`SpaceCommands > Updated AutoMod rule: ${rule.name} (${rule.id}) in guild ${guild.id}`);
            }
            return rule;
        }
        catch (error) {
            console.error('SpaceCommands > Error updating AutoMod rule:', error);
            return null;
        }
    }
    /**
     * Delete an AutoMod rule
     */
    async deleteRule(guild, ruleId) {
        try {
            await guild.autoModerationRules.delete(ruleId);
            this.uncacheRule(guild.id, ruleId);
            if (this._instance.debug) {
                console.log(`SpaceCommands > Deleted AutoMod rule: ${ruleId} in guild ${guild.id}`);
            }
            return true;
        }
        catch (error) {
            console.error('SpaceCommands > Error deleting AutoMod rule:', error);
            return false;
        }
    }
    /**
     * Fetch all AutoMod rules for a guild
     */
    async fetchGuildRules(guild, useCache = true) {
        try {
            const rules = await guild.autoModerationRules.fetch();
            if (useCache) {
                // Update cache
                for (const rule of rules.values()) {
                    this.cacheRule(rule);
                }
            }
            return rules;
        }
        catch (error) {
            console.error('SpaceCommands > Error fetching AutoMod rules:', error);
            return new discord_js_1.Collection();
        }
    }
    /**
     * Fetch a specific AutoMod rule
     */
    async fetchRule(guild, ruleId, useCache = true) {
        try {
            // Check cache first
            if (useCache) {
                const cachedRule = this.getCachedRule(guild.id, ruleId);
                if (cachedRule)
                    return cachedRule;
            }
            const rule = await guild.autoModerationRules.fetch(ruleId);
            if (useCache) {
                this.cacheRule(rule);
            }
            return rule;
        }
        catch (error) {
            console.error('SpaceCommands > Error fetching AutoMod rule:', error);
            return null;
        }
    }
    /**
     * Register a handler for AutoMod action executions
     */
    registerActionHandler(handler) {
        this._actionHandlers.push(handler);
        if (this._instance.debug) {
            console.log(`SpaceCommands > Registered AutoMod action handler${handler.ruleId ? ` for rule: ${handler.ruleId}` : ''}`);
        }
        return this;
    }
    /**
     * Trigger all matching action handlers
     */
    async triggerActionHandlers(execution) {
        for (const handler of this._actionHandlers) {
            let matches = false;
            if (!handler.ruleId) {
                // Handler for all rules
                matches = true;
            }
            else if (typeof handler.ruleId === 'string') {
                matches = handler.ruleId === execution.ruleId;
            }
            else {
                matches = handler.ruleId.test(execution.ruleId);
            }
            if (matches) {
                try {
                    await handler.callback(execution, this._instance);
                }
                catch (error) {
                    console.error('SpaceCommands > Error executing AutoMod action handler:', error);
                }
            }
        }
    }
    /**
     * Cache a rule
     */
    cacheRule(rule) {
        const guildId = rule.guild.id;
        if (!this._ruleCache.has(guildId)) {
            this._ruleCache.set(guildId, new Map());
        }
        this._ruleCache.get(guildId).set(rule.id, rule);
    }
    /**
     * Remove a rule from cache
     */
    uncacheRule(guildId, ruleId) {
        if (this._ruleCache.has(guildId)) {
            this._ruleCache.get(guildId).delete(ruleId);
        }
    }
    /**
     * Get a cached rule
     */
    getCachedRule(guildId, ruleId) {
        return this._ruleCache.get(guildId)?.get(ruleId) || null;
    }
    /**
     * Clear the rule cache for a guild
     */
    clearGuildCache(guildId) {
        this._ruleCache.delete(guildId);
    }
    /**
     * Clear all rule caches
     */
    clearAllCaches() {
        this._ruleCache.clear();
    }
    /**
     * Helper: Create a keyword filter rule
     */
    async createKeywordRule(guild, name, keywords, actions, options) {
        return this.createRule(guild, {
            name,
            eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
            triggerType: discord_js_1.AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
                keywordFilter: keywords,
                allowList: options?.allowList,
            },
            actions,
            enabled: options?.enabled,
            exemptRoles: options?.exemptRoles,
            exemptChannels: options?.exemptChannels,
        });
    }
    /**
     * Helper: Create a spam rule
     */
    async createSpamRule(guild, name, actions, options) {
        return this.createRule(guild, {
            name,
            eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
            triggerType: discord_js_1.AutoModerationRuleTriggerType.Spam,
            actions,
            enabled: options?.enabled,
            exemptRoles: options?.exemptRoles,
            exemptChannels: options?.exemptChannels,
        });
    }
    /**
     * Helper: Create a mention spam rule
     */
    async createMentionSpamRule(guild, name, mentionLimit, actions, options) {
        return this.createRule(guild, {
            name,
            eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
            triggerType: discord_js_1.AutoModerationRuleTriggerType.MentionSpam,
            triggerMetadata: {
                mentionTotalLimit: mentionLimit,
                mentionRaidProtectionEnabled: options?.raidProtection ?? false,
            },
            actions,
            enabled: options?.enabled,
            exemptRoles: options?.exemptRoles,
            exemptChannels: options?.exemptChannels,
        });
    }
    /**
     * Helper: Create a regex pattern rule
     */
    async createRegexRule(guild, name, patterns, actions, options) {
        return this.createRule(guild, {
            name,
            eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
            triggerType: discord_js_1.AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
                regexPatterns: patterns,
                allowList: options?.allowList,
            },
            actions,
            enabled: options?.enabled,
            exemptRoles: options?.exemptRoles,
            exemptChannels: options?.exemptChannels,
        });
    }
    /**
     * Helper: Create preset keyword rule (profanity, slurs, etc.)
     */
    async createPresetRule(guild, name, presets, actions, options) {
        return this.createRule(guild, {
            name,
            eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
            triggerType: discord_js_1.AutoModerationRuleTriggerType.KeywordPreset,
            triggerMetadata: {
                presets,
                allowList: options?.allowList,
            },
            actions,
            enabled: options?.enabled,
            exemptRoles: options?.exemptRoles,
            exemptChannels: options?.exemptChannels,
        });
    }
}
exports.default = AutoModHandler;
