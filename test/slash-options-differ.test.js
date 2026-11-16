// Run with `npm test` (builds first; the tests exercise the compiled output).
const test = require('node:test')
const assert = require('node:assert/strict')
const {
  ApplicationCommand,
  ApplicationCommandOptionType: T,
  ChannelType,
  SlashCommandBuilder,
} = require('discord.js')
const {
  default: slashOptionsDiffer,
  normalizeOptions,
} = require('../dist/utils/slash-options-differ')

/**
 * What discord.js hands back for a registered command: the API JSON (which is
 * what a builder's toJSON() produces, minus undefined fields) run through
 * ApplicationCommand.transformOption, giving camelCase keys.
 */
const asRegistered = (declared) =>
  JSON.parse(JSON.stringify(declared)).map((option) =>
    ApplicationCommand.transformOption(option, true)
  )

// Shaped like the command that exposed the bug: subcommands with their own options.
const configApps = (createFirstOption = 'type') =>
  new SlashCommandBuilder()
    .setName('config-apps')
    .setDescription('Configure application types')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new application type')
        .addStringOption((o) => o.setName(createFirstOption).setDescription('Name of the application type').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Brief description').setRequired(false))
        .addRoleOption((o) => o.setName('role').setDescription('Role to grant'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Edit an application type')
        .addStringOption((o) => o.setName('type').setDescription('Type to edit').setRequired(true).setAutocomplete(true))
        .addIntegerOption((o) => o.setName('limit').setDescription('Limit').setMinValue(1).setMaxValue(50))
        .addChannelOption((o) => o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
        .addStringOption((o) => o.setName('mode').setDescription('Mode').addChoices({ name: 'Open', value: 'open' }, { name: 'Closed', value: 'closed' }))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List application types'))
    .toJSON().options

test('an unchanged command is not reported as changed', () => {
  const declared = configApps()
  assert.equal(slashOptionsDiffer(asRegistered(declared), declared), false)
})

test('renaming an option inside a subcommand is detected (the original bug)', () => {
  const registered = asRegistered(configApps('name')) // what Discord still had
  const declared = configApps('type') // what the code declared after the rename
  assert.equal(slashOptionsDiffer(registered, declared), true)

  // The old check compared only top-level name/required and the child COUNT,
  // all of which are identical here — which is why the rename never registered.
  assert.deepEqual(registered.map((o) => [o.name, o.options?.length]), declared.map((o) => [o.name, o.options?.length]))
})

test('other changes inside a subcommand are detected', () => {
  const registered = asRegistered(configApps())
  const edit = (mutate) => {
    const declared = JSON.parse(JSON.stringify(configApps()))
    mutate(declared)
    return slashOptionsDiffer(registered, declared)
  }
  assert.equal(edit((d) => { d[0].options[0].description = 'Something else' }), true, 'description')
  assert.equal(edit((d) => { d[0].options[1].required = true }), true, 'required')
  assert.equal(edit((d) => { d[0].options[2].type = T.User }), true, 'type')
  assert.equal(edit((d) => { d[1].options[0].autocomplete = false }), true, 'autocomplete')
  assert.equal(edit((d) => { d[1].options[1].max_value = 100 }), true, 'max value')
  assert.equal(edit((d) => { d[1].options[2].channel_types = [ChannelType.GuildText] }), true, 'channel types')
  assert.equal(edit((d) => { d[1].options[3].choices[1].value = 'shut' }), true, 'choice value')
  assert.equal(edit((d) => { d[1].options[3].choices.push({ name: 'Paused', value: 'paused' }) }), true, 'added choice')
  assert.equal(edit((d) => { d[0].options.reverse() }), true, 'option order')
  assert.equal(edit((d) => { d[0].options.pop() }), true, 'removed option')
  assert.equal(edit((d) => { d[2].description = 'Show every type' }), true, 'subcommand description')
  assert.equal(edit((d) => { d.reverse() }), true, 'subcommand order')
})

test('changes two levels down (subcommand group) are detected', () => {
  const build = (leaf) =>
    new SlashCommandBuilder()
      .setName('admin')
      .setDescription('Admin')
      .addSubcommandGroup((group) =>
        group
          .setName('roles')
          .setDescription('Roles')
          .addSubcommand((sub) =>
            sub.setName('grant').setDescription('Grant').addUserOption((o) => o.setName(leaf).setDescription('Who').setRequired(true))
          )
      )
      .toJSON().options
  assert.equal(slashOptionsDiffer(asRegistered(build('member')), build('member')), false)
  assert.equal(slashOptionsDiffer(asRegistered(build('user')), build('member')), true)
})

test('representation differences alone are not a change', () => {
  const registered = [
    {
      type: T.Integer, name: 'amount', description: 'How many', required: false, autocomplete: undefined,
      nameLocalizations: undefined, descriptionLocalizations: null, minValue: 1, maxValue: 9,
      choices: undefined, options: undefined, channelTypes: undefined,
    },
    {
      type: T.Channel, name: 'where', description: 'Where', required: true,
      channelTypes: [ChannelType.GuildAnnouncement, ChannelType.GuildText],
    },
    { type: T.String, name: 'note', description: 'Note', required: false, minLength: 2, maxLength: 20 },
  ]
  const declared = [
    // snake_case limits, `required` omitted, explicit false autocomplete, legacy string type
    { type: 'INTEGER', name: 'amount', description: ' How many ', autocomplete: false, min_value: 1, max_value: 9, name_localizations: {} },
    // channel types in a different order
    { type: T.Channel, name: 'where', description: 'Where', required: true, channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] },
    { type: 'string', name: 'note', description: 'Note', required: false, min_length: 2, max_length: 20, choices: [], options: [] },
  ]
  assert.equal(slashOptionsDiffer(registered, declared), false)
})

test('localizations are compared, ignoring key order', () => {
  const base = { type: T.String, name: 'q', description: 'Query' }
  const a = [{ ...base, nameLocalizations: { de: 'frage', fr: 'question' } }]
  const b = [{ ...base, name_localizations: { fr: 'question', de: 'frage' } }]
  const c = [{ ...base, name_localizations: { fr: 'demande', de: 'frage' } }]
  assert.equal(slashOptionsDiffer(a, b), false)
  assert.equal(slashOptionsDiffer(a, c), true)
})

test('missing or empty option lists', () => {
  assert.equal(slashOptionsDiffer(undefined, []), false)
  assert.equal(slashOptionsDiffer([], undefined), false)
  assert.equal(slashOptionsDiffer([], [{ type: T.String, name: 'q', description: 'Query' }]), true)
  assert.deepEqual(normalizeOptions(null), [])
})
