"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoConnection = void 0;
// @ts-nocheck
const mongoose_1 = __importDefault(require("mongoose"));
const Events_1 = __importDefault(require("./enums/Events"));
const results = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
};
exports.default = async (mongoPath, instance, dbOptions = {}) => {
    // Mongoose 8 handles connection options automatically
    await mongoose_1.default.connect(mongoPath, dbOptions);
    const { connection } = mongoose_1.default;
    const state = results[connection.readyState] || 'Unknown';
    instance.emit(Events_1.default.DATABASE_CONNECTED, connection, state);
};
const getMongoConnection = () => {
    return mongoose_1.default.connection;
};
exports.getMongoConnection = getMongoConnection;
