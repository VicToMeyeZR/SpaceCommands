// @ts-nocheck
import { Guild, User } from 'discord.js'

import languageSchema from './models/languages'
import userLanguageSchema from './models/user-languages'
import SpaceCommands from '.'
import Events from './enums/Events'
const defualtMessages = require('../messages.json')

export default class MessageHandler {
  private _instance: SpaceCommands
  private _guildLanguages: Map<string, string> = new Map() // <Guild ID, Language>
  private _userLanguages: Map<string, string> = new Map() // <User ID, Language>
  private _languages: string[] = []
  private _messages: {
    [key: string]: {
      [key: string]: any
    }
  } = {}

  constructor(instance: SpaceCommands, messagePath: string) {
    this._instance = instance
      ; (async () => {
        this._messages = messagePath ? await import(messagePath) : defualtMessages

        for (const messageId of Object.keys(this._messages)) {
          for (const language of Object.keys(this._messages[messageId])) {
            this._languages.push(language.toLowerCase())
          }
        }

        if (!this._languages.includes(instance.defaultLanguage)) {
          throw new Error(
            `The current default language defined is not supported.`
          )
        }

        if (instance.isDBConnected()) {
          const results = await languageSchema.find()

          // @ts-ignore
          for (const { _id: guildId, language } of results) {
            this._guildLanguages.set(guildId, language)
          }

          const userResults = await userLanguageSchema.find()
          // @ts-ignore
          for (const { _id: userId, language } of userResults) {
            this._userLanguages.set(userId, language)
          }
        }
      })()
  }

  public languages(): string[] {
    return this._languages
  }

  public async setLanguage(guild: Guild | null, language: string) {
    if (guild) {
      this._guildLanguages.set(guild.id, language)
    }
  }

  public async setUserLanguage(user: User, language: string) {
    this._userLanguages.set(user.id, language)
  }

  public getLanguage(guild: Guild | null, user?: User | null): string {
    if (user) {
      const userLang = this._userLanguages.get(user.id)
      if (userLang) {
        return userLang
      }
    }

    if (guild) {
      const result = this._guildLanguages.get(guild.id)
      if (result) {
        return result
      }
    }
    return this._instance.defaultLanguage
  }

  get(
    guild: Guild | null,
    messageId: string,
    args: { [key: string]: string } = {},
    user?: User | null
  ): string {
    const language = this.getLanguage(guild, user)

    const translations = this._messages[messageId]
    if (!translations) {
      console.error(
        `SpaceCommands > Could not find the correct message to send for "${messageId}"`
      )
      return 'Could not find the correct message to send. Please report this to the bot developer.'
    }

    let result = translations[language]

    for (const key of Object.keys(args)) {
      const expression = new RegExp(`{${key}}`, 'g')
      result = result?.replace(expression, args[key])
    }

    return result
  }

  getEmbed(
    guild: Guild | null,
    embedId: string,
    itemId: string,
    args: { [key: string]: string } = {},
    user?: User | null
  ): string {
    const language = this.getLanguage(guild, user)

    const items = this._messages[embedId]
    if (!items) {
      console.error(
        `SpaceCommands > Could not find the correct item to send for "${embedId}" -> "${itemId}"`
      )
      return 'Could not find the correct message to send. Please report this to the bot developer.'
    }

    const translations = items[itemId]
    if (!translations) {
      console.error(
        `SpaceCommands > Could not find the correct message to send for "${embedId}"`
      )
      return 'Could not find the correct message to send. Please report this to the bot developer.'
    }

    let result = translations[language]

    for (const key of Object.keys(args)) {
      const expression = new RegExp(`{${key}}`, 'g')
      result = result.replace(expression, args[key])
    }

    return result
  }
}
