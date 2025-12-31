"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Handler for Discord premium features and entitlements
 * Supports Discord's monetization system with SKUs and subscriptions
 */
class EntitlementHandler {
    _client;
    _instance;
    _skus = new Map();
    _entitlementCache = new Map();
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
    async hasEntitlement(userId, skuId) {
        const entitlements = await this.getUserEntitlements(userId);
        const entitlement = entitlements.find((e) => e.skuId === skuId);
        return {
            hasEntitlement: !!entitlement,
            entitlement,
        };
    }
    /**
     * Check if a user has any of the specified entitlements
     */
    async hasAnyEntitlement(userId, skuIds) {
        const entitlements = await this.getUserEntitlements(userId);
        const entitlement = entitlements.find((e) => skuIds.includes(e.skuId));
        return {
            hasEntitlement: !!entitlement,
            entitlement,
        };
    }
    /**
     * Check if a user has all of the specified entitlements
     */
    async hasAllEntitlements(userId, skuIds) {
        const entitlements = await this.getUserEntitlements(userId);
        const entitlementSkus = entitlements.map((e) => e.skuId);
        return skuIds.every((skuId) => entitlementSkus.includes(skuId));
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
        return this.hasEntitlement(userId, skuId);
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
