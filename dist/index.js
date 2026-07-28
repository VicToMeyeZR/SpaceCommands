"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const FeatureHandler_1 = __importDefault(require("./FeatureHandler"));
const supabase_1 = require("./supabase");
const prefixes_1 = __importDefault(require("./models/prefixes"));
const message_handler_1 = __importDefault(require("./message-handler"));
const SlashCommands_1 = __importDefault(require("./SlashCommands"));
const ComponentHandler_1 = __importDefault(require("./handlers/ComponentHandler"));
const ModalHandler_1 = __importDefault(require("./handlers/ModalHandler"));
const ContextMenuHandler_1 = __importDefault(require("./handlers/ContextMenuHandler"));
const EntitlementHandler_1 = __importDefault(require("./handlers/EntitlementHandler"));
const PollHandler_1 = __importDefault(require("./handlers/PollHandler"));
const AutoModHandler_1 = __importDefault(require("./handlers/AutoModHandler"));
const Events_1 = __importDefault(require("./enums/Events"));
const CommandHandler_1 = __importDefault(require("./CommandHandler"));
class SpaceCommands extends events_1.EventEmitter {
    _client;
    _defaultPrefix = '!';
    _commandsDir = 'commands';
    _featuresDir = '';
    _supabaseClient = null;
    _displayName = '';
    _prefixes = {};
    _categories = new Map(); // <Category Name, Emoji Icon>
    _hiddenCategories = [];
    _color = null;
    _commandHandler = null;
    _featureHandler = null;
    _tagPeople = true;
    _showWarns = true;
    _delErrMsgCooldown = -1;
    _ignoreBots = true;
    _botOwner = [];
    _testServers = [];
    _premiumServers = [];
    _defaultLanguage = 'english';
    _ephemeral = true;
    _debug = false;
    _messageHandler = null;
    _slashCommand = null;
    _componentHandler = null;
    _modalHandler = null;
    _contextMenuHandler = null;
    _entitlementHandler = null;
    _pollHandler = null;
    _autoModHandler = null;
    constructor(client, options) {
        super();
        this._client = client;
        this.setUp(client, options);
    }
    async setUp(client, options) {
        if (!client) {
            throw new Error('No Discord JS Client provided as first argument!');
        }
        let { commandsDir = '', commandDir = '', featuresDir = '', featureDir = '', componentsDir, modalsDir, contextMenusDir, messagesPath, supabaseUrl, supabaseKey, showWarns = true, delErrMsgCooldown = -1, defaultLanguage = 'english', ignoreBots = true, dbOptions, testServers, botOwners, disabledDefaultCommands = [], typeScript = false, ephemeral = true, debug = false, } = options || {};
        this._commandsDir = commandsDir || commandDir || this._commandsDir;
        this._featuresDir = featuresDir || featureDir || this._featuresDir;
        this._ephemeral = ephemeral;
        this._debug = debug;
        if (this._commandsDir &&
            !(this._commandsDir.includes('/') || this._commandsDir.includes('\\'))) {
            throw new Error("SpaceCommands > The 'commands' directory must be an absolute path. This can be done by using the 'path' module.");
        }
        if (this._featuresDir &&
            !(this._featuresDir.includes('/') || this._featuresDir.includes('\\'))) {
            throw new Error("SpaceCommands > The 'features' directory must be an absolute path. This can be done by using the 'path' module.");
        }
        if (testServers) {
            if (typeof testServers === 'string') {
                testServers = [testServers];
            }
            this._testServers = testServers;
        }
        if (botOwners) {
            if (typeof botOwners === 'string') {
                botOwners = [botOwners];
            }
            this._botOwner = botOwners;
        }
        if (options.premiumServers) {
            if (typeof options.premiumServers === 'string') {
                options.premiumServers = [options.premiumServers];
            }
            this._premiumServers = options.premiumServers;
        }
        this._showWarns = showWarns;
        this._delErrMsgCooldown = delErrMsgCooldown;
        this._defaultLanguage = defaultLanguage.toLowerCase();
        this._ignoreBots = ignoreBots;
        if (typeof disabledDefaultCommands === 'string') {
            disabledDefaultCommands = [disabledDefaultCommands];
        }
        this._commandHandler = new CommandHandler_1.default(this, client, this._commandsDir, disabledDefaultCommands, typeScript);
        this._slashCommand = new SlashCommands_1.default(this, true, typeScript);
        this._messageHandler = new message_handler_1.default(this, messagesPath || '');
        this.setCategorySettings([
            {
                name: 'Configuration',
                emoji: '⚙',
            },
            {
                name: 'Help',
                emoji: '❓',
            },
        ]);
        this._featureHandler = new FeatureHandler_1.default(client, this, this._featuresDir, typeScript);
        this._componentHandler = new ComponentHandler_1.default(this, componentsDir, typeScript);
        this._modalHandler = new ModalHandler_1.default(this, modalsDir, typeScript);
        this._contextMenuHandler = new ContextMenuHandler_1.default(this, contextMenusDir, typeScript);
        this._entitlementHandler = new EntitlementHandler_1.default(this);
        this._pollHandler = new PollHandler_1.default(this);
        this._autoModHandler = new AutoModHandler_1.default(this);
        // Support for Supabase (recommended) or MongoDB (deprecated)
        // MOVED TO END TO PREVENT BLOCKING HANDLER INIT
        if (supabaseUrl && supabaseKey) {
            (0, supabase_1.initSupabase)(supabaseUrl, supabaseKey);
            this._supabaseClient = (0, supabase_1.getSupabaseClient)();
            // Load prefixes from Supabase
            try {
                const results = await prefixes_1.default.find({});
                for (const result of results) {
                    const { _id, prefix } = result;
                    this._prefixes[_id] = prefix;
                }
            }
            catch (err) {
                console.warn('SpaceCommands > Failed to load prefixes from Supabase:', err);
            }
        }
        else {
            if (showWarns) {
                console.warn('SpaceCommands > No database connection provided. Some features might not work! Please provide supabaseUrl and supabaseKey.');
            }
            this.emit(Events_1.default.DATABASE_CONNECTED, null, '');
        }
        console.log('SpaceCommands > Your bot is now running.');
    }
    setMongoPath(mongoPath) {
        console.warn('SpaceCommands > .setMongoPath() no longer works as expected. Please pass in your mongo URI as a "mongoUri" property using the options object.');
        return this;
    }
    get client() {
        return this._client;
    }
    get displayName() {
        return this._displayName;
    }
    setDisplayName(displayName) {
        this._displayName = displayName;
        return this;
    }
    get prefixes() {
        return this._prefixes;
    }
    get defaultPrefix() {
        return this._defaultPrefix;
    }
    setDefaultPrefix(defaultPrefix) {
        this._defaultPrefix = defaultPrefix;
        return this;
    }
    getPrefix(guild) {
        return this._prefixes[guild ? guild.id : ''] || this._defaultPrefix;
    }
    setPrefix(guild, prefix) {
        if (guild) {
            this._prefixes[guild.id] = prefix;
        }
        return this;
    }
    get categories() {
        return this._categories;
    }
    get hiddenCategories() {
        return this._hiddenCategories;
    }
    get color() {
        return this._color;
    }
    setColor(color) {
        this._color = color;
        return this;
    }
    getEmoji(category) {
        const emoji = this._categories.get(category) || '';
        if (typeof emoji === 'object') {
            // @ts-ignore
            return `<:${emoji.name}:${emoji.id}>`;
        }
        return emoji;
    }
    getCategory(emoji) {
        let result = '';
        this._categories.forEach((value, key) => {
            // == is intended here
            if (emoji == value) {
                // @ts-ignore
                result = key;
                return false;
            }
        });
        return result;
    }
    setCategorySettings(category) {
        for (let { emoji, name, hidden, customEmoji } of category) {
            if (emoji.startsWith('<:') && emoji.endsWith('>')) {
                customEmoji = true;
                emoji = emoji.split(':')[2];
                emoji = emoji.substring(0, emoji.length - 1);
            }
            let targetEmoji = emoji;
            if (customEmoji) {
                targetEmoji = this._client.emojis.cache.get(emoji);
            }
            if (this.isEmojiUsed(targetEmoji)) {
                console.warn(`SpaceCommands > The emoji "${targetEmoji}" for category "${name}" is already used.`);
            }
            this._categories.set(name, targetEmoji || this.categories.get(name) || '');
            if (hidden) {
                this._hiddenCategories.push(name);
            }
        }
        return this;
    }
    isEmojiUsed(emoji) {
        if (!emoji) {
            return false;
        }
        let isUsed = false;
        this._categories.forEach((value) => {
            if (value === emoji) {
                isUsed = true;
            }
        });
        return isUsed;
    }
    get commandHandler() {
        return this._commandHandler;
    }
    get supabaseClient() {
        return this._supabaseClient;
    }
    get mongoConnection() {
        // Deprecated: For backwards compatibility only
        return this._supabaseClient;
    }
    isDBConnected() {
        return !!this._supabaseClient;
    }
    setTagPeople(tagPeople) {
        this._tagPeople = tagPeople;
        return this;
    }
    get tagPeople() {
        return this._tagPeople;
    }
    get showWarns() {
        return this._showWarns;
    }
    get delErrMsgCooldown() {
        return this._delErrMsgCooldown;
    }
    get ignoreBots() {
        return this._ignoreBots;
    }
    get botOwner() {
        return this._botOwner;
    }
    setBotOwner(botOwner) {
        console.log('SpaceCommands > setBotOwner() is deprecated. Please specify your bot owners in the object constructor instead.');
        if (typeof botOwner === 'string') {
            botOwner = [botOwner];
        }
        this._botOwner = botOwner;
        return this;
    }
    get testServers() {
        return this._testServers;
    }
    get premiumServers() {
        return this._premiumServers;
    }
    get defaultLanguage() {
        return this._defaultLanguage;
    }
    setDefaultLanguage(defaultLanguage) {
        this._defaultLanguage = defaultLanguage;
        return this;
    }
    get ephemeral() {
        return this._ephemeral;
    }
    get debug() {
        return this._debug;
    }
    get messageHandler() {
        return this._messageHandler;
    }
    get slashCommands() {
        return this._slashCommand;
    }
    get componentHandler() {
        return this._componentHandler;
    }
    get modalHandler() {
        return this._modalHandler;
    }
    get contextMenuHandler() {
        return this._contextMenuHandler;
    }
    get entitlementHandler() {
        return this._entitlementHandler;
    }
    get pollHandler() {
        return this._pollHandler;
    }
    get autoModHandler() {
        return this._autoModHandler;
    }
}
exports.default = SpaceCommands;
module.exports = SpaceCommands;
