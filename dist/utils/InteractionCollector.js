"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionCollectorUtils = void 0;
const discord_js_1 = require("discord.js");
/**
 * Utility functions for creating interaction collectors
 */
class InteractionCollectorUtils {
    /**
     * Create a button collector for a message
     */
    static createButtonCollector(message, filter, options) {
        const collector = message.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            filter: filter,
            ...options,
        });
        return collector;
    }
    /**
     * Create a select menu collector for a message
     */
    static createSelectMenuCollector(message, filter, options) {
        const collector = message.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.StringSelect,
            filter: filter,
            ...options,
        });
        return collector;
    }
    /**
     * Wait for a button click
     */
    static async awaitButton(message, filter, time = 60000) {
        try {
            const interaction = await message.awaitMessageComponent({
                componentType: discord_js_1.ComponentType.Button,
                filter,
                time,
            });
            return interaction;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Wait for a select menu selection
     */
    static async awaitSelectMenu(message, filter, time = 60000) {
        try {
            const interaction = await message.awaitMessageComponent({
                componentType: discord_js_1.ComponentType.StringSelect,
                filter,
                time,
            });
            return interaction;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Wait for any component interaction
     */
    static async awaitComponent(message, filter, time = 60000) {
        try {
            const interaction = await message.awaitMessageComponent({
                filter,
                time,
            });
            return interaction;
        }
        catch (error) {
            return null;
        }
    }
}
exports.InteractionCollectorUtils = InteractionCollectorUtils;
exports.default = InteractionCollectorUtils;
