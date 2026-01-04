"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// @ts-nocheck
const user_languages_1 = __importDefault(require("../models/user-languages"));
const Events_1 = __importDefault(require("../enums/Events"));
module.exports = {
    description: 'Displays or sets your personal language preference',
    category: 'Configuration',
    aliases: ['mylang'],
    maxArgs: 1,
    expectedArgs: '[language]',
    testOnly: true,
    cooldown: '2s',
    options: [
        {
            name: 'language',
            description: 'The language to set for yourself',
            type: 3, // STRING
            required: false,
        },
    ],
    slash: 'both',
    callback: async (options) => {
        const { channel, text, instance, user } = options;
        const { guild } = channel;
        // Allow in DMs
        // if (!guild) {
        //   return
        // }
        const { messageHandler } = instance;
        if (!instance.isDBConnected()) {
            return instance.messageHandler.get(guild, 'NO_DATABASE_FOUND', {}, user);
        }
        const lang = text.toLowerCase();
        if (!lang) {
            return instance.messageHandler.get(guild, 'CURRENT_LANGUAGE', {
                LANGUAGE: instance.messageHandler.getLanguage(guild, user),
            }, user);
        }
        if (!messageHandler.languages().includes(lang)) {
            instance.emit(Events_1.default.LANGUAGE_NOT_SUPPORTED, guild, lang);
            return messageHandler.get(guild, 'LANGUAGE_NOT_SUPPORTED', {
                LANGUAGE: lang,
            }, user);
        }
        instance.messageHandler.setUserLanguage(user, lang);
        await user_languages_1.default.findOneAndUpdate({
            _id: user.id,
        }, {
            _id: user.id,
            language: lang,
        }, {
            upsert: true,
        });
        return instance.messageHandler.get(guild, 'NEW_LANGUAGE', {
            LANGUAGE: lang,
        }, user);
    },
};
