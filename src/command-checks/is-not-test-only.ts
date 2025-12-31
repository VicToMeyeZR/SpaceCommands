import { Guild } from 'discord.js'
import SpaceCommands from '..'
import Command from '../Command'

export = (guild: Guild | null, command: Command, instance: SpaceCommands) => {
  const { testOnly } = command

  if (!testOnly) {
    return true
  }

  return guild && instance.testServers.includes(guild.id)
}
