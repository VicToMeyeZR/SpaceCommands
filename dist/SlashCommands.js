"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// @ts-nocheck
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const get_all_files_1 = __importDefault(require("./get-all-files"));
const convertOptions = (options) => {
    if (!options)
        return options;
    return options.map((option) => {
        // Convert type from string to integer if needed
        if (typeof option.type === 'string') {
            const typeMap = {
                SUB_COMMAND: discord_js_1.ApplicationCommandOptionType.Subcommand,
                SUB_COMMAND_GROUP: discord_js_1.ApplicationCommandOptionType.SubcommandGroup,
                STRING: discord_js_1.ApplicationCommandOptionType.String,
                INTEGER: discord_js_1.ApplicationCommandOptionType.Integer,
                BOOLEAN: discord_js_1.ApplicationCommandOptionType.Boolean,
                USER: discord_js_1.ApplicationCommandOptionType.User,
                CHANNEL: discord_js_1.ApplicationCommandOptionType.Channel,
                ROLE: discord_js_1.ApplicationCommandOptionType.Role,
                MENTIONABLE: discord_js_1.ApplicationCommandOptionType.Mentionable,
                NUMBER: discord_js_1.ApplicationCommandOptionType.Number,
                ATTACHMENT: discord_js_1.ApplicationCommandOptionType.Attachment,
            };
            const upperType = option.type.toUpperCase();
            if (typeMap[upperType]) {
                option.type = typeMap[upperType];
            }
        }
        // Handle nested options recursively
        if (option.options) {
            option.options = convertOptions(option.options);
        }
        return option;
    });
};
class SlashCommands {
    _client;
    _instance;
    _commandChecks = new Map();
    _autocompleteHandlers = new Map();
    constructor(instance, listen, typeScript) {
        this._instance = instance;
        this._client = instance.client;
        this.setUp(listen, typeScript);
    }
    async setUp(listen, typeScript = false) {
        // Do not pass in TS here because this should always compiled to JS
        for (const [file, fileName] of (0, get_all_files_1.default)(path_1.default.join(__dirname, 'command-checks'))) {
            this._commandChecks.set(fileName, require(file));
        }
        const replyFromCheck = async (reply, interaction) => {
            if (!reply) {
                return new Promise((resolve) => {
                    resolve('No reply provided.');
                });
            }
            if (typeof reply === 'string') {
                return interaction.reply({
                    content: reply,
                    flags: this._instance.ephemeral ? discord_js_1.MessageFlags.Ephemeral : undefined,
                });
            }
            else {
                let embeds = [];
                if (Array.isArray(reply)) {
                    embeds = reply;
                }
                else {
                    embeds.push(reply);
                }
                return interaction.reply({
                    embeds,
                    flags: this._instance.ephemeral ? discord_js_1.MessageFlags.Ephemeral : undefined,
                });
            }
        };
        if (listen) {
            // Handle autocomplete interactions
            this._client.on('interactionCreate', async (interaction) => {
                if (!interaction.isAutocomplete()) {
                    return;
                }
                const handler = this._autocompleteHandlers.get(interaction.commandName);
                if (handler) {
                    try {
                        await handler(interaction);
                    }
                    catch (error) {
                        console.error(`SpaceCommands > Error in autocomplete for "${interaction.commandName}":`, error);
                    }
                }
            });
            // Handle command interactions
            this._client.on('interactionCreate', async (interaction) => {
                if (!interaction.isChatInputCommand()) {
                    return;
                }
                const { user, commandName, options, guild, channelId } = interaction;
                const member = interaction.member;
                const channel = guild?.channels.cache.get(channelId) || null;
                const command = this._instance.commandHandler.getCommand(commandName);
                if (!command) {
                    interaction.reply({
                        content: this._instance.messageHandler.get(guild, 'INVALID_SLASH_COMMAND', {}, interaction.user),
                        flags: this._instance.ephemeral ? discord_js_1.MessageFlags.Ephemeral : undefined,
                    });
                    return;
                }
                const args = [];
                options.data.forEach(({ value }) => {
                    args.push(String(value));
                });
                for (const [checkName, checkFunction,] of this._commandChecks.entries()) {
                    if (!(await checkFunction(guild, command, this._instance, member, user, (reply) => {
                        return replyFromCheck(reply, interaction);
                    }, args, commandName, channel))) {
                        return;
                    }
                }
                this.invokeCommand(interaction, commandName, options, args);
            });
        }
    }
    getCommands(guildId) {
        if (guildId) {
            return this._client.guilds.cache.get(guildId)?.commands;
        }
        return this._client.application?.commands;
    }
    async get(guildId) {
        const commands = this.getCommands(guildId);
        if (commands) {
            // @ts-ignore
            await commands.fetch();
            return commands.cache;
        }
        return new Map();
    }
    didOptionsChange(command, options) {
        return (command.options?.filter((opt, index) => {
            return (opt?.required !== options[index]?.required ||
                opt?.name !== options[index]?.name ||
                (opt?.options && opt.options.length !== options[index]?.options?.length));
        }).length !== 0);
    }
    async create(name, description, options, guildId) {
        let commands;
        if (guildId) {
            commands = this._client.guilds.cache.get(guildId)?.commands;
        }
        else {
            commands = this._client.application?.commands;
        }
        if (!commands) {
            return;
        }
        // @ts-ignore
        await commands.fetch();
        const cmd = commands.cache.find((cmd) => cmd.name === name);
        if (cmd) {
            const optionsChanged = this.didOptionsChange(cmd, options);
            if (cmd.description !== description ||
                cmd.options.length !== options.length ||
                optionsChanged) {
                console.log(`SpaceCommands > Updating${guildId ? ' guild' : ''} slash command "${name}"`);
                return commands?.edit(cmd.id, {
                    name,
                    description,
                    options,
                });
            }
            return Promise.resolve(cmd);
        }
        if (commands) {
            console.log(`SpaceCommands > Creating${guildId ? ' guild' : ''} slash command "${name}"`);
            const newCommand = await commands.create({
                name,
                description,
                options,
            });
            return newCommand;
        }
        return Promise.resolve(undefined);
    }
    async delete(commandId, guildId) {
        const commands = this.getCommands(guildId);
        if (commands) {
            const cmd = commands.cache.get(commandId);
            if (cmd) {
                console.log(`SpaceCommands > Deleting${guildId ? ' guild' : ''} slash command "${cmd.name}"`);
                cmd.delete();
            }
        }
        return Promise.resolve(undefined);
    }
    async deleteByName(name, guildId) {
        const commands = this.getCommands(guildId);
        if (commands) {
            await commands.fetch();
            const cmd = commands.cache.find((cmd) => cmd.name === name);
            if (cmd) {
                await this.delete(cmd.id, guildId);
            }
        }
    }
    async invokeCommand(interaction, commandName, options, args) {
        const command = this._instance.commandHandler.getCommand(commandName);
        if (!command || !command.callback) {
            return;
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
        });
        if (reply) {
            if (typeof reply === 'string') {
                interaction.reply({
                    content: reply,
                });
            }
            else if (typeof reply === 'object') {
                if (reply.custom) {
                    interaction.reply(reply);
                }
                else {
                    let embeds = [];
                    if (Array.isArray(reply)) {
                        embeds = reply;
                    }
                    else {
                        embeds.push(reply);
                    }
                    interaction.reply({ embeds });
                }
            }
        }
    }
    /**
     * Register an autocomplete handler for a command
     */
    registerAutocomplete(commandName, handler) {
        this._autocompleteHandlers.set(commandName, handler);
    }
    /**
     * Get all registered autocomplete handlers
     */
    get autocompleteHandlers() {
        return this._autocompleteHandlers;
    }
}
module.exports = SlashCommands;
