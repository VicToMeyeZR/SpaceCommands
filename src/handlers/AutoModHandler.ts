import {
  Client,
  AutoModerationRule,
  AutoModerationRuleTriggerType,
  AutoModerationRuleEventType,
  AutoModerationActionType,
  AutoModerationRuleKeywordPresetType,
  Guild,
  Snowflake,
  Collection,
  AutoModerationActionExecution,
} from 'discord.js'
import SpaceCommands from '..'

export interface IAutoModRuleConfig {
  name: string
  eventType: AutoModerationRuleEventType
  triggerType: AutoModerationRuleTriggerType
  triggerMetadata?: {
    keywordFilter?: string[]
    presets?: AutoModerationRuleKeywordPresetType[]
    allowList?: string[]
    mentionTotalLimit?: number
    mentionRaidProtectionEnabled?: boolean
    regexPatterns?: string[]
  }
  actions: Array<{
    type: AutoModerationActionType
    metadata?: {
      channelId?: Snowflake
      durationSeconds?: number
      customMessage?: string
    }
  }>
  enabled?: boolean
  exemptRoles?: Snowflake[]
  exemptChannels?: Snowflake[]
}

export interface IAutoModActionHandler {
  ruleId?: string | RegExp
  callback: (
    execution: AutoModerationActionExecution,
    instance: SpaceCommands
  ) => Promise<void> | void
}

/**
 * Handler for Discord AutoMod features
 * Provides utilities for creating, managing, and listening to AutoMod rules and actions
 */
export default class AutoModHandler {
  private _client: Client
  private _instance: SpaceCommands
  private _actionHandlers: IAutoModActionHandler[] = []
  private _ruleCache: Map<string, Map<string, AutoModerationRule>> = new Map() // guildId -> ruleId -> rule

  constructor(instance: SpaceCommands) {
    this._instance = instance
    this._client = instance.client

    this.setUp()
  }

  private setUp() {
    // Listen for AutoMod action executions
    this._client.on('autoModerationActionExecution', async (execution) => {
      if (this._instance.debug) {
        console.log(
          `SpaceCommands > AutoMod action executed in guild ${execution.guild.id}, rule: ${execution.ruleId}`
        )
      }

      await this.triggerActionHandlers(execution)
    })

    // Listen for AutoMod rule creation
    this._client.on('autoModerationRuleCreate', (rule) => {
      this.cacheRule(rule)

      if (this._instance.debug) {
        console.log(
          `SpaceCommands > AutoMod rule created: ${rule.name} (${rule.id}) in guild ${rule.guild.id}`
        )
      }
    })

    // Listen for AutoMod rule updates
    this._client.on('autoModerationRuleUpdate', (oldRule, newRule) => {
      this.cacheRule(newRule)

      if (this._instance.debug) {
        console.log(
          `SpaceCommands > AutoMod rule updated: ${newRule.name} (${newRule.id}) in guild ${newRule.guild.id}`
        )
      }
    })

    // Listen for AutoMod rule deletion
    this._client.on('autoModerationRuleDelete', (rule) => {
      this.uncacheRule(rule.guild.id, rule.id)

      if (this._instance.debug) {
        console.log(
          `SpaceCommands > AutoMod rule deleted: ${rule.name} (${rule.id}) in guild ${rule.guild.id}`
        )
      }
    })
  }

