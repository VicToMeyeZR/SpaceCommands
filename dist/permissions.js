"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsBitField = exports.permissionList = void 0;
const discord_js_1 = require("discord.js");
Object.defineProperty(exports, "PermissionsBitField", { enumerable: true, get: function () { return discord_js_1.PermissionsBitField; } });
/**
 * Every permission discord.js knows about, derived rather than hand-listed.
 *
 * The list this replaces was written by hand and stopped at
 * `ManageEmojisAndStickers` — 31 entries. Everything Discord added after it was
 * rejected at command load with "invalid permission node", even though discord.js
 * defined the flag: `ManageEvents`, `CreateEvents`, `ModerateMembers`,
 * `UseApplicationCommands`, `ManageThreads`, and the rest. A bot declaring
 * `permissions: ['ManageEvents']` crashed on load, and the error message blamed
 * the permission rather than this list.
 *
 * Deriving from `PermissionFlagsBits` means the list cannot fall behind again: a
 * discord.js upgrade brings new permissions with it. The names are exactly the
 * keys `member.permissions.has()` accepts, which is what has-permissions.ts
 * passes them to.
 */
const permissionList = Object.keys(discord_js_1.PermissionFlagsBits);
exports.permissionList = permissionList;
