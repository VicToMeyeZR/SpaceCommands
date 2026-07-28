"use strict";
const discord_js_1 = require("discord.js");
let instance;
module.exports = {
    init: (client, inst) => {
        instance = inst;
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
    autocomplete: (interaction) => {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const choices = instance.messageHandler.languages();
        const filtered = choices.filter((choice) => choice.startsWith(focusedValue)).slice(0, 25);
        interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
    },
    callback: async (options) => {
        const { interaction, instance, text, guild, user } = options;
        if (!interaction || !interaction.isChatInputCommand()) {
            return;
        }
        const lang = text.toLowerCase();
        if (!instance.messageHandler.languages().includes(lang)) {
            await interaction.reply({
                content: instance.messageHandler.get(guild, 'LANGUAGE_NOT_SUPPORTED', { LANGUAGE: lang }),
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await instance.messageHandler.setUserLanguage(user, lang);
        await interaction.reply({
            content: instance.messageHandler.get(guild, 'NEW_LANGUAGE', { LANGUAGE: lang }, user),
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    },
};
