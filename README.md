# SpaceCommands

SpaceCommands is a modern, feature-rich Discord.js command handler library. Built on Discord.js v14, it provides an easy-to-use framework for creating Discord bots with slash commands, permissions, cooldowns, and more.

## Features

- ✨ **Modern Discord.js v14** - Built for the latest Discord features
- 🎯 **Slash Commands** - Full support for Discord's slash commands with autocomplete
- 📝 **Prefix Commands** - Traditional message-based commands
- 🔒 **Permission System** - Role and permission-based command restrictions
- ⏱️ **Cooldown System** - Per-user and global cooldowns with MongoDB persistence
- 🌍 **Multi-Language Support** - Built-in internationalization
- 🎨 **Category System** - Organize commands with custom categories
- 🗄️ **MongoDB Integration** - Optional database support for persistence
- 📦 **TypeScript Support** - Full TypeScript support with type definitions
- 🎮 **Interactive Components** - Buttons, select menus, and modals
- 📋 **Context Menus** - User and message context menu commands
- 💎 **Premium Features** - Discord entitlement and monetization support
- 🛠️ **Component Utilities** - Simplified builders and interaction collectors
- 📊 **Poll Support** - Native Discord polls with result tracking
- 🛡️ **AutoMod Integration** - Full AutoMod rule creation and management

## Installation

**NPM**

```bash
npm install spacecommands
```

**Yarn**

```bash
yarn add spacecommands
```

## Quick Start

```javascript
const { Client, IntentsBitField } = require('discord.js');
const SpaceCommands = require('spacecommands');
const path = require('path');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', () => {
  new SpaceCommands(client, {
    commandsDir: path.join(__dirname, 'commands'),
    featuresDir: path.join(__dirname, 'features'),
    testServers: ['YOUR_TEST_SERVER_ID'],
    botOwners: ['YOUR_USER_ID'],
    // Database (optional - Supabase recommended)
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
  });
});

client.login(process.env.BOT_TOKEN);
```

## Supabase Setup (Recommended)

SpaceCommands now uses Supabase for data persistence instead of MongoDB. Here's how to set it up:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Copy your project URL and anon/public key

### 2. Set Up the Database

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase-schema.sql` from this package
3. Run the SQL to create all required tables

Or download the schema:
```bash
curl -o supabase-schema.sql https://raw.githubusercontent.com/VicToMeyeZR/SpaceCommands/main/supabase-schema.sql
```

### 3. Configure Your Bot

```javascript
new SpaceCommands(client, {
  commandsDir: path.join(__dirname, 'commands'),
  supabaseUrl: process.env.SUPABASE_URL,        // Your Supabase project URL
  supabaseKey: process.env.SUPABASE_ANON_KEY,   // Your Supabase anon/public key
});
```

### 4. Environment Variables

Create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### Benefits of Supabase

- ✅ **Free tier** with generous limits
- ✅ **Real-time subscriptions** (optional)
- ✅ **Built-in authentication** (if needed)
- ✅ **Auto-generated APIs**
- ✅ **Better performance** than MongoDB for most use cases
- ✅ **PostgreSQL** under the hood

## Creating Commands

### Slash Command Example

```javascript
module.exports = {
  category: 'Utility',
  description: 'Ping command',

  slash: true, // or 'both' for slash and prefix

  callback: ({ interaction }) => {
    return 'Pong!';
  },
};
```

### Prefix Command Example

```javascript
module.exports = {
  category: 'Utility',
  description: 'Ping command',

  aliases: ['pong'],

  callback: ({ message }) => {
    return 'Pong!';
  },
};
```

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `commandsDir` | string | Absolute path to commands directory | Required |
| `featuresDir` | string | Absolute path to features directory | Optional |
| `supabaseUrl` | string | Supabase project URL | Optional |
| `supabaseKey` | string | Supabase anon/public key | Optional |
| `mongoUri` | string | MongoDB URI (deprecated, use Supabase) | Optional |
| `testServers` | string[] | Guild IDs for testing commands | [] |
| `botOwners` | string[] | User IDs of bot owners | [] |
| `defaultLanguage` | string | Default language for messages | 'english' |
| `ephemeral` | boolean | Slash commands reply ephemerally | true |
| `showWarns` | boolean | Show warning messages | true |
| `typeScript` | boolean | Enable TypeScript support | false |

## Command Options

### Basic Options
- `category` - Command category for organization
- `description` - Command description (required for slash commands)
- `aliases` / `names` - Alternative command names
- `slash` - Enable as slash command (true, false, or 'both')

### Permissions & Access
- `permissions` / `requiredPermissions` - Required Discord permissions
- `requireRoles` - Require specific roles
- `ownerOnly` - Restrict to bot owners only
- `guildOnly` - Disable in DMs
- `testOnly` - Only available in test servers

### Arguments
- `minArgs` - Minimum required arguments
- `maxArgs` - Maximum allowed arguments
- `expectedArgs` - Argument format string
- `syntaxError` - Custom error messages per language

### Advanced
- `cooldown` - Per-user cooldown (e.g., "5s", "1m")
- `globalCooldown` - Global cooldown (minimum 1m)
- `hidden` - Hide from help command
- `options` - Slash command options array

## Interactive Components

SpaceCommands provides full support for Discord's interactive components including buttons, select menus, and modals.

### Button Handlers

Register button handlers to respond to button clicks:

```javascript
// In your bot initialization
const instance = new SpaceCommands(client, { ... });

