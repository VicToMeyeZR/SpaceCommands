"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const required_roles_1 = __importDefault(require("../models/required-roles"));
const commands_1 = __importDefault(require("../models/commands"));
module.exports = {
    description: 'Specifies what role each command requires (Config v3)',
    category: 'Configuration',
    permissions: ['Administrator'],
    aliases: ['requiredroles', 'requirerole', 'requireroles'],
    cooldown: '2s',
    slash: true,
    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<command> <roleid>',
    guildOnly: true,
    options: [
        {
            name: 'command',
            description: 'The command to set required roles for',
            required: true,
            type: 3, // STRING
            autocomplete: true,
        },
        {
            name: 'roleid',
            description: 'The role ID to require, or "none" to clear',
            required: true,
            type: 3, // STRING
            autocomplete: true,
        }
    ],
    autocomplete: async (interaction, instance) => {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'command') {
            // Fetch all commands (optimisation: maybe cache this?)
            let commands = [];
            try {
                commands = await commands_1.default.find();
            }
            catch (e) {
                console.warn('SpaceCommands > Failed to fetch commands for autocomplete:', e);
                return interaction.respond([]);
            }
            const filtered = commands.filter((cmd) => cmd.name && cmd.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
            return interaction.respond(filtered.slice(0, 25).map((cmd) => ({
                name: cmd.name,
                value: cmd.id,
            })));
        }
        else if (focusedOption.name === 'roleid') {
            const guild = interaction.guild;
            if (!guild)
                return interaction.respond([]);
            const filter = focusedOption.value.toLowerCase();
            const roles = guild.roles.cache
                .filter((r) => r.name.toLowerCase().includes(filter))
                .map((r) => ({ name: r.name, value: r.id }));
            const options = [];
            if ('none'.includes(filter)) {
                options.push({ name: 'None (Clear Roles)', value: 'none' });
            }
            // Add roles, limit total to 25
            const remainingSlots = 25 - options.length;
            options.push(...roles.slice(0, remainingSlots));
            return interaction.respond(options);
        }
    },
    callback: async (options) => {
        const { channel, args, instance } = options;
        const nameOrId = (args.shift() || '').toLowerCase();
        const roleId = (args.shift() || '').toLowerCase();
        const { guild } = channel;
        if (!guild) {
            return instance.messageHandler.get(guild, 'CANNOT_CHANGE_REQUIRED_ROLES_IN_DMS');
        }
        if (!instance.isDBConnected()) {
            return instance.messageHandler.get(guild, 'NO_DATABASE_FOUND');
        }
        let command = instance.commandHandler.getCommand(nameOrId);
        // specific check for UUID input from autocomplete
        if (!command) {
            // Find by DB ID
            for (const cmd of instance.commandHandler.commands) {
                // @ts-ignore
                const c = instance.commandHandler.getCommand(cmd.names[0]);
                if (c && c.dbId === nameOrId) {
                    command = c;
                    break;
                }
            }
        }
        if (command) {
            if (!command.dbId) {
                // Command exists but hasn't synced to DB yet?
                return instance.messageHandler.get(guild, 'COMMAND_NOT_SYNCED');
            }
            if (roleId === 'none') {
                command.removeRequiredRole(guild.id, roleId);
                await required_roles_1.default.deleteOne({
                    guildId: guild.id,
                    commandId: command.dbId,
                });
                return instance.messageHandler.get(guild, 'REMOVED_ALL_REQUIRED_ROLES', {
                    COMMAND: command.names[0],
                });
            }
            command.addRequiredRole(guild.id, roleId);
            await required_roles_1.default.findOneAndUpdate({
                guildId: guild.id,
                commandId: command.dbId,
            }, {
                guildId: guild.id,
                commandId: command.dbId,
                $addToSet: {
                    requiredRoles: roleId,
                },
            }, {
                upsert: true,
            });
            return instance.messageHandler.get(guild, 'ADDED_REQUIRED_ROLE', {
                ROLE: roleId,
                COMMAND: command.names[0],
            });
        }
        return instance.messageHandler.get(guild, 'UNKNOWN_COMMAND', {
            COMMAND: nameOrId,
        });
    },
};
