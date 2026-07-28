// @ts-nocheck
import {
  ApplicationCommand,
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  Channel,
  Client,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Guild,
  GuildMember,
  EmbedBuilder,
  MessageFlags,
  User,
} from 'discord.js'
import path from 'path'

import getAllFiles from './get-all-files'
import SpaceCommands from '.'

const convertOptions = (options: any): any => {
  if (!options) return options

  return options.map((option: any) => {
    // Convert type from string to integer if needed
    if (typeof option.type === 'string') {
      const typeMap: { [key: string]: any } = {
        SUB_COMMAND: ApplicationCommandOptionType.Subcommand,
        SUB_COMMAND_GROUP: ApplicationCommandOptionType.SubcommandGroup,
        STRING: ApplicationCommandOptionType.String,
        INTEGER: ApplicationCommandOptionType.Integer,
        BOOLEAN: ApplicationCommandOptionType.Boolean,
        USER: ApplicationCommandOptionType.User,
        CHANNEL: ApplicationCommandOptionType.Channel,
        ROLE: ApplicationCommandOptionType.Role,
        MENTIONABLE: ApplicationCommandOptionType.Mentionable,
        NUMBER: ApplicationCommandOptionType.Number,
        ATTACHMENT: ApplicationCommandOptionType.Attachment,
      }

      const upperType = option.type.toUpperCase()
      if (typeMap[upperType]) {
        option.type = typeMap[upperType]
      }
    }

    // Handle nested options recursively
    if (option.options) {
      option.options = convertOptions(option.options)
    }

    return option
  })
}

class SlashCommands {
  private _client: Client
  private _instance: SpaceCommands
  private _commandChecks: Map<String, Function> = new Map()
  private _autocompleteHandlers: Map<
    string,
    (interaction: AutocompleteInteraction) => Promise<any>
  > = new Map()

  constructor(instance: SpaceCommands, listen: boolean, typeScript?: boolean) {
    this._instance = instance
    this._client = instance.client

    this.setUp(listen, typeScript)
  }

