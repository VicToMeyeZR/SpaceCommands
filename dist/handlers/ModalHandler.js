"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_all_files_1 = __importDefault(require("../get-all-files"));
class ModalHandler {
    _client;
    _instance;
    _modalHandlers = new Map();
    constructor(instance, modalsDir, typeScript = false) {
        this._instance = instance;
        this._client = instance.client;
        this.setUp(modalsDir, typeScript);
    }
    async setUp(modalsDir, typeScript = false) {
        // Listen for modal submissions
        this._client.on('interactionCreate', async (interaction) => {
            if (!interaction.isModalSubmit()) {
                return;
            }
            const customId = interaction.customId;
            await this.handleModal(interaction, customId);
        });
        // Load custom modal handlers if directory provided
        if (modalsDir) {
            await this.loadModalHandlers(modalsDir, typeScript);
        }
    }
    async loadModalHandlers(dir, typeScript) {
        const files = (0, get_all_files_1.default)(dir, typeScript ? '.ts' : '');
        for (const [file, fileName] of files) {
            const handler = require(file);
            const config = handler.default || handler;
            if (config.type === 'modal' || (config.customId && config.callback)) {
                this.registerModalHandler(config);
            }
        }
    }
    registerModalHandler(handler) {
        const key = typeof handler.customId === 'string'
            ? handler.customId
            : handler.customId.source;
        this._modalHandlers.set(key, handler);
    }
    async handleModal(interaction, customId) {
        for (const [key, handler] of this._modalHandlers.entries()) {
            const regex = handler.customId instanceof RegExp ? handler.customId : null;
            if ((regex && regex.test(customId)) ||
                (!regex && handler.customId === customId)) {
                try {
                    await handler.callback(interaction, this._instance);
                }
                catch (error) {
                    console.error(`SpaceCommands > Error handling modal "${customId}":`, error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: 'An error occurred while processing this form.',
                            ephemeral: true,
                        });
                    }
                }
                return;
            }
        }
    }
    get modalHandlers() {
        return this._modalHandlers;
    }
}
exports.default = ModalHandler;
