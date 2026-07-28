import { MessageFlags } from 'discord.js'
import { ICallbackObject, ICommand } from '../..'

let instance: any

export = {
    init: (client: any, inst: any) => {
        instance = inst
    },

    category: 'Configuration',
    description: 'Set your personal language preference for the bot.',

    slash: true,
    testOnly: false,

    options: [
        {
            name: 'language',
            description: 'The language code (e.g., english, spanish)',
            type: 3, // STRING
            required: true,
            autocomplete: true,
        },
    ],

    autocomplete: (interaction: any) => {
        const focusedValue = interaction.options.getFocused().toLowerCase()
        const choices = instance.messageHandler.languages()
        const filtered = choices.filter((choice: string) => choice.startsWith(focusedValue)).slice(0, 25)
        interaction.respond(filtered.map((choice: string) => ({ name: choice, value: choice })))
    },

    callback: async (options: ICallbackObject) => {
        const { interaction, instance, text, guild, user } = options

        if (!interaction || !interaction.isChatInputCommand()) {
            return
        }

        const lang = text.toLowerCase()

        if (!instance.messageHandler.languages().includes(lang)) {
            await interaction.reply({
                content: instance.messageHandler.get(guild, 'LANGUAGE_NOT_SUPPORTED', { LANGUAGE: lang }),
                flags: MessageFlags.Ephemeral,
            })
            return
        }

        await instance.messageHandler.setUserLanguage(user, lang)

        await interaction.reply({
            content: instance.messageHandler.get(guild, 'NEW_LANGUAGE', { LANGUAGE: lang }, user),
            flags: MessageFlags.Ephemeral,
        })
    },
} as ICommand
