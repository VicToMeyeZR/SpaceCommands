"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const get_all_files_1 = __importDefault(require("../get-all-files"));
class ContextMenuHandler {
    _client;
    _instance;
    _contextMenus = new Map();
    constructor(instance, contextMenusDir, typeScript = false) {
        this._instance = instance;
        this._client = instance.client;
        this.setUp(contextMenusDir, typeScript);
    }
    async setUp(contextMenusDir, typeScript = false) {
        // Listen for context menu interactions
        this._client.on('interactionCreate', async (interaction) => {
            if (!interaction.isContextMenuCommand()) {
                return;
            }
            const commandName = interaction.commandName;
            await this.handleContextMenu(interaction, commandName);
        });
        // Load custom context menu commands if directory provided
        if (contextMenusDir) {
            await this.loadContextMenus(contextMenusDir, typeScript);
        }
    }
    async loadContextMenus(dir, typeScript) {
        const files = (0, get_all_files_1.default)(dir, typeScript ? '.ts' : '');
        for (const [file, fileName] of files) {
            const command = require(file);
            const config = command.default || command;
            if (config.type && config.callback) {
                await this.registerContextMenu(config);
            }
        }
    }
    async registerContextMenu(command) {
        this._contextMenus.set(command.name, command);
        // Register with Discord
        const contextMenuCommand = new discord_js_1.ContextMenuCommandBuilder()
            .setName(command.name)
            .setType(command.type);
        if (command.testOnly && this._instance.testServers.length) {
            // Register to test servers only
            for (const guildId of this._instance.testServers) {
                const guild = this._client.guilds.cache.get(guildId);
                if (guild) {
                    await guild.commands.create(contextMenuCommand.toJSON());
                }
            }
        }
        else {
            // Register globally
            await this._client.application?.commands.create(contextMenuCommand.toJSON());
        }
        console.log(`SpaceCommands > Registered context menu command: ${command.name}`);
    }
    async handleContextMenu(interaction, commandName) {
        const command = this._contextMenus.get(commandName);
        if (!command) {
            return;
        }
        // Check owner-only
        if (command.ownerOnly &&
            !this._instance.botOwner.includes(interaction.user.id)) {
            await interaction.reply({
                content: 'This command is only available to bot owners.',
                ephemeral: true,
            });
            return;
        }
        // Check guild-only
        if (command.guildOnly && !interaction.guild) {
            await interaction.reply({
                content: 'This command can only be used in servers.',
                ephemeral: true,
            });
            return;
        }
        // Check permissions
        if (command.permissions && interaction.guild && interaction.member) {
            const member = interaction.member;
            const hasPermission = command.permissions.every((perm) => member.permissions.has(perm));
            if (!hasPermission) {
                await interaction.reply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true,
                });
                return;
            }
        }
        try {
            await command.callback(interaction, this._instance);
        }
        catch (error) {
            console.error(`SpaceCommands > Error handling context menu "${commandName}":`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'An error occurred while executing this command.',
                    ephemeral: true,
                });
            }
        }
    }
    get contextMenus() {
        return this._contextMenus;
    }
}
exports.default = ContextMenuHandler;
