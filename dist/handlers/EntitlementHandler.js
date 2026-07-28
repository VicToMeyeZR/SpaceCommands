"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const premium_overrides_1 = __importDefault(require("../models/premium-overrides"));
/**
 * Handler for Discord premium features and entitlements
 * Supports Discord's monetization system with SKUs and subscriptions
 */
class EntitlementHandler {
    _client;
    _instance;
    _skus = new Map();
    _hierarchy = new Map(); // childSku -> parentSkus
    _entitlementCache = new Map();
    _overrideCache = new Map(); // guildId -> skuIds
    _cacheTimeout = 5 * 60 * 1000; // 5 minutes
    constructor(instance) {
        this._instance = instance;
        this._client = instance.client;
        this.setUp();
    }
    setUp() {
        // Listen for new entitlements
        this._client.on('entitlementCreate', (entitlement) => {
            this.clearUserCache(entitlement.userId);
            if (this._instance.debug) {
                console.log(`SpaceCommands > Entitlement created: ${entitlement.id} for user ${entitlement.userId}`);
            }
        });
        // Listen for entitlement updates
        this._client.on('entitlementUpdate', (oldEntitlement, newEntitlement) => {
            this.clearUserCache(newEntitlement.userId);
            if (this._instance.debug) {
                console.log(`SpaceCommands > Entitlement updated: ${newEntitlement.id} for user ${newEntitlement.userId}`);
            }
        });
        // Listen for entitlement deletions
        this._client.on('entitlementDelete', (entitlement) => {
            this.clearUserCache(entitlement.userId);
            if (this._instance.debug) {
                console.log(`SpaceCommands > Entitlement deleted: ${entitlement.id} for user ${entitlement.userId}`);
            }
        });
    }
    /**
     * Register a SKU hierarchy
     * @param childSku The SKU that is included in the parent SKUs
     * @param parentSkus The SKUs that include the child SKU
     */
    registerHierarchy(childSku, parentSkus) {
        const existing = this._hierarchy.get(childSku) || [];
        this._hierarchy.set(childSku, [...new Set([...existing, ...parentSkus])]);
        if (this._instance.debug) {
            console.log(`SpaceCommands > Registered hierarchy: ${parentSkus.join(', ')} includes ${childSku}`);
        }
        return this;
    }
    /**
     * Get all SKUs that satisfy the required SKU (including itself and its parents)
     */
    getSatisfyingSkus(skuId) {
        const parents = this._hierarchy.get(skuId) || [];
        return [skuId, ...parents];
    }
    /**
     * Register a SKU for premium features
     */
    registerSKU(config) {
        this._skus.set(config.skuId, config);
        if (this._instance.debug) {
            console.log(`SpaceCommands > Registered SKU: ${config.skuId} (${config.name || 'Unnamed'})`);
        }
        return this;
    }
    /**
     * Register multiple SKUs at once
     */
    registerSKUs(configs) {
        for (const config of configs) {
            this.registerSKU(config);
        }
        return this;
    }
    /**
     * Check if a user has a specific entitlement
     */
    async hasEntitlement(userId, skuId, guildId) {
        const validSkuIds = this.getSatisfyingSkus(skuId);
        // First, check for guild overrides if guildId is provided
        if (guildId) {
            for (const validSku of validSkuIds) {
                if (await this.hasGuildOverride(guildId, validSku)) {
                    return {
                        hasEntitlement: true,
                        isOverride: true,
                    };
                }
            }
        }
        const entitlements = await this.getUserEntitlements(userId);
        const entitlement = entitlements.find((e) => validSkuIds.includes(e.skuId));
        return {
            hasEntitlement: !!entitlement,
            entitlement,
        };
    }
    /**
     * Check if a user has any of the specified entitlements
     */
    async hasAnyEntitlement(userId, skuIds, guildId) {
        // Expand checks to include hierarchy
        const allValidSkuIds = new Set();
        for (const skuId of skuIds) {
            this.getSatisfyingSkus(skuId).forEach((id) => allValidSkuIds.add(id));
        }
        const validSkuList = Array.from(allValidSkuIds);
        // First, check for guild overrides if guildId is provided
        if (guildId) {
            for (const skuId of validSkuList) {
                if (await this.hasGuildOverride(guildId, skuId)) {
                    return {
                        hasEntitlement: true,
                        isOverride: true,
                    };
                }
            }
        }
        const entitlements = await this.getUserEntitlements(userId);
        const entitlement = entitlements.find((e) => validSkuList.includes(e.skuId));
        return {
            hasEntitlement: !!entitlement,
            entitlement,
        };
    }
    /**
     * Check if a guild has any of the specified entitlements
     */
    async hasAnyGuildEntitlement(guildId, skuIds) {
        const entitlements = await this.getGuildEntitlements(guildId);
        const entitlement = entitlements.find((e) => skuIds.includes(e.skuId));
        return {
            hasEntitlement: !!entitlement,
            entitlement,
        };
    }
    /**
     * Check if a user has all of the specified entitlements
     */
    async hasAllEntitlements(userId, skuIds, guildId) {
        // Optimisation: Get user entitlements once
        const userEntitlements = await this.getUserEntitlements(userId);
        const userSkuIds = userEntitlements.map((e) => e.skuId);
        for (const skuId of skuIds) {
            const validSkuIds = this.getSatisfyingSkus(skuId);
            // Check if user has ANY of the satisfying SKUs for this requirement
            let hasRequirement = userSkuIds.some((id) => validSkuIds.includes(id));
            if (!hasRequirement && guildId) {
                // Check overrides for ANY satisfying SKU
                for (const validSku of validSkuIds) {
                    if (await this.hasGuildOverride(guildId, validSku)) {
                        hasRequirement = true;
                        break;
                    }
                }
            }
            if (!hasRequirement) {
                return false;
            }
        }
        return true;
    }
    /**
     * Check if a guild has an override for a specific SKU
     */
    async hasGuildOverride(guildId, skuId, useCache = true) {
        if (!this._instance.isDBConnected()) {
            return false;
        }
        if (useCache && this._overrideCache.has(guildId)) {
            const overrides = this._overrideCache.get(guildId);
            return overrides.includes(skuId);
        }
        try {
            const result = await premium_overrides_1.default.findOne(guildId);
            const skuIds = result?.skuId ? [result.skuId] : [];
            this._overrideCache.set(guildId, skuIds);
            // Clear cache after timeout
            setTimeout(() => {
                this._overrideCache.delete(guildId);
            }, this._cacheTimeout);
            return skuIds.includes(skuId);
        }
        catch (error) {
            console.error(`SpaceCommands > Error checking guild override for ${guildId}:`, error);
            return false;
        }
    }
    /**
     * Get all active entitlements for a user
     */
    async getUserEntitlements(userId, useCache = true) {
        // Check cache first
        if (useCache && this._entitlementCache.has(userId)) {
            return this._entitlementCache.get(userId);
        }
        try {
            const entitlements = await this._client.application?.entitlements.fetch({
                user: userId,
            });
            if (!entitlements) {
                return [];
            }
            const activeEntitlements = entitlements.filter((e) => !e.deleted && e.endsAt && e.endsAt.getTime() > Date.now());
            // Cache the results
            this._entitlementCache.set(userId, Array.from(activeEntitlements.values()));
            // Clear cache after timeout
            setTimeout(() => {
                this._entitlementCache.delete(userId);
            }, this._cacheTimeout);
            return Array.from(activeEntitlements.values());
        }
        catch (error) {
            console.error(`SpaceCommands > Error fetching entitlements for user ${userId}:`, error);
            return [];
        }
    }
    /**
     * Get all registered SKUs
     */
    getSKUs() {
        return this._skus;
    }
    /**
     * Get a specific SKU configuration
     */
    getSKU(skuId) {
        return this._skus.get(skuId);
    }
    /**
     * Get all active overrides for a guild
     */
    async getGuildOverrides(guildId, useCache = true) {
        if (!this._instance.isDBConnected()) {
            return [];
        }
        if (useCache && this._overrideCache.has(guildId)) {
            return this._overrideCache.get(guildId);
        }
        try {
            const result = await premium_overrides_1.default.findOne(guildId);
            const overrideSku = result?.skuId;
            const overrides = overrideSku ? [overrideSku] : [];
            this._overrideCache.set(guildId, overrides);
            // Clear cache after timeout
            setTimeout(() => {
                this._overrideCache.delete(guildId);
            }, this._cacheTimeout);
            return overrides;
        }
        catch (error) {
            console.error(`SpaceCommands > Error fetching guild overrides for ${guildId}:`, error);
            return [];
        }
    }
    /**
     * Clear the entitlement cache for a specific user
     */
    clearUserCache(userId) {
        if (userId) {
            this._entitlementCache.delete(userId);
        }
        else {
            this._entitlementCache.clear();
        }
    }
    /**
     * Clear the override cache for a specific guild
     */
    clearOverrideCache(guildId) {
        if (guildId) {
            this._overrideCache.delete(guildId);
        }
        else {
            this._overrideCache.clear();
        }
    }
    /**
     * Set the cache timeout duration (in milliseconds)
     */
    setCacheTimeout(timeout) {
        this._cacheTimeout = timeout;
        return this;
    }
    /**
     * Check if a user/member has entitlement (works with User or GuildMember)
     */
    async checkAccess(userOrMember, skuId) {
        const userId = userOrMember.id;
        const guildId = userOrMember instanceof discord_js_1.GuildMember ? userOrMember.guild.id : undefined;
        return this.hasEntitlement(userId, skuId, guildId);
    }
    /**
     * Consume a one-time purchase entitlement
     * This marks the entitlement as consumed (for one-time purchases)
     */
    async consumeEntitlement(entitlementId) {
        try {
            await this._client.application?.entitlements.consume(entitlementId);
            if (this._instance.debug) {
                console.log(`SpaceCommands > Consumed entitlement: ${entitlementId}`);
            }
            return true;
        }
        catch (error) {
            console.error(`SpaceCommands > Error consuming entitlement ${entitlementId}:`, error);
            return false;
        }
    }
    /**
     * Get all entitlements for a guild
     */
    async getGuildEntitlements(guildId, useCache = false) {
        try {
            const entitlements = await this._client.application?.entitlements.fetch({
                guild: guildId,
            });
            if (!entitlements) {
                return [];
            }
            const activeEntitlements = entitlements.filter((e) => !e.deleted && e.endsAt && e.endsAt.getTime() > Date.now());
            return Array.from(activeEntitlements.values());
        }
        catch (error) {
            console.error(`SpaceCommands > Error fetching entitlements for guild ${guildId}:`, error);
            return [];
        }
    }
}
exports.default = EntitlementHandler;
