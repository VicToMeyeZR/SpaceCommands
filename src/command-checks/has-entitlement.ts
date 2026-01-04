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

  // If no entitlements are required, allow the command
  if (!requiredEntitlements.length && !premiumOnly) {
    return true
  }

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
      requiredEntitlements
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
