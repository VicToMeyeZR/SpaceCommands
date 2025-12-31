"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentUtils = void 0;
const discord_js_1 = require("discord.js");
/**
 * Utility class for building Discord components with simplified API
 */
class ComponentUtils {
    /**
     * Create a button component
     */
    static createButton(customId, label, style = discord_js_1.ButtonStyle.Primary, options) {
        const button = new discord_js_1.ButtonBuilder().setCustomId(customId).setLabel(label);
        if (options?.url) {
            button.setStyle(discord_js_1.ButtonStyle.Link).setURL(options.url);
        }
        else {
            button.setStyle(style);
        }
        if (options?.emoji) {
            button.setEmoji(options.emoji);
        }
        if (options?.disabled) {
            button.setDisabled(true);
        }
        return button;
    }
    /**
     * Create a string select menu
     */
    static createStringSelect(customId, placeholder, options) {
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .addOptions(options);
        return select;
    }
    /**
     * Create a user select menu
     */
    static createUserSelect(customId, placeholder, options) {
        const select = new discord_js_1.UserSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder);
        if (options?.minValues)
            select.setMinValues(options.minValues);
        if (options?.maxValues)
            select.setMaxValues(options.maxValues);
        if (options?.disabled)
            select.setDisabled(true);
        return select;
    }
    /**
     * Create a role select menu
     */
    static createRoleSelect(customId, placeholder, options) {
        const select = new discord_js_1.RoleSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder);
        if (options?.minValues)
            select.setMinValues(options.minValues);
        if (options?.maxValues)
            select.setMaxValues(options.maxValues);
        if (options?.disabled)
            select.setDisabled(true);
        return select;
    }
    /**
     * Create a channel select menu
     */
    static createChannelSelect(customId, placeholder, options) {
        const select = new discord_js_1.ChannelSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder);
        if (options?.minValues)
            select.setMinValues(options.minValues);
        if (options?.maxValues)
            select.setMaxValues(options.maxValues);
        if (options?.disabled)
            select.setDisabled(true);
        if (options?.channelTypes)
            select.setChannelTypes(options.channelTypes);
        return select;
    }
    /**
     * Create a mentionable select menu (users and roles)
     */
    static createMentionableSelect(customId, placeholder, options) {
        const select = new discord_js_1.MentionableSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder);
        if (options?.minValues)
            select.setMinValues(options.minValues);
        if (options?.maxValues)
            select.setMaxValues(options.maxValues);
        if (options?.disabled)
            select.setDisabled(true);
        return select;
    }
    /**
     * Create an action row with components
     */
    static createActionRow(...components) {
        return new discord_js_1.ActionRowBuilder().addComponents(...components);
    }
    /**
     * Create a modal
     */
    static createModal(customId, title, ...components) {
        return new discord_js_1.ModalBuilder()
            .setCustomId(customId)
            .setTitle(title)
            .addComponents(...components);
    }
    /**
     * Create a text input for modals
     */
    static createTextInput(customId, label, style = discord_js_1.TextInputStyle.Short, options) {
        const input = new discord_js_1.TextInputBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(style);
        if (options?.placeholder)
            input.setPlaceholder(options.placeholder);
        if (options?.required !== undefined)
            input.setRequired(options.required);
        if (options?.minLength)
            input.setMinLength(options.minLength);
        if (options?.maxLength)
            input.setMaxLength(options.maxLength);
        if (options?.value)
            input.setValue(options.value);
        return input;
    }
    /**
     * Create a text input wrapped in an action row (for modals)
     */
    static createTextInputRow(customId, label, style = discord_js_1.TextInputStyle.Short, options) {
        const input = this.createTextInput(customId, label, style, options);
        return new discord_js_1.ActionRowBuilder().addComponents(input);
    }
}
exports.ComponentUtils = ComponentUtils;
exports.default = ComponentUtils;
