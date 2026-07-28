"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = __importDefault(require("./models/message"));
const languages_1 = __importDefault(require("./models/languages"));
const user_languages_1 = __importDefault(require("./models/user-languages"));
const defualtMessages = require('../messages.json');
class MessageHandler {
    _instance;
    _guildLanguages = new Map(); // <Guild ID, Language>
    _userLanguages = new Map(); // <User ID, Language>
    _languages = [];
    _messages = {};
    constructor(instance, messagePath) {
        this._instance = instance;
        (async () => {
            this._messages = messagePath ? await Promise.resolve(`${messagePath}`).then(s => __importStar(require(s))) : defualtMessages;
            if (instance.isDBConnected()) {
                const dbMessages = await message_1.default.find();
                for (const msg of dbMessages) {
                    this._messages[msg._id] = msg.text;
                }
                const results = await languages_1.default.find();
                // @ts-ignore
                for (const { _id: guildId, language } of results) {
                    this._guildLanguages.set(guildId, language);
                }
                const userResults = await user_languages_1.default.find();
                // @ts-ignore
                for (const { _id: userId, language } of userResults) {
                    this._userLanguages.set(userId, language);
                }
            }
            const languages = this._messages['LANGUAGE_NOT_SUPPORTED'] || this._messages['NEW_LANGUAGE'];
            if (languages) {
                for (const language of Object.keys(languages)) {
                    this._languages.push(language.toLowerCase());
                }
            }
            else {
                // Fallback: Use the first message found if standard ones are missing (unlikely)
                for (const messageId of Object.keys(this._messages)) {
                    for (const language of Object.keys(this._messages[messageId])) {
                        const lowerCaseLanguage = language.toLowerCase();
                        if (!this._languages.includes(lowerCaseLanguage)) {
                            this._languages.push(lowerCaseLanguage);
                        }
                    }
                    break; // Only check the first message to avoid iterating config objects
                }
            }
            if (!this._languages.includes(instance.defaultLanguage)) {
                throw new Error(`The current default language defined is not supported.`);
            }
        })();
    }
    languages() {
        return this._languages;
    }
    async setLanguage(guild, language) {
        if (guild) {
            this._guildLanguages.set(guild.id, language);
            if (this._instance.isDBConnected()) {
                await languages_1.default.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    _id: guild.id,
                    language,
                }, {
                    upsert: true,
                });
            }
        }
    }
    async setUserLanguage(user, language) {
        this._userLanguages.set(user.id, language);
        if (this._instance.isDBConnected()) {
            await user_languages_1.default.findOneAndUpdate({
                _id: user.id,
            }, {
                _id: user.id,
                language,
            }, {
                upsert: true,
            });
        }
    }
    getLanguage(guild, user) {
        if (user) {
            const userLang = this._userLanguages.get(user.id);
            if (userLang) {
                return userLang;
            }
        }
        if (guild) {
            const result = this._guildLanguages.get(guild.id);
            if (result) {
                return result;
            }
        }
        return this._instance.defaultLanguage;
    }
    get(guild, messageId, args = {}, user) {
        const language = this.getLanguage(guild, user);
        const translations = this._messages[messageId];
        if (!translations) {
            console.error(`SpaceCommands > Could not find the correct message to send for "${messageId}"`);
            return 'Could not find the correct message to send. Please report this to the bot developer.';
        }
        let result = translations[language];
        for (const key of Object.keys(args)) {
            const expression = new RegExp(`{${key}}`, 'g');
            result = result?.replace(expression, args[key]);
        }
        return result;
    }
    getEmbed(guild, embedId, itemId, args = {}, user) {
        const language = this.getLanguage(guild, user);
        const items = this._messages[embedId];
        if (!items) {
            console.error(`SpaceCommands > Could not find the correct item to send for "${embedId}" -> "${itemId}"`);
            return 'Could not find the correct message to send. Please report this to the bot developer.';
        }
        const translations = items[itemId];
        if (!translations) {
            console.error(`SpaceCommands > Could not find the correct message to send for "${embedId}"`);
            return 'Could not find the correct message to send. Please report this to the bot developer.';
        }
        let result = translations[language];
        for (const key of Object.keys(args)) {
            const expression = new RegExp(`{${key}}`, 'g');
            result = result.replace(expression, args[key]);
        }
        return result;
    }
}
exports.default = MessageHandler;
