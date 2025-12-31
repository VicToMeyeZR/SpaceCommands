"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsBitField = exports.permissionList = void 0;
const discord_js_1 = require("discord.js");
Object.defineProperty(exports, "PermissionsBitField", { enumerable: true, get: function () { return discord_js_1.PermissionsBitField; } });
const permissionList = [
    'CreateInstantInvite',
    'KickMembers',
    'BanMembers',
    'Administrator',
    'ManageChannels',
    'ManageGuild',
    'AddReactions',
    'ViewAuditLog',
    'PrioritySpeaker',
    'Stream',
    'ViewChannel',
    'SendMessages',
    'SendTTSMessages',
    'ManageMessages',
    'EmbedLinks',
    'AttachFiles',
    'ReadMessageHistory',
    'MentionEveryone',
    'UseExternalEmojis',
    'ViewGuildInsights',
    'Connect',
    'Speak',
    'MuteMembers',
    'DeafenMembers',
    'MoveMembers',
    'UseVAD',
    'ChangeNickname',
    'ManageNicknames',
    'ManageRoles',
    'ManageWebhooks',
    'ManageEmojisAndStickers',
];
exports.permissionList = permissionList;
