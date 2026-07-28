"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const get_all_files_1 = __importDefault(require("../get-all-files"));
class ComponentHandler {
    _client;
    _instance;
    _buttonHandlers = new Map();
    _selectMenuHandlers = new Map();
    constructor(instance, componentsDir, typeScript = false) {
        this._instance = instance;
        this._client = instance.client;
        this.setUp(componentsDir, typeScript);
    }
    async setUp(componentsDir, typeScript = false) {
        // Listen for component interactions
        this._client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton() && !interaction.isAnySelectMenu()) {
                return;
            }
            const customId = interaction.customId;
            if (interaction.isButton()) {
                await this.handleButton(interaction, customId);
            }
            else if (interaction.isAnySelectMenu()) {
                await this.handleSelectMenu(interaction, customId);
            }
        });
        // Load custom component handlers if directory provided
        if (componentsDir) {
            await this.loadComponentHandlers(componentsDir, typeScript);
        }
    }
    async loadComponentHandlers(dir, typeScript) {
        const files = (0, get_all_files_1.default)(dir, typeScript ? '.ts' : '');
        for (const [file, fileName] of files) {
            const handler = require(file);
            const config = handler.default || handler;
            if (config.type === 'button') {
                this.registerButtonHandler(config);
            }
            else if (config.type === 'selectMenu') {
                this.registerSelectMenuHandler(config);
            }
        }
    }
    registerButtonHandler(handler) {
        const key = typeof handler.customId === 'string'
            ? handler.customId
            : handler.customId.source;
        this._buttonHandlers.set(key, handler);
    }
    registerSelectMenuHandler(handler) {
        const key = typeof handler.customId === 'string'
            ? handler.customId
            : handler.customId.source;
        this._selectMenuHandlers.set(key, handler);
    }
    async handleButton(interaction, customId) {
        for (const [key, handler] of this._buttonHandlers.entries()) {
            const regex = handler.customId instanceof RegExp ? handler.customId : null;
            if ((regex && regex.test(customId)) ||
                (!regex && handler.customId === customId)) {
                try {
                    await handler.callback(interaction, this._instance);
                }
                catch (error) {
                    console.error(`SpaceCommands > Error handling button "${customId}":`, error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: 'An error occurred while processing this button.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        });
                    }
                }
                return;
            }
        }
    }
    async handleSelectMenu(interaction, customId) {
        for (const [key, handler] of this._selectMenuHandlers.entries()) {
            const regex = handler.customId instanceof RegExp ? handler.customId : null;
            if ((regex && regex.test(customId)) ||
                (!regex && handler.customId === customId)) {
                try {
                    await handler.callback(interaction, this._instance);
                }
                catch (error) {
                    console.error(`SpaceCommands > Error handling select menu "${customId}":`, error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: 'An error occurred while processing this menu.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        });
                    }
                }
                return;
            }
        }
    }
    get buttonHandlers() {
        return this._buttonHandlers;
    }
    get selectMenuHandlers() {
        return this._selectMenuHandlers;
    }
}
exports.default = ComponentHandler;
