import { PermissionsBitField } from 'discord.js'

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
]

export { permissionList, PermissionsBitField }

type Permissions = typeof permissionList
export default Permissions
