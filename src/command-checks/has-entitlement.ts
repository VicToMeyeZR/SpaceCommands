import { Guild, GuildMember, Message, User } from 'discord.js'
import SpaceCommands from '..'
import Command from '../Command'

export = async (
  guild: Guild | null,
  command: Command,
  instance: SpaceCommands,
  member: GuildMember,
  user: User,
  reply: Function
) => {
  const { requiredEntitlements, premiumOnly } = command

  // Bypass for Bot Owners
  if (instance.botOwner.includes(user.id)) {
    return true
  }

  // Bypass for Test Servers
  if (guild && instance.testServers.includes(guild.id)) {
    return true
  }

  // If no entitlements are required, allow the command
  if (!requiredEntitlements.length && !premiumOnly) {
    return true
  }

  // Deliberately silent on the miss. This runs for EVERY entitlement check against a
  // guild outside premiumServers — i.e. once per paid-command invocation — and the log
  // that used to live here reprinted the whole premiumServers array each time. Gating it
  // behind `instance.debug` was not enough: consumers run with debug enabled (StarBot
  // sets `debug: true`), so it stayed effectively unconditional in production and
  // published the configured premium guild ids into their logs. A caller that wants this
  // can log it at its own call site, where it fires once rather than per command.
  if (guild && instance.premiumServers.includes(guild.id)) {
    return true
  }

  const entitlementHandler = instance.entitlementHandler

  if (!entitlementHandler) {
    console.warn(
      'SpaceCommands > Command requires entitlements but EntitlementHandler is not initialized.'
    )
    return true
  }

  // Check if user has required entitlements
  if (requiredEntitlements.length > 0) {
    const { hasEntitlement } = await entitlementHandler.hasAnyEntitlement(
      user.id,
      requiredEntitlements,
      guild?.id
    )

    let hasAccess = hasEntitlement

    if (!hasAccess && guild) {
      const { hasEntitlement: hasGuildEntitlement } = await entitlementHandler.hasAnyGuildEntitlement(
        guild.id,
        requiredEntitlements
      )
      hasAccess = hasGuildEntitlement
    }

    if (!hasAccess) {
      reply(
        instance.messageHandler.get(guild, 'MISSING_ENTITLEMENT') ||
        'You need a premium subscription to use this command.'
      ).then((message: Message | null) => {
        if (!message) {
          return
        }

        if (instance.delErrMsgCooldown === -1 || !message.deletable) {
          return
        }

        setTimeout(() => {
          message.delete()
        }, 1000 * instance.delErrMsgCooldown)
      })

      return false
    }
  }

  // If premiumOnly is set, check for any active entitlement
  if (premiumOnly) {
    const allEntitlements = await entitlementHandler.getUserEntitlements(user.id)
    let hasPremium = allEntitlements.length > 0

    // Check guild overrides if no user entitlement found
    if (!hasPremium && guild) {
      const overrides = await entitlementHandler.getGuildOverrides(guild.id)
      hasPremium = overrides.length > 0
    }

    if (!hasPremium && guild) {
      const guildEntitlements = await entitlementHandler.getGuildEntitlements(guild.id)
      hasPremium = guildEntitlements.length > 0
    }

    if (!hasPremium) {
      reply(
        instance.messageHandler.get(guild, 'PREMIUM_ONLY') ||
        'This command is only available to premium subscribers.'
      ).then((message: Message | null) => {
        if (!message) {
          return
        }

        if (instance.delErrMsgCooldown === -1 || !message.deletable) {
          return
        }

        setTimeout(() => {
          message.delete()
        }, 1000 * instance.delErrMsgCooldown)
      })

      return false
    }
  }

  return true
}
