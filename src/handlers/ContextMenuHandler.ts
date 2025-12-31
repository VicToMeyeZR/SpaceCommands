import {
  Client,
  ApplicationCommandType,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  ContextMenuCommandBuilder,
} from 'discord.js'
import SpaceCommands from '..'
import getAllFiles from '../get-all-files'
import path from 'path'

export type AnyContextMenuInteraction =
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction

export interface IContextMenuCommand {
  name: string
  type: ApplicationCommandType.User | ApplicationCommandType.Message
  guildOnly?: boolean
  ownerOnly?: boolean
  testOnly?: boolean
  permissions?: string[]
  callback(
    interaction: AnyContextMenuInteraction,
    instance: SpaceCommands
  ): Promise<any>
}

export default class ContextMenuHandler {
  private _client: Client
  private _instance: SpaceCommands
  private _contextMenus: Map<string, IContextMenuCommand> = new Map()

  constructor(
    instance: SpaceCommands,
    contextMenusDir?: string,
    typeScript = false
  ) {
    this._instance = instance
    this._client = instance.client

    this.setUp(contextMenusDir, typeScript)
  }

  private async setUp(contextMenusDir?: string, typeScript = false) {
    // Listen for context menu interactions
    this._client.on('interactionCreate', async (interaction) => {
      if (!interaction.isContextMenuCommand()) {
        return
      }

      const commandName = interaction.commandName
      await this.handleContextMenu(interaction, commandName)
    })

    // Load custom context menu commands if directory provided
    if (contextMenusDir) {
      await this.loadContextMenus(contextMenusDir, typeScript)
    }
  }

  private async loadContextMenus(dir: string, typeScript: boolean) {
    const files = getAllFiles(dir, typeScript ? '.ts' : '')

    for (const [file, fileName] of files) {
      const command = require(file)
      const config = command.default || command

      if (config.type && config.callback) {
        await this.registerContextMenu(config)
      }
    }
  }

  public async registerContextMenu(command: IContextMenuCommand) {
    this._contextMenus.set(command.name, command)

    // Register with Discord
    const contextMenuCommand = new ContextMenuCommandBuilder()
      .setName(command.name)
      .setType(command.type)

    if (command.testOnly && this._instance.testServers.length) {
      // Register to test servers only
      for (const guildId of this._instance.testServers) {
        const guild = this._client.guilds.cache.get(guildId)
        if (guild) {
          await guild.commands.create(contextMenuCommand.toJSON())
        }
      }
    } else {
      // Register globally
      await this._client.application?.commands.create(
        contextMenuCommand.toJSON()
      )
    }

    console.log(
      `SpaceCommands > Registered context menu command: ${command.name}`
    )
  }

  private async handleContextMenu(
    interaction: AnyContextMenuInteraction,
    commandName: string
  ) {
    const command = this._contextMenus.get(commandName)

    if (!command) {
      return
    }

    // Check owner-only
    if (
      command.ownerOnly &&
      !this._instance.botOwner.includes(interaction.user.id)
    ) {
      await interaction.reply({
        content: 'This command is only available to bot owners.',
        ephemeral: true,
      })
      return
    }

    // Check guild-only
    if (command.guildOnly && !interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in servers.',
        ephemeral: true,
      })
      return
    }

    // Check permissions
    if (command.permissions && interaction.guild && interaction.member) {
      const member = interaction.member as any
      const hasPermission = command.permissions.every((perm) =>
        member.permissions.has(perm)
      )

      if (!hasPermission) {
        await interaction.reply({
          content: 'You do not have permission to use this command.',
          ephemeral: true,
        })
        return
      }
    }

    try {
      await command.callback(interaction, this._instance)
    } catch (error) {
      console.error(
        `SpaceCommands > Error handling context menu "${commandName}":`,
        error
      )

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'An error occurred while executing this command.',
          ephemeral: true,
        })
      }
    }
  }

  public get contextMenus(): Map<string, IContextMenuCommand> {
    return this._contextMenus
  }
}
