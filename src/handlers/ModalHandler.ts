import { Client, ModalSubmitInteraction } from 'discord.js'
import SpaceCommands from '..'
import getAllFiles from '../get-all-files'

export interface IModalHandler {
  customId: string | RegExp
  callback(
    interaction: ModalSubmitInteraction,
    instance: SpaceCommands
  ): Promise<any>
}

export default class ModalHandler {
  private _client: Client
  private _instance: SpaceCommands
  private _modalHandlers: Map<string, IModalHandler> = new Map()

  constructor(
    instance: SpaceCommands,
    modalsDir?: string,
    typeScript = false
  ) {
    this._instance = instance
    this._client = instance.client

    this.setUp(modalsDir, typeScript)
  }

  private async setUp(modalsDir?: string, typeScript = false) {
    // Listen for modal submissions
    this._client.on('interactionCreate', async (interaction) => {
      if (!interaction.isModalSubmit()) {
        return
      }

      const customId = interaction.customId
      await this.handleModal(interaction, customId)
    })

    // Load custom modal handlers if directory provided
    if (modalsDir) {
      await this.loadModalHandlers(modalsDir, typeScript)
    }
  }

  private async loadModalHandlers(dir: string, typeScript: boolean) {
    const files = getAllFiles(dir, typeScript ? '.ts' : '')

    for (const [file, fileName] of files) {
      const handler = require(file)
      const config = handler.default || handler

      if (config.type === 'modal') {
        this.registerModalHandler(config)
      }
    }
  }

  public registerModalHandler(handler: IModalHandler) {
    const key =
      typeof handler.customId === 'string'
        ? handler.customId
        : handler.customId.source

    this._modalHandlers.set(key, handler)
  }

  private async handleModal(
    interaction: ModalSubmitInteraction,
    customId: string
  ) {
    for (const [key, handler] of this._modalHandlers.entries()) {
      const regex = handler.customId instanceof RegExp ? handler.customId : null

      if (
        (regex && regex.test(customId)) ||
        (!regex && handler.customId === customId)
      ) {
        try {
          await handler.callback(interaction, this._instance)
        } catch (error) {
          console.error(
            `SpaceCommands > Error handling modal "${customId}":`,
            error
          )

          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'An error occurred while processing this form.',
              ephemeral: true,
            })
          }
        }
        return
      }
    }
  }

  public get modalHandlers(): Map<string, IModalHandler> {
    return this._modalHandlers
  }
}
