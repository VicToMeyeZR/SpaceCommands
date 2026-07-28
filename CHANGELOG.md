# Changelog

All notable changes to SpaceCommands will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.8.0] - 2026-07-28

### Note on versioning

This changelog jumps from 2.0.0 to 3.8.0. Versions 3.0.0 through 3.7.2 were published
to npm without changelog entries, and 3.5.0-3.7.2 were published from source that was
never committed here — `models/commands`, `models/message` and `models/premium-overrides`
existed only inside the published tarball. This release reconciles the two, so the repo
and the package describe the same library again. The entries below cover everything in
this release that 3.7.2 on npm does not already have.

### Fixed
- **`permissionList` no longer rejects modern permissions.** It was a hand-written array
  ending at `ManageEmojisAndStickers` (31 names), and `CommandHandler` throws on any
  permission absent from it — at command load, taking the bot down. That rejected 22
  permissions Discord has added since, including `ManageEvents`, `CreateEvents`,
  `ModerateMembers`, `UseApplicationCommands`, `ManageThreads`, `SendPolls` and
  `BypassSlowmode`. Because the thrown error names the permission, it read as though
  discord.js lacked the flag. Now derived from `PermissionFlagsBits`, so a discord.js
  upgrade keeps it current instead of letting it rot.
- **`/requiredrole <command> none` wiped required roles for the entire guild.**
  `models/required-roles.deleteOne` filtered on `filter.command`, but its only caller
  passes `{ guildId, commandId }`, so the filter was never applied and the delete ran
  with the guild filter alone — clearing every command's rows while replying that it had
  cleared only the named command. Role-gated commands silently lost their gates.
- **`models/cooldown` was missing `deleteOne`**, which `Command` already called. Any code
  path reaching it threw.
- **`models/required-roles` ignored `$addToSet`**, so every add-required-role wrote
  `undefined` over the existing list.
- **The entitlement check logged on every invocation.** `has-entitlement` printed the
  full `premiumServers` array for each check against a non-premium guild — once per
  paid-command invocation, publishing the configured premium guild ids into consumer
  logs. Removed outright rather than gated behind `instance.debug`, since consumers run
  with debug enabled and gating would have left it effectively unconditional.

### Added
- `premiumServers` option and getter, with a matching bypass in the entitlement check.
- `hasAnyGuildEntitlement(guildId, skuIds)` for real per-guild Discord SKU entitlements,
  distinct from manual overrides.
- `delete_command` built-in command.
- `guildOnly` on the `prefix`, `command`, `slash` and `requiredrole` built-ins.
- Per-user language resolution: `messageHandler.get()` calls now pass the invoking user,
  so replies use that user's language rather than only the guild's.

### Changed
- The tracked `dist/` is rebuilt from source. It had drifted behind `src/`, so git
  installs received none of the above.

## [2.0.0] - 2025-12-31

### Added
- **Poll Handler**: Full support for Discord's native polls feature
  - Create and manage polls with up to 10 answer options
  - Fetch poll results and get winning answers
  - End polls early programmatically
  - Register handlers for poll end events
  - Check user votes and get poll statistics
  - Get formatted results for easy display

- **AutoMod Handler**: Comprehensive Discord AutoMod integration
  - Create, update, and delete AutoMod rules
  - Support for all trigger types: Keyword, KeywordPreset, Spam, MentionSpam
  - Register handlers for AutoMod action executions
  - Built-in rule caching for better performance
  - Helper methods for common rule types (keyword, spam, mention spam, regex, preset)
  - Support for exempt roles and channels

- **Enhanced Type Definitions**: Complete TypeScript support for all new features
  - Poll handler interfaces and types
  - AutoMod handler interfaces and types
  - Improved type exports for better developer experience

- **NPM Package Improvements**:
  - Added LICENSE file (MIT)
  - Created .npmignore for cleaner package distribution
  - Enhanced package.json with comprehensive keywords
  - Added bugs and homepage URLs
  - Added peerDependencies for better dependency management
  - Improved package description

### Changed
- Updated to Discord.js v14.25.1 (latest stable version)
- Enhanced package metadata for better NPM discoverability
- Improved type definitions structure

### Fixed
- Type definitions now properly export all handler interfaces

## [1.0.0] - Initial Release

### Added
- Command handler for both slash and prefix commands
- Permission system with role-based restrictions
- Cooldown system with MongoDB persistence
- Multi-language support
- Category system for command organization
- MongoDB integration for data persistence
- TypeScript support with full type definitions
- Interactive components (buttons, select menus, modals)
- Context menu commands (user and message)
- Premium features with Discord entitlements
- Component utilities and interaction collectors
- Feature handler for event-based functionality
- Message handler for internationalization
- Slash command registration and management
- Component handler for buttons and select menus
- Modal handler for form inputs
- Context menu handler for right-click actions
- Entitlement handler for Discord monetization

### Features
- ✨ Modern Discord.js v14 support
- 🎯 Slash Commands with autocomplete
- 📝 Prefix Commands
- 🔒 Permission System
- ⏱️ Cooldown System
- 🌍 Multi-Language Support
- 🎨 Category System
- 🗄️ MongoDB Integration
- 📦 Full TypeScript Support
- 🎮 Interactive Components
- 📋 Context Menus
- 💎 Premium Features
- 🛠️ Component Utilities

[2.0.0]: https://github.com/VicToMeyeZR/SpaceCommands/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/VicToMeyeZR/SpaceCommands/releases/tag/v1.0.0
