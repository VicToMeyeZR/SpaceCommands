import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
} from 'discord.js'

/**
 * Utility class for building Discord components with simplified API
 */
export class ComponentUtils {
  /**
   * Create a button component
   */
  static createButton(
    customId: string,
    label: string,
    style: ButtonStyle = ButtonStyle.Primary,
    options?: {
      emoji?: string
      disabled?: boolean
      url?: string
    }
  ): ButtonBuilder {
    const button = new ButtonBuilder().setCustomId(customId).setLabel(label)

    if (options?.url) {
      button.setStyle(ButtonStyle.Link).setURL(options.url)
    } else {
      button.setStyle(style)
    }

    if (options?.emoji) {
      button.setEmoji(options.emoji)
    }

    if (options?.disabled) {
      button.setDisabled(true)
    }

    return button
  }

  /**
   * Create a string select menu
   */
  static createStringSelect(
    customId: string,
    placeholder: string,
    options: Array<{ label: string; value: string; description?: string; emoji?: string; default?: boolean }>
  ): StringSelectMenuBuilder {
    const select = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(options)

    return select
  }

  /**
   * Create a user select menu
   */
  static createUserSelect(
    customId: string,
    placeholder: string,
    options?: {
      minValues?: number
      maxValues?: number
      disabled?: boolean
    }
  ): UserSelectMenuBuilder {
    const select = new UserSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)

    if (options?.minValues) select.setMinValues(options.minValues)
    if (options?.maxValues) select.setMaxValues(options.maxValues)
    if (options?.disabled) select.setDisabled(true)

    return select
  }

  /**
   * Create a role select menu
   */
  static createRoleSelect(
    customId: string,
    placeholder: string,
    options?: {
      minValues?: number
      maxValues?: number
      disabled?: boolean
    }
  ): RoleSelectMenuBuilder {
    const select = new RoleSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)

    if (options?.minValues) select.setMinValues(options.minValues)
    if (options?.maxValues) select.setMaxValues(options.maxValues)
    if (options?.disabled) select.setDisabled(true)

    return select
  }

  /**
   * Create a channel select menu
   */
  static createChannelSelect(
    customId: string,
    placeholder: string,
    options?: {
      minValues?: number
      maxValues?: number
      disabled?: boolean
      channelTypes?: number[]
    }
  ): ChannelSelectMenuBuilder {
    const select = new ChannelSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)

    if (options?.minValues) select.setMinValues(options.minValues)
    if (options?.maxValues) select.setMaxValues(options.maxValues)
    if (options?.disabled) select.setDisabled(true)
    if (options?.channelTypes) select.setChannelTypes(options.channelTypes)

    return select
  }

  /**
   * Create a mentionable select menu (users and roles)
   */
  static createMentionableSelect(
    customId: string,
    placeholder: string,
    options?: {
      minValues?: number
      maxValues?: number
      disabled?: boolean
    }
  ): MentionableSelectMenuBuilder {
    const select = new MentionableSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)

    if (options?.minValues) select.setMinValues(options.minValues)
    if (options?.maxValues) select.setMaxValues(options.maxValues)
    if (options?.disabled) select.setDisabled(true)

    return select
  }

  /**
   * Create an action row with components
   */
  static createActionRow(
    ...components: any[]
  ): ActionRowBuilder<any> {
    return new ActionRowBuilder().addComponents(...components)
  }

  /**
   * Create a modal
   */
  static createModal(
    customId: string,
    title: string,
    ...components: ActionRowBuilder<TextInputBuilder>[]
  ): ModalBuilder {
    return new ModalBuilder()
      .setCustomId(customId)
      .setTitle(title)
      .addComponents(...components)
  }

  /**
   * Create a text input for modals
   */
  static createTextInput(
    customId: string,
    label: string,
    style: TextInputStyle = TextInputStyle.Short,
    options?: {
      placeholder?: string
      required?: boolean
      minLength?: number
      maxLength?: number
      value?: string
    }
  ): TextInputBuilder {
    const input = new TextInputBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(style)

    if (options?.placeholder) input.setPlaceholder(options.placeholder)
    if (options?.required !== undefined) input.setRequired(options.required)
    if (options?.minLength) input.setMinLength(options.minLength)
    if (options?.maxLength) input.setMaxLength(options.maxLength)
    if (options?.value) input.setValue(options.value)

    return input
  }

  /**
   * Create a text input wrapped in an action row (for modals)
   */
  static createTextInputRow(
    customId: string,
    label: string,
    style: TextInputStyle = TextInputStyle.Short,
    options?: {
      placeholder?: string
      required?: boolean
      minLength?: number
      maxLength?: number
      value?: string
    }
  ): ActionRowBuilder<TextInputBuilder> {
    const input = this.createTextInput(customId, label, style, options)
    return new ActionRowBuilder<TextInputBuilder>().addComponents(input)
  }
}

export default ComponentUtils