  private async setUp(listen: boolean, typeScript = false) {
    // Do not pass in TS here because this should always compiled to JS
    for (const [file, fileName] of getAllFiles(
      path.join(__dirname, 'command-checks')
    )) {
      this._commandChecks.set(fileName, require(file))
    }

    const replyFromCheck = async (
      reply: string | EmbedBuilder | EmbedBuilder[],
      interaction: CommandInteraction
    ) => {
      if (!reply) {
        return new Promise((resolve) => {
          resolve('No reply provided.')
        })
      }

      if (typeof reply === 'string') {
        return interaction.reply({
          content: reply,
          flags: this._instance.ephemeral ? MessageFlags.Ephemeral : undefined,
        })
      } else {
        let embeds = []

        if (Array.isArray(reply)) {
          embeds = reply
        } else {
          embeds.push(reply)
        }

        return interaction.reply({
          embeds,
          flags: this._instance.ephemeral ? MessageFlags.Ephemeral : undefined,
        })
      }
    }

    if (listen) {
      // Handle autocomplete interactions
      this._client.on('interactionCreate', async (interaction) => {
        if (!interaction.isAutocomplete()) {
          return
        }

        const handler = this._autocompleteHandlers.get(interaction.commandName)
        if (handler) {
          try {
            await handler(interaction)
          } catch (error) {
            console.error(
              `SpaceCommands > Error in autocomplete for "${interaction.commandName}":`,
              error
            )
          }
        }
      })

      // Handle command interactions
      this._client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) {
          return
        }

        const { user, commandName, options, guild, channelId } = interaction
        const member = interaction.member as GuildMember
        const channel = guild?.channels.cache.get(channelId) || null
        const command = this._instance.commandHandler.getCommand(commandName)

        if (!command) {
          interaction.reply({
            content: this._instance.messageHandler.get(
              guild,
              'INVALID_SLASH_COMMAND',
              {},
              interaction.user
            ),
            flags: this._instance.ephemeral ? MessageFlags.Ephemeral : undefined,
          })
          return
        }

        const args: string[] = []

        options.data.forEach(({ value }) => {
          args.push(String(value))
        })

        for (const [
          checkName,
          checkFunction,
        ] of this._commandChecks.entries()) {
          if (
            !(await checkFunction(
              guild,
              command,
              this._instance,
              member,
              user,
              (reply: string | EmbedBuilder) => {
                return replyFromCheck(reply, interaction)
              },
              args,
              commandName,
              channel
            ))
          ) {
            return
          }
        }

        this.invokeCommand(interaction, commandName, options, args)
      })
    }
  }

  public getCommands(guildId?: string) {
    if (guildId) {
      return this._client.guilds.cache.get(guildId)?.commands
    }

    return this._client.application?.commands
  }

  public async get(guildId?: string): Promise<Map<any, any>> {
    const commands = this.getCommands(guildId)
    if (commands) {
      // @ts-ignore
      await commands.fetch()
      return commands.cache
    }

    return new Map()
  }

  private didOptionsChange(
    command: ApplicationCommand,
    options: ApplicationCommandOptionData[]
  ): boolean {
    return (
      command.options?.filter((opt, index) => {
        return (
          opt?.required !== options[index]?.required ||
          opt?.name !== options[index]?.name ||
          (opt?.options && opt.options.length !== options[index]?.options?.length)
        )
      }).length !== 0
    )
  }

  public async create(
    name: string,
    description: string,
    options: ApplicationCommandOptionData[],
    guildId?: string
  ): Promise<ApplicationCommand<{}> | undefined> {
    let commands

    if (guildId) {
      commands = this._client.guilds.cache.get(guildId)?.commands
    } else {
      commands = this._client.application?.commands
    }

    if (!commands) {
      return
    }

    // @ts-ignore
    await commands.fetch()

    const cmd = commands.cache.find(
      (cmd) => cmd.name === name
    ) as ApplicationCommand

    if (cmd) {
      const optionsChanged = this.didOptionsChange(cmd, options)

      if (
        cmd.description !== description ||
        cmd.options.length !== options.length ||
        optionsChanged
      ) {
        console.log(
          `SpaceCommands > Updating${guildId ? ' guild' : ''
          } slash command "${name}"`
        )

        return commands?.edit(cmd.id, {
          name,
          description,
          options,
        })
      }

      return Promise.resolve(cmd)
    }

    if (commands) {
      console.log(
        `SpaceCommands > Creating${guildId ? ' guild' : ''
        } slash command "${name}"`
      )

      const newCommand = await commands.create({
        name,
        description,
        options,
      })

      return newCommand
    }

    return Promise.resolve(undefined)
  }

  public async delete(
    commandId: string,
    guildId?: string
  ): Promise<ApplicationCommand<{}> | undefined> {
    const commands = this.getCommands(guildId)
    if (commands) {
      const cmd = commands.cache.get(commandId)
      if (cmd) {
        console.log(
          `SpaceCommands > Deleting${guildId ? ' guild' : ''} slash command "${cmd.name
          }"`
        )

        cmd.delete()
      }
    }

    return Promise.resolve(undefined)
  }

  public async deleteByName(name: string, guildId?: string) {
    const commands = this.getCommands(guildId)
    if (commands) {
      await commands.fetch()

      const cmd = commands.cache.find((cmd) => cmd.name === name) as ApplicationCommand

      if (cmd) {
        await this.delete(cmd.id, guildId)
      }
    }
  }

  public async invokeCommand(
    interaction: CommandInteraction,
    commandName: string,
    options: CommandInteractionOptionResolver,
    args: string[]
  ) {
    const command = this._instance.commandHandler.getCommand(commandName)

    if (!command || !command.callback) {
      return
    }

    const reply = await command.callback({
      member: interaction.member,
      guild: interaction.guild,
      channel: interaction.channel,
      args,
      text: args.join(' '),
      client: this._client,
      instance: this._instance,
      interaction,
      options,
      user: interaction.user,
    })

    if (reply) {
      if (typeof reply === 'string') {
        interaction.reply({
          content: reply,
        })
      } else if (typeof reply === 'object') {
        if (reply.custom) {
          interaction.reply(reply)
        } else {
          let embeds = []

          if (Array.isArray(reply)) {
            embeds = reply
          } else {
            embeds.push(reply)
          }

          interaction.reply({ embeds })
        }
      }
    }
  }

  /**
   * Register an autocomplete handler for a command
   */
  public registerAutocomplete(
    commandName: string,
    handler: (interaction: AutocompleteInteraction) => Promise<any>
  ) {
    this._autocompleteHandlers.set(commandName, handler)
  }

  /**
   * Get all registered autocomplete handlers
   */
  public get autocompleteHandlers(): Map<
    string,
    (interaction: AutocompleteInteraction) => Promise<any>
  > {
    return this._autocompleteHandlers
  }
}

export = SlashCommands
