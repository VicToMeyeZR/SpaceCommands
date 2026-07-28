import {
  Client,
  ButtonInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  InteractionType,
  ComponentType,
  MessageFlags,
} from 'discord.js'
import SpaceCommands from '..'
import path from 'path'
import getAllFiles from '../get-all-files'

export type AnySelectMenuInteraction =
  | StringSelectMenuInteraction
  | UserSelectMenuInteraction
  | RoleSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | MentionableSelectMenuInteraction

export interface IButtonHandler {
  customId: string | RegExp
  callback(interaction: ButtonInteraction, instance: SpaceCommands): Promise<any>
}

export interface ISelectMenuHandler {
  customId: string | RegExp
  callback(
    interaction: AnySelectMenuInteraction,
    instance: SpaceCommands
  ): Promise<any>
}

export default class ComponentHandler {
  private _client: Client
  private _instance: SpaceCommands
  private _buttonHandlers: Map<string, IButtonHandler> = new Map()
  private _selectMenuHandlers: Map<string, ISelectMenuHandler> = new Map()

  constructor(
    instance: SpaceCommands,
    componentsDir?: string,
    typeScript = false
  ) {
    this._instance = instance
    this._client = instance.client

    this.setUp(componentsDir, typeScript)
  }

  private async setUp(componentsDir?: string, typeScript = false) {
    // Listen for component interactions
    this._client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton() && !interaction.isAnySelectMenu()) {
        return
      }

      const customId = interaction.customId

      if (interaction.isButton()) {
        await this.handleButton(interaction as ButtonInteraction, customId)
      } else if (interaction.isAnySelectMenu()) {
        await this.handleSelectMenu(
          interaction as AnySelectMenuInteraction,
          customId
        )
      }
    })

    // Load custom component handlers if directory provided
    if (componentsDir) {
      await this.loadComponentHandlers(componentsDir, typeScript)
    }
  }

  private async loadComponentHandlers(dir: string, typeScript: boolean) {
    const files = getAllFiles(dir, typeScript ? '.ts' : '')

    for (const [file, fileName] of files) {
      const handler = require(file)
      const config = handler.default || handler

      if (config.type === 'button') {
        this.registerButtonHandler(config)
      } else if (config.type === 'selectMenu') {
        this.registerSelectMenuHandler(config)
      }
    }
  }

  public registerButtonHandler(handler: IButtonHandler) {
    const key =
      typeof handler.customId === 'string'
        ? handler.customId
        : handler.customId.source

    this._buttonHandlers.set(key, handler)
  }

  public registerSelectMenuHandler(handler: ISelectMenuHandler) {
    const key =
      typeof handler.customId === 'string'
        ? handler.customId
        : handler.customId.source

    this._selectMenuHandlers.set(key, handler)
  }

  private async handleButton(
    interaction: ButtonInteraction,
    customId: string
  ) {
    for (const [key, handler] of this._buttonHandlers.entries()) {
      const regex = handler.customId instanceof RegExp ? handler.customId : null

      if (
        (regex && regex.test(customId)) ||
        (!regex && handler.customId === customId)
      ) {
        try {
          await handler.callback(interaction, this._instance)
        } catch (error) {
          console.error(
            `SpaceCommands > Error handling button "${customId}":`,
            error
          )

          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'An error occurred while processing this button.',
              flags: MessageFlags.Ephemeral,
            })
          }
        }
        return
      }
    }
  }

  private async handleSelectMenu(
    interaction: AnySelectMenuInteraction,
    customId: string
  ) {
    for (const [key, handler] of this._selectMenuHandlers.entries()) {
      const regex =
        handler.customId instanceof RegExp ? handler.customId : null

      if (
        (regex && regex.test(customId)) ||
        (!regex && handler.customId === customId)
      ) {
        try {
          await handler.callback(interaction, this._instance)
        } catch (error) {
          console.error(
            `SpaceCommands > Error handling select menu "${customId}":`,
            error
          )

          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'An error occurred while processing this menu.',
              flags: MessageFlags.Ephemeral,
            })
          }
        }
        return
      }
    }
  }

  public get buttonHandlers(): Map<string, IButtonHandler> {
    return this._buttonHandlers
  }

  public get selectMenuHandlers(): Map<string, ISelectMenuHandler> {
    return this._selectMenuHandlers
  }
}
