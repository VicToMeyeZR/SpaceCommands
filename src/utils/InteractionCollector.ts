import {
  Message,
  ButtonInteraction,
  StringSelectMenuInteraction,
  MessageComponentInteraction,
  InteractionCollector as DiscordCollector,
  ComponentType,
  InteractionCollectorOptions,
} from 'discord.js'

/**
 * Utility functions for creating interaction collectors
 */
export class InteractionCollectorUtils {
  /**
   * Create a button collector for a message
   */
  static createButtonCollector(
    message: Message,
    filter?: (interaction: ButtonInteraction) => boolean,
    options?: InteractionCollectorOptions<ButtonInteraction>
  ): DiscordCollector<ButtonInteraction> {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button as any,
      filter: filter as any,
      ...options,
    })

    return collector as DiscordCollector<ButtonInteraction>
  }

  /**
   * Create a select menu collector for a message
   */
  static createSelectMenuCollector(
    message: Message,
    filter?: (interaction: StringSelectMenuInteraction) => boolean,
    options?: InteractionCollectorOptions<StringSelectMenuInteraction>
  ): DiscordCollector<StringSelectMenuInteraction> {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect as any,
      filter: filter as any,
      ...options,
    })

    return collector as DiscordCollector<StringSelectMenuInteraction>
  }

  /**
   * Wait for a button click
   */
  static async awaitButton(
    message: Message,
    filter?: (interaction: ButtonInteraction) => boolean,
    time = 60000
  ): Promise<ButtonInteraction | null> {
    try {
      const interaction = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter,
        time,
      })

      return interaction as ButtonInteraction
    } catch (error) {
      return null
    }
  }

  /**
   * Wait for a select menu selection
   */
  static async awaitSelectMenu(
    message: Message,
    filter?: (interaction: StringSelectMenuInteraction) => boolean,
    time = 60000
  ): Promise<StringSelectMenuInteraction | null> {
    try {
      const interaction = await message.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter,
        time,
      })

      return interaction as StringSelectMenuInteraction
    } catch (error) {
      return null
    }
  }

  /**
   * Wait for any component interaction
   */
  static async awaitComponent(
    message: Message,
    filter?: (interaction: MessageComponentInteraction) => boolean,
    time = 60000
  ): Promise<MessageComponentInteraction | null> {
    try {
      const interaction = await message.awaitMessageComponent({
        filter,
        time,
      })

      return interaction
    } catch (error) {
      return null
    }
  }
}

export default InteractionCollectorUtils