// Register a button handler
instance.componentHandler.registerButtonHandler({
  customId: 'my-button',
  callback: async (interaction, instance) => {
    await interaction.reply('Button clicked!');
  },
});

// Use regex for dynamic button IDs
instance.componentHandler.registerButtonHandler({
  customId: /^page-\d+$/,
  callback: async (interaction, instance) => {
    const pageNum = interaction.customId.split('-')[1];
    await interaction.reply(`Showing page ${pageNum}`);
  },
});
```

### Select Menu Handlers

Handle all types of select menus (string, user, role, channel, mentionable):

```javascript
instance.componentHandler.registerSelectMenuHandler({
  customId: 'role-select',
  callback: async (interaction, instance) => {
    const selectedRoles = interaction.values;
    await interaction.reply(`Selected: ${selectedRoles.join(', ')}`);
  },
});
```

### Component Builders

Use the simplified component builder utilities:

```javascript
const { ComponentUtils } = require('spacecommands');

// Create a button
const button = ComponentUtils.createButton(
  'my-button',
  'Click Me',
  ButtonStyle.Primary,
  { emoji: '👋' }
);

// Create a select menu
const select = ComponentUtils.createStringSelect(
  'my-select',
  'Choose an option',
  [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
  ]
);

// Create an action row
const row = ComponentUtils.createActionRow(button);
```

## Modals

Create and handle modal forms for user input:

```javascript
const { ComponentUtils } = require('spacecommands');
const { TextInputStyle } = require('discord.js');

// Create a modal
const modal = ComponentUtils.createModal(
  'feedback-modal',
  'Submit Feedback',
  ComponentUtils.createTextInputRow(
    'feedback-text',
    'Your Feedback',
    TextInputStyle.Paragraph,
    { placeholder: 'Tell us what you think...' }
  )
);

// Show the modal
await interaction.showModal(modal);

// Register a modal handler
instance.modalHandler.registerModalHandler({
  customId: 'feedback-modal',
  callback: async (interaction, instance) => {
    const feedback = interaction.fields.getTextInputValue('feedback-text');
    await interaction.reply(`Thanks for your feedback: ${feedback}`);
  },
});
```

## Context Menu Commands

Add user and message context menu commands (right-click menus):

```javascript
instance.contextMenuHandler.registerContextMenu({
  name: 'Get User Info',
  type: ApplicationCommandType.User,
  callback: async (interaction, instance) => {
    const user = interaction.targetUser;
    await interaction.reply(`User: ${user.tag}`);
  },
});

instance.contextMenuHandler.registerContextMenu({
  name: 'Quote Message',
  type: ApplicationCommandType.Message,
  callback: async (interaction, instance) => {
    const message = interaction.targetMessage;
    await interaction.reply(`"${message.content}" - ${message.author.tag}`);
  },
});
```

## Autocomplete

Add autocomplete suggestions to slash command options:

```javascript
instance.slashCommands.registerAutocomplete('search', async (interaction) => {
  const focusedValue = interaction.options.getFocused();
  const choices = ['apple', 'banana', 'cherry', 'date'];

  const filtered = choices.filter(choice =>
    choice.startsWith(focusedValue.toLowerCase())
  );

  await interaction.respond(
    filtered.map(choice => ({ name: choice, value: choice }))
  );
});
```

## Premium Features

Monetize your bot with Discord's entitlement system:

### Register SKUs

```javascript
instance.entitlementHandler.registerSKU({
  skuId: '1234567890',
  name: 'Premium Tier',
  description: 'Access to premium features',
});
```

### Premium-Only Commands

```javascript
module.exports = {
  category: 'Premium',
  description: 'Premium-only command',

  // Require specific entitlement
  requiredEntitlements: ['1234567890'],

  // OR require any active entitlement
  premiumOnly: true,

  callback: ({ interaction }) => {
    return 'Welcome, premium user!';
  },
};
```

### Check Entitlements Programmatically

```javascript
const { hasEntitlement } = await instance.entitlementHandler.hasEntitlement(
  user.id,
  'sku-id'
);

if (hasEntitlement) {
  // Grant premium features
}
```

## Interaction Collectors

Easily collect component interactions:

```javascript
const { InteractionCollectorUtils } = require('spacecommands');

// Await a button click
const button = await InteractionCollectorUtils.awaitButton(
  message,
  (i) => i.user.id === interaction.user.id,
  30000 // 30 second timeout
);

