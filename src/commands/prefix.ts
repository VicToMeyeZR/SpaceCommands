// @ts-nocheck
import { ICallbackObject, ICommand } from '../..'
import prefixes from '../models/prefixes'

export = {
  description: 'Displays or sets the prefix for the current guild',
  category: 'Configuration',

  permissions: ['Administrator'],

  maxArgs: 1,
  expectedArgs: '[prefix]',

  cooldown: '2s',
  guildOnly: true,
  slash: 'both',
  options: [
    {
      name: 'prefix',
      description: 'The new prefix',
      // ApplicationCommandOptionType.String = 3
      type: 3,
      required: false,
    },
  ],

  callback: async (options: ICallbackObject) => {
    const { channel, args, text, instance } = options
    const { guild } = channel

    if (args.length === 0) {
      return instance.messageHandler.get(guild, 'CURRENT_PREFIX', {
        PREFIX: instance.getPrefix(guild),
      })
    }

    if (guild) {
      const { id } = guild

      if (!instance.isDBConnected()) {
        return instance.messageHandler.get(guild, 'NO_DATABASE_FOUND')
      }

      await prefixes.findOneAndUpdate(
        {
          _id: id,
        },
        {
          _id: id,
          prefix: text,
        },
        {
          upsert: true,
        }
      )

      instance.setPrefix(guild, text)

      return instance.messageHandler.get(guild, 'SET_PREFIX', {
        PREFIX: text,
      })
    }

    return instance.messageHandler.get(guild, 'CANNOT_SET_PREFIX_IN_DMS')
  },
} as ICommand
