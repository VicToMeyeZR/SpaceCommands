"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptions = exports.normalizeOption = void 0;
const discord_js_1 = require("discord.js");
/**
 * Decide whether a slash command's registered options differ from the options
 * the code now declares, so SpaceCommands knows when to re-register it.
 *
 * Both sides are reduced to the same canonical shape and compared in full,
 * at every depth. The two inputs do not look alike out of the box:
 *
 *   registered  discord.js `ApplicationCommand#options` — camelCase keys
 *               (`minValue`, `channelTypes`), numeric types, and unset
 *               booleans reported as `undefined` or `false`.
 *   declared    whatever the command file supplied — `SlashCommandBuilder`
 *               JSON (snake_case keys, `required` omitted when false) or plain
 *               objects, possibly with legacy string types such as 'STRING'.
 *
 * Normalising first means representation differences are never mistaken for
 * a change (which would re-register every command on every start), while a
 * real change anywhere — including inside a subcommand or subcommand group —
 * is always detected.
 */
const LEGACY_TYPES = {
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
const resolveType = (type) => {
    if (typeof type === 'string') {
        return LEGACY_TYPES[type.toUpperCase()] ?? type;
    }
    return type;
};
const text = (value) => (typeof value === 'string' ? value.trim() : '');
/** Localisation maps: drop empty/null ones and sort keys so order never matters. */
const localizations = (map) => {
    if (!map || typeof map !== 'object')
        return undefined;
    const keys = Object.keys(map)
        .filter((key) => map[key] !== null && map[key] !== undefined)
        .sort();
    if (!keys.length)
        return undefined;
    const out = {};
    for (const key of keys)
        out[key] = map[key];
    return out;
};
const NUMERIC_LIMITS = [
    ['minValue', 'min_value'],
    ['maxValue', 'max_value'],
    ['minLength', 'min_length'],
    ['maxLength', 'max_length'],
];
/** Reduce one option to its canonical form. Key order is fixed by construction. */
const normalizeOption = (option) => {
    const type = resolveType(option?.type);
    const isSubcommand = type === discord_js_1.ApplicationCommandOptionType.Subcommand ||
        type === discord_js_1.ApplicationCommandOptionType.SubcommandGroup;
    const out = {
        name: text(option?.name),
        type,
        description: text(option?.description),
    };
    // `required` and `autocomplete` do not exist on subcommands; elsewhere an
    // unset value means false.
    if (!isSubcommand) {
        out.required = !!option?.required;
        out.autocomplete = !!option?.autocomplete;
    }
    const nameLocalizations = localizations(option?.nameLocalizations ?? option?.name_localizations);
    if (nameLocalizations)
        out.nameLocalizations = nameLocalizations;
    const descriptionLocalizations = localizations(option?.descriptionLocalizations ?? option?.description_localizations);
    if (descriptionLocalizations)
        out.descriptionLocalizations = descriptionLocalizations;
    if (Array.isArray(option?.choices) && option.choices.length) {
        out.choices = option.choices.map((choice) => {
            const normalized = {
                name: choice?.name,
                value: choice?.value,
            };
            const choiceLocalizations = localizations(choice?.nameLocalizations ?? choice?.name_localizations);
            if (choiceLocalizations)
                normalized.nameLocalizations = choiceLocalizations;
            return normalized;
        });
    }
    const channelTypes = option?.channelTypes ?? option?.channel_types;
    if (Array.isArray(channelTypes) && channelTypes.length) {
        out.channelTypes = [...channelTypes].sort((a, b) => a - b);
    }
    for (const [camel, snake] of NUMERIC_LIMITS) {
        const value = option?.[camel] ?? option?.[snake];
        if (value !== undefined && value !== null)
            out[camel] = value;
    }
    if (Array.isArray(option?.options) && option.options.length) {
        out.options = option.options.map(exports.normalizeOption);
    }
    return out;
};
exports.normalizeOption = normalizeOption;
const normalizeOptions = (options) => Array.isArray(options) ? options.map(exports.normalizeOption) : [];
exports.normalizeOptions = normalizeOptions;
/**
 * True when the registered options and the declared options are not the same
 * command definition. Option order matters (it is the order Discord shows).
 */
const slashOptionsDiffer = (registered, declared) => JSON.stringify((0, exports.normalizeOptions)(registered)) !==
    JSON.stringify((0, exports.normalizeOptions)(declared));
exports.default = slashOptionsDiffer;
