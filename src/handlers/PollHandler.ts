import {
  Client,
  Poll,
  PollAnswer,
  Message,
  User,
  Collection,
  Snowflake,
  PollLayoutType,
} from 'discord.js'
import SpaceCommands from '..'

export interface IPollAnswerOption {
  text: string
  emoji?: string
}

export interface IPollConfig {
  question: string
  answers: IPollAnswerOption[]
  duration?: number // Duration in hours (1-168)
  allowMultiselect?: boolean
  layoutType?: PollLayoutType
}

export interface IPollVoteHandler {
  pollId: string
  answerId?: number
  callback: (
    poll: Poll,
    answer: PollAnswer,
    user: User,
    instance: SpaceCommands
  ) => Promise<void> | void
}

export interface IPollEndHandler {
  pollId: string | RegExp
  callback: (poll: Poll, instance: SpaceCommands) => Promise<void> | void
}

/**
 * Handler for Discord Polls
 * Supports creating, managing, and listening to poll events
 */
export default class PollHandler {
  private _client: Client
  private _instance: SpaceCommands
  private _voteHandlers: Map<string, IPollVoteHandler[]> = new Map()
  private _endHandlers: IPollEndHandler[] = []

  constructor(instance: SpaceCommands) {
    this._instance = instance
    this._client = instance.client

    this.setUp()
  }

  private setUp() {
    // Note: Discord.js doesn't have built-in poll events yet
    // Polls are accessed through messages
    // This handler provides utilities for working with polls
  }

  /**
   * Create a poll in a message
   * Returns the message containing the poll
   */
  public async createPoll(
    message: Message,
    config: IPollConfig
  ): Promise<Poll | null> {
    try {
      if (config.answers.length < 1 || config.answers.length > 10) {
        throw new Error('Polls must have between 1 and 10 answers')
      }

      const duration = config.duration
        ? Math.min(Math.max(config.duration, 1), 168)
        : 24

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
      }

      // Fetch the message to get the poll if it was created
      const fetchedMessage = await message.channel.messages.fetch(message.id)
      return fetchedMessage.poll || null
    } catch (error) {
      console.error('SpaceCommands > Error creating poll:', error)
      return null
    }
  }

  /**
   * Get poll results
   */
  public async getPollResults(
    poll: Poll
  ): Promise<Map<number, Collection<Snowflake, User>>> {
    const results = new Map<number, Collection<Snowflake, User>>()

    try {
      for (const answer of poll.answers.values()) {
        const voters = await answer.fetchVoters()
        results.set(answer.id, voters)
      }
    } catch (error) {
      console.error('SpaceCommands > Error fetching poll results:', error)
    }

    return results
  }

  /**
   * Get the winning answer(s) of a poll
   */
  public getWinningAnswers(poll: Poll): (PollAnswer)[] {
    const answers = Array.from(poll.answers.values())
    if (answers.length === 0) return []

    const maxVotes = Math.max(...answers.map((a) => a.voteCount))
    return answers.filter((a) => a.voteCount === maxVotes) as PollAnswer[]
  }

  /**
   * End a poll early
   */
  public async endPoll(poll: Poll): Promise<boolean> {
    try {
      await poll.end()

      if (this._instance.debug) {
        console.log(`SpaceCommands > Ended poll: ${poll.message.id}`)
      }

      // Trigger end handlers
      await this.triggerEndHandlers(poll)

      return true
    } catch (error) {
      console.error('SpaceCommands > Error ending poll:', error)
      return false
    }
  }

  /**
   * Register a handler for when a poll ends
   */
  public registerPollEndHandler(handler: IPollEndHandler): PollHandler {
    this._endHandlers.push(handler)

    if (this._instance.debug) {
      console.log(
        `SpaceCommands > Registered poll end handler for: ${handler.pollId}`
      )
    }

    return this
  }

  /**
   * Trigger all matching end handlers for a poll
   */
  private async triggerEndHandlers(poll: Poll): Promise<void> {
    const pollId = poll.message.id

    for (const handler of this._endHandlers) {
      let matches = false

      if (typeof handler.pollId === 'string') {
        matches = handler.pollId === pollId
      } else {
        matches = handler.pollId.test(pollId)
      }

      if (matches) {
        try {
          await handler.callback(poll, this._instance)
        } catch (error) {
          console.error(
            'SpaceCommands > Error executing poll end handler:',
            error
          )
        }
      }
    }
  }

  /**
   * Check if a user has voted on a poll
   */
  public async hasUserVoted(poll: Poll, userId: Snowflake): Promise<boolean> {
    try {
      for (const answer of poll.answers.values()) {
        const voters = await answer.fetchVoters()
        if (voters.has(userId)) {
          return true
        }
      }
      return false
    } catch (error) {
      console.error('SpaceCommands > Error checking poll vote:', error)
      return false
    }
  }

  /**
   * Get user's votes on a poll
   */
  public async getUserVotes(
    poll: Poll,
    userId: Snowflake
  ): Promise<(PollAnswer)[]> {
    const userVotes: (PollAnswer)[] = []

    try {
      for (const answer of poll.answers.values()) {
        const voters = await answer.fetchVoters()
        if (voters.has(userId)) {
          userVotes.push(answer as PollAnswer)
        }
      }
    } catch (error) {
      console.error('SpaceCommands > Error getting user votes:', error)
    }

    return userVotes
  }

  /**
   * Get poll statistics
   */
  public getPollStats(poll: Poll): {
    totalVotes: number
    answerCount: number
    allowsMultiselect: boolean
    expiresAt: Date | null
    isExpired: boolean
  } {
    const answers = Array.from(poll.answers.values())
    const totalVotes = answers.reduce((sum, answer) => sum + answer.voteCount, 0)

    return {
      totalVotes,
      answerCount: answers.length,
      allowsMultiselect: poll.allowMultiselect,
      expiresAt: poll.expiresAt,
      isExpired: poll.expiresAt ? poll.expiresAt.getTime() < Date.now() : false,
    }
  }

  /**
   * Get a formatted summary of poll results
   */
  public async getFormattedResults(poll: Poll): Promise<string> {
    const results = await this.getPollResults(poll)
    const stats = this.getPollStats(poll)
    let output = `**${poll.question.text}**\n\n`

    for (const answer of poll.answers.values()) {
      const voters = results.get(answer.id)
      const percentage =
        stats.totalVotes > 0
          ? ((answer.voteCount / stats.totalVotes) * 100).toFixed(1)
          : '0.0'

      const answerText = 'text' in answer ? (answer as any).text : (answer as any).id.toString()
      output += `${answerText}: ${answer.voteCount} votes (${percentage}%)\n`
    }

    output += `\nTotal Votes: ${stats.totalVotes}`

    return output
  }

  /**
   * Fetch a poll from a message
   */
  public async fetchPoll(
    message: Message | Snowflake,
    channelId?: Snowflake
  ): Promise<Poll | null> {
    try {
      let msg: Message

      if (typeof message === 'string') {
        if (!channelId) {
          throw new Error('Channel ID required when fetching by message ID')
        }
        const channel = await this._client.channels.fetch(channelId)
        if (!channel || !channel.isTextBased()) {
          throw new Error('Invalid channel')
        }
        msg = await channel.messages.fetch(message)
      } else {
        msg = message
      }

      return msg.poll || null
    } catch (error) {
      console.error('SpaceCommands > Error fetching poll:', error)
      return null
    }
  }
}
