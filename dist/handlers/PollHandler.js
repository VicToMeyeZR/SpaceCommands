"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Handler for Discord Polls
 * Supports creating, managing, and listening to poll events
 */
class PollHandler {
    _client;
    _instance;
    _voteHandlers = new Map();
    _endHandlers = [];
    constructor(instance) {
        this._instance = instance;
        this._client = instance.client;
        this.setUp();
    }
    setUp() {
        // Note: Discord.js doesn't have built-in poll events yet
        // Polls are accessed through messages
        // This handler provides utilities for working with polls
    }
    /**
     * Create a poll in a message
     * Returns the message containing the poll
     */
    async createPoll(message, config) {
        try {
            if (config.answers.length < 1 || config.answers.length > 10) {
                throw new Error('Polls must have between 1 and 10 answers');
            }
            const duration = config.duration
                ? Math.min(Math.max(config.duration, 1), 168)
                : 24;
            // Poll creation is done through the message content
            // This is a utility method to help construct poll data
            const pollData = {
                question: { text: config.question },
                answers: config.answers.map((answer, index) => ({
                    poll_media: {
                        text: answer.text,
                        emoji: answer.emoji,
                    },
                    answer_id: index,
                })),
                duration,
                allow_multiselect: config.allowMultiselect || false,
                layout_type: config.layoutType || 1,
            };
            // Fetch the message to get the poll if it was created
            const fetchedMessage = await message.channel.messages.fetch(message.id);
            return fetchedMessage.poll || null;
        }
        catch (error) {
            console.error('SpaceCommands > Error creating poll:', error);
            return null;
        }
    }
    /**
     * Get poll results
     */
    async getPollResults(poll) {
        const results = new Map();
        try {
            for (const answer of poll.answers.values()) {
                const voters = await answer.fetchVoters();
                results.set(answer.id, voters);
            }
        }
        catch (error) {
            console.error('SpaceCommands > Error fetching poll results:', error);
        }
        return results;
    }
    /**
     * Get the winning answer(s) of a poll
     */
    getWinningAnswers(poll) {
        const answers = Array.from(poll.answers.values());
        if (answers.length === 0)
            return [];
        const maxVotes = Math.max(...answers.map((a) => a.voteCount));
        return answers.filter((a) => a.voteCount === maxVotes);
    }
    /**
     * End a poll early
     */
    async endPoll(poll) {
        try {
            await poll.end();
            if (this._instance.debug) {
                console.log(`SpaceCommands > Ended poll: ${poll.message.id}`);
            }
            // Trigger end handlers
            await this.triggerEndHandlers(poll);
            return true;
        }
        catch (error) {
            console.error('SpaceCommands > Error ending poll:', error);
            return false;
        }
    }
    /**
     * Register a handler for when a poll ends
     */
    registerPollEndHandler(handler) {
        this._endHandlers.push(handler);
        if (this._instance.debug) {
            console.log(`SpaceCommands > Registered poll end handler for: ${handler.pollId}`);
        }
        return this;
    }
    /**
     * Trigger all matching end handlers for a poll
     */
    async triggerEndHandlers(poll) {
        const pollId = poll.message.id;
        for (const handler of this._endHandlers) {
            let matches = false;
            if (typeof handler.pollId === 'string') {
                matches = handler.pollId === pollId;
            }
            else {
                matches = handler.pollId.test(pollId);
            }
            if (matches) {
                try {
                    await handler.callback(poll, this._instance);
                }
                catch (error) {
                    console.error('SpaceCommands > Error executing poll end handler:', error);
                }
            }
        }
    }
    /**
     * Check if a user has voted on a poll
     */
    async hasUserVoted(poll, userId) {
        try {
            for (const answer of poll.answers.values()) {
                const voters = await answer.fetchVoters();
                if (voters.has(userId)) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('SpaceCommands > Error checking poll vote:', error);
            return false;
        }
    }
    /**
     * Get user's votes on a poll
     */
    async getUserVotes(poll, userId) {
        const userVotes = [];
        try {
            for (const answer of poll.answers.values()) {
                const voters = await answer.fetchVoters();
                if (voters.has(userId)) {
                    userVotes.push(answer);
                }
            }
        }
        catch (error) {
            console.error('SpaceCommands > Error getting user votes:', error);
        }
        return userVotes;
    }
    /**
     * Get poll statistics
     */
    getPollStats(poll) {
        const answers = Array.from(poll.answers.values());
        const totalVotes = answers.reduce((sum, answer) => sum + answer.voteCount, 0);
        return {
            totalVotes,
            answerCount: answers.length,
            allowsMultiselect: poll.allowMultiselect,
            expiresAt: poll.expiresAt,
            isExpired: poll.expiresAt ? poll.expiresAt.getTime() < Date.now() : false,
        };
    }
    /**
     * Get a formatted summary of poll results
     */
    async getFormattedResults(poll) {
        const results = await this.getPollResults(poll);
        const stats = this.getPollStats(poll);
        let output = `**${poll.question.text}**\n\n`;
        for (const answer of poll.answers.values()) {
            const voters = results.get(answer.id);
            const percentage = stats.totalVotes > 0
                ? ((answer.voteCount / stats.totalVotes) * 100).toFixed(1)
                : '0.0';
            const answerText = 'text' in answer ? answer.text : answer.id.toString();
            output += `${answerText}: ${answer.voteCount} votes (${percentage}%)\n`;
        }
        output += `\nTotal Votes: ${stats.totalVotes}`;
        return output;
    }
    /**
     * Fetch a poll from a message
     */
    async fetchPoll(message, channelId) {
        try {
            let msg;
            if (typeof message === 'string') {
                if (!channelId) {
                    throw new Error('Channel ID required when fetching by message ID');
                }
                const channel = await this._client.channels.fetch(channelId);
                if (!channel || !channel.isTextBased()) {
                    throw new Error('Invalid channel');
                }
                msg = await channel.messages.fetch(message);
            }
            else {
                msg = message;
            }
            return msg.poll || null;
        }
        catch (error) {
            console.error('SpaceCommands > Error fetching poll:', error);
            return null;
        }
    }
}
exports.default = PollHandler;
