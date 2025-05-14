import {
  Command,
  type CommandContext,
  ChannelTypes,
  type VoiceChannel
} from '../../mod.ts'

export default class KickFromSpecificVoiceCommand extends Command {
  override name = 'kickFromSpecificVoice'

  override async execute(ctx: CommandContext): Promise<void> {
    if (ctx.guild !== undefined) {
      const channel = await ctx.guild.channels.get('YOUR VOICE CHANNEL ID')
      if (channel === undefined || channel.type !== ChannelTypes.GUILD_VOICE) {
        ctx.channel.send('The channel is either not a voice or not available.')
        return
      }

      const members = await (channel as VoiceChannel).disconnectAll()
      members.forEach((member) => {
        ctx.channel.send(`Kicked member ${member.id}`)
      })
    }
  }
}
