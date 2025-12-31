# Changelog

All notable changes to SpaceCommands will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