if (button) {
  await button.reply('Button clicked!');
}

// Create a select menu collector
const collector = InteractionCollectorUtils.createSelectMenuCollector(
  message,
  (i) => i.user.id === interaction.user.id,
  { time: 60000 }
);

collector.on('collect', async (i) => {
  await i.reply(`Selected: ${i.values.join(', ')}`);
});
```

## Polls

Create and manage Discord's native polls:

```javascript
// Access the poll handler
const pollHandler = instance.pollHandler;

// Get a poll from a message
const poll = message.poll;

if (poll) {
  // Get poll results
  const results = await pollHandler.getPollResults(poll);

  // Get winning answer(s)
  const winners = pollHandler.getWinningAnswers(poll);
  console.log(`Winning answer: ${winners[0].text}`);

  // Get poll statistics
  const stats = pollHandler.getPollStats(poll);
  console.log(`Total votes: ${stats.totalVotes}`);

  // Get formatted results
  const formatted = await pollHandler.getFormattedResults(poll);
  await message.channel.send(formatted);

  // Check if a user voted
  const hasVoted = await pollHandler.hasUserVoted(poll, userId);

  // Get user's votes
  const userVotes = await pollHandler.getUserVotes(poll, userId);

  // End poll early
  await pollHandler.endPoll(poll);
}

// Register handler for when a poll ends
pollHandler.registerPollEndHandler({
  pollId: /poll-.+/, // Regex or specific message ID
  callback: async (poll, instance) => {
    const results = await instance.pollHandler.getFormattedResults(poll);
    await poll.message.channel.send(`Poll ended!\n${results}`);
  },
});

// Fetch a poll from a message ID
const fetchedPoll = await pollHandler.fetchPoll(messageId, channelId);
```

## AutoMod

Manage Discord's AutoMod rules programmatically:

```javascript
const { AutoModerationRuleEventType, AutoModerationActionType } = require('discord.js');

// Access the AutoMod handler
const autoModHandler = instance.autoModHandler;

// Create a keyword filter rule
const keywordRule = await autoModHandler.createKeywordRule(
  guild,
  'No Profanity',
  ['badword1', 'badword2'],
  [
    {
      type: AutoModerationActionType.BlockMessage,
      metadata: { customMessage: 'Please keep chat family-friendly!' }
    },
    {
      type: AutoModerationActionType.Timeout,
      metadata: { durationSeconds: 60 }
    }
  ],
  {
    allowList: ['allowed-phrase'],
    exemptRoles: ['moderator-role-id'],
    exemptChannels: ['staff-channel-id']
  }
);

// Create a spam rule
const spamRule = await autoModHandler.createSpamRule(
  guild,
  'Anti-Spam',
  [{ type: AutoModerationActionType.BlockMessage }]
);

// Create a mention spam rule
const mentionRule = await autoModHandler.createMentionSpamRule(
  guild,
  'Mention Limit',
  5, // Maximum 5 mentions
  [{ type: AutoModerationActionType.BlockMessage }],
  { raidProtection: true }
);

// Create a regex pattern rule
const regexRule = await autoModHandler.createRegexRule(
  guild,
  'Link Blocker',
  ['(https?://)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})'],
  [{ type: AutoModerationActionType.BlockMessage }]
);

// Create a preset keyword rule
const { AutoModerationRuleKeywordPresetType } = require('discord.js');
const presetRule = await autoModHandler.createPresetRule(
  guild,
  'Block Profanity',
  [AutoModerationRuleKeywordPresetType.Profanity],
  [{ type: AutoModerationActionType.BlockMessage }]
);

// Register handler for AutoMod actions
autoModHandler.registerActionHandler({
  ruleId: 'specific-rule-id', // Optional: specific rule or regex
  callback: async (execution, instance) => {
    console.log(`AutoMod triggered by ${execution.userId}`);
    console.log(`Rule: ${execution.ruleId}`);
    console.log(`Action: ${execution.action.type}`);

    // Log to a channel
    const logChannel = execution.guild.channels.cache.get('log-channel-id');
    if (logChannel) {
      await logChannel.send(`AutoMod: User <@${execution.userId}> triggered rule ${execution.ruleTriggerType}`);
    }
  },
});

// Fetch all AutoMod rules for a guild
const rules = await autoModHandler.fetchGuildRules(guild);

// Update an existing rule
await autoModHandler.updateRule(guild, ruleId, {
  enabled: false, // Disable the rule
});

// Delete a rule
await autoModHandler.deleteRule(guild, ruleId);

// Clear cache
autoModHandler.clearGuildCache(guildId);
```

## Documentation

For detailed documentation, examples, and guides, visit our [GitHub repository](https://github.com/VicToMeyeZR/SpaceCommands).

## Support

If you need help or have questions, please open an issue on our [GitHub repository](https://github.com/VicToMeyeZR/SpaceCommands/issues).

## License

MIT License - see LICENSE file for details.
