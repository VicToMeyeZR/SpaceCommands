// @ts-check
import { ICallbackObject, ICommand } from '../..'

export = {
    description: 'Deletes a slash command by name from Discord (Development Tool)',
    category: 'Development',

    minArgs: 1,
    expectedArgs: '<command_name> [guild_id]',

    ownerOnly: true,
    testOnly: true, // Visible immediately
    slash: 'both',

    options: [
        {
            name: 'command_name',
            description: 'The name of the command to delete (case insensitive)',
            type: 3, // STRING
            required: true,
        },
        {
            name: 'scope',
            description: 'Where to delete from',
            type: 3, // STRING
            required: false,
            choices: [
                { name: 'Global', value: 'global' },
                { name: 'Current Server', value: 'guild' },
                { name: 'All Servers (Dangerous)', value: 'all' }
            ]
        }
    ],

    callback: async (options: ICallbackObject) => {
        const { instance, args, interaction, guild, client } = options
        const commandName = args[0].toLowerCase()
        const scope = args[1] || 'global'

        let deletedCount = 0
        let status = []

        // Helper to delete from a command manager
        const deleteFromManager = async (manager: any, sourceName: string) => {
            try {
                const commands = await manager.fetch()
                const cmd = commands.find((c: any) => c.name.toLowerCase() === commandName)

                if (cmd) {
                    await manager.delete(cmd.id)
                    status.push(`✅ Deleted **${cmd.name}** from ${sourceName}`)
                    deletedCount++
                } else {
                    // status.push(`⚠️ Could not find **${commandName}** in ${sourceName}`)
                }
            } catch (err) {
                status.push(`❌ Error handling ${sourceName}: ${err.message}`)
            }
        }

        if (scope === 'global') {
            await deleteFromManager(client.application?.commands, 'Global')
        }

        if (scope === 'guild' || scope === 'all') {
            if (guild && scope === 'guild') {
                await deleteFromManager(guild.commands, `Guild: ${guild.name}`)
            } else if (scope === 'all') {
                // Iterate all guilds the bot is in
                const guilds = client.guilds.cache
                status.push(`🔄 Scanning ${guilds.size} guilds...`)
                for (const [id, g] of guilds) {
                    await deleteFromManager(g.commands, `Guild: ${g.name}`)
                }
            }
        }

        if (deletedCount === 0 && status.length === 0) {
            return `Could not find any command named "${commandName}" to delete in scope "${scope}".`
        }

        return status.join('\n') || `Operation complete. Deleted ${deletedCount} instances.`
    }
} as ICommand