  /**
   * Create an AutoMod rule in a guild
   */
  public async createRule(
    guild: Guild,
    config: IAutoModRuleConfig
  ): Promise<AutoModerationRule | null> {
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
      })

      this.cacheRule(rule)

      if (this._instance.debug) {
        console.log(
          `SpaceCommands > Created AutoMod rule: ${rule.name} (${rule.id}) in guild ${guild.id}`
        )
      }

      return rule
    } catch (error) {
      console.error('SpaceCommands > Error creating AutoMod rule:', error)
      return null
    }
  }

  /**
   * Update an existing AutoMod rule
   */
  public async updateRule(
    guild: Guild,
    ruleId: Snowflake,
    config: Partial<IAutoModRuleConfig>
  ): Promise<AutoModerationRule | null> {
    try {
      const rule = await guild.autoModerationRules.edit(ruleId, {
        name: config.name,
        eventType: config.eventType,
        triggerMetadata: config.triggerMetadata,
        actions: config.actions,
        enabled: config.enabled,
        exemptRoles: config.exemptRoles,
        exemptChannels: config.exemptChannels,
      })

      this.cacheRule(rule)

      if (this._instance.debug) {
        console.log(
          `SpaceCommands > Updated AutoMod rule: ${rule.name} (${rule.id}) in guild ${guild.id}`
        )
      }

      return rule
    } catch (error) {
      console.error('SpaceCommands > Error updating AutoMod rule:', error)
      return null
    }
  }

  /**
   * Delete an AutoMod rule
   */
  public async deleteRule(
    guild: Guild,
    ruleId: Snowflake
  ): Promise<boolean> {
    try {
      await guild.autoModerationRules.delete(ruleId)

      this.uncacheRule(guild.id, ruleId)

      if (this._instance.debug) {
        console.log(
          `SpaceCommands > Deleted AutoMod rule: ${ruleId} in guild ${guild.id}`
        )
      }

      return true
    } catch (error) {
      console.error('SpaceCommands > Error deleting AutoMod rule:', error)
      return false
    }
  }

  /**
   * Fetch all AutoMod rules for a guild
   */
  public async fetchGuildRules(
    guild: Guild,
    useCache = true
  ): Promise<Collection<Snowflake, AutoModerationRule>> {
    try {
      const rules = await guild.autoModerationRules.fetch()

      if (useCache) {
        // Update cache
        for (const rule of rules.values()) {
          this.cacheRule(rule)
        }
      }

      return rules
    } catch (error) {
      console.error('SpaceCommands > Error fetching AutoMod rules:', error)
      return new Collection()
    }
  }

  /**
   * Fetch a specific AutoMod rule
   */
  public async fetchRule(
    guild: Guild,
    ruleId: Snowflake,
    useCache = true
  ): Promise<AutoModerationRule | null> {
    try {
      // Check cache first
      if (useCache) {
        const cachedRule = this.getCachedRule(guild.id, ruleId)
        if (cachedRule) return cachedRule
      }

      const rule = await guild.autoModerationRules.fetch(ruleId)

      if (useCache) {
        this.cacheRule(rule)
      }

      return rule
    } catch (error) {
      console.error('SpaceCommands > Error fetching AutoMod rule:', error)
      return null
    }
  }

  /**
   * Register a handler for AutoMod action executions
   */
  public registerActionHandler(
    handler: IAutoModActionHandler
  ): AutoModHandler {
    this._actionHandlers.push(handler)

    if (this._instance.debug) {
      console.log(
        `SpaceCommands > Registered AutoMod action handler${handler.ruleId ? ` for rule: ${handler.ruleId}` : ''}`
      )
    }

    return this
  }

  /**
   * Trigger all matching action handlers
   */
  private async triggerActionHandlers(
    execution: AutoModerationActionExecution
  ): Promise<void> {
    for (const handler of this._actionHandlers) {
      let matches = false

      if (!handler.ruleId) {
        // Handler for all rules
        matches = true
      } else if (typeof handler.ruleId === 'string') {
        matches = handler.ruleId === execution.ruleId
      } else {
        matches = handler.ruleId.test(execution.ruleId)
      }

      if (matches) {
        try {
          await handler.callback(execution, this._instance)
        } catch (error) {
          console.error(
            'SpaceCommands > Error executing AutoMod action handler:',
            error
          )
        }
      }
    }
  }

  /**
   * Cache a rule
   */
  private cacheRule(rule: AutoModerationRule): void {
    const guildId = rule.guild.id
    if (!this._ruleCache.has(guildId)) {
      this._ruleCache.set(guildId, new Map())
    }
    this._ruleCache.get(guildId)!.set(rule.id, rule)
  }

  /**
   * Remove a rule from cache
   */
  private uncacheRule(guildId: Snowflake, ruleId: Snowflake): void {
    if (this._ruleCache.has(guildId)) {
      this._ruleCache.get(guildId)!.delete(ruleId)
    }
  }

  /**
   * Get a cached rule
   */
  private getCachedRule(
    guildId: Snowflake,
    ruleId: Snowflake
  ): AutoModerationRule | null {
    return this._ruleCache.get(guildId)?.get(ruleId) || null
  }

  /**
   * Clear the rule cache for a guild
   */
  public clearGuildCache(guildId: Snowflake): void {
    this._ruleCache.delete(guildId)
  }

  /**
   * Clear all rule caches
   */
  public clearAllCaches(): void {
    this._ruleCache.clear()
  }

  /**
   * Helper: Create a keyword filter rule
   */
  public async createKeywordRule(
    guild: Guild,
    name: string,
    keywords: string[],
    actions: IAutoModRuleConfig['actions'],
    options?: {
      allowList?: string[]
      exemptRoles?: Snowflake[]
      exemptChannels?: Snowflake[]
      enabled?: boolean
    }
  ): Promise<AutoModerationRule | null> {
    return this.createRule(guild, {
      name,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Keyword,
      triggerMetadata: {
        keywordFilter: keywords,
        allowList: options?.allowList,
      },
      actions,
      enabled: options?.enabled,
      exemptRoles: options?.exemptRoles,
      exemptChannels: options?.exemptChannels,
    })
  }

  /**
   * Helper: Create a spam rule
   */
  public async createSpamRule(
    guild: Guild,
    name: string,
    actions: IAutoModRuleConfig['actions'],
    options?: {
      exemptRoles?: Snowflake[]
      exemptChannels?: Snowflake[]
      enabled?: boolean
    }
  ): Promise<AutoModerationRule | null> {
    return this.createRule(guild, {
      name,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Spam,
      actions,
      enabled: options?.enabled,
      exemptRoles: options?.exemptRoles,
      exemptChannels: options?.exemptChannels,
    })
  }

  /**
   * Helper: Create a mention spam rule
   */
  public async createMentionSpamRule(
    guild: Guild,
    name: string,
    mentionLimit: number,
    actions: IAutoModRuleConfig['actions'],
    options?: {
      raidProtection?: boolean
      exemptRoles?: Snowflake[]
      exemptChannels?: Snowflake[]
      enabled?: boolean
    }
  ): Promise<AutoModerationRule | null> {
    return this.createRule(guild, {
      name,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.MentionSpam,
      triggerMetadata: {
        mentionTotalLimit: mentionLimit,
        mentionRaidProtectionEnabled: options?.raidProtection ?? false,
      },
      actions,
      enabled: options?.enabled,
      exemptRoles: options?.exemptRoles,
      exemptChannels: options?.exemptChannels,
    })
  }

  /**
   * Helper: Create a regex pattern rule
   */
  public async createRegexRule(
    guild: Guild,
    name: string,
    patterns: string[],
    actions: IAutoModRuleConfig['actions'],
    options?: {
      allowList?: string[]
      exemptRoles?: Snowflake[]
      exemptChannels?: Snowflake[]
      enabled?: boolean
    }
  ): Promise<AutoModerationRule | null> {
    return this.createRule(guild, {
      name,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Keyword,
      triggerMetadata: {
        regexPatterns: patterns,
        allowList: options?.allowList,
      },
      actions,
      enabled: options?.enabled,
      exemptRoles: options?.exemptRoles,
      exemptChannels: options?.exemptChannels,
    })
  }

  /**
   * Helper: Create preset keyword rule (profanity, slurs, etc.)
   */
  public async createPresetRule(
    guild: Guild,
    name: string,
    presets: AutoModerationRuleKeywordPresetType[],
    actions: IAutoModRuleConfig['actions'],
    options?: {
      allowList?: string[]
      exemptRoles?: Snowflake[]
      exemptChannels?: Snowflake[]
      enabled?: boolean
    }
  ): Promise<AutoModerationRule | null> {
    return this.createRule(guild, {
      name,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.KeywordPreset,
      triggerMetadata: {
        presets,
        allowList: options?.allowList,
      },
      actions,
      enabled: options?.enabled,
      exemptRoles: options?.exemptRoles,
      exemptChannels: options?.exemptChannels,
    })
  }
}
