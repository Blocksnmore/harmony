import { Command, type Member, type CommandContext, Embed } from '../../mod.ts'

export default class UserinfoCommand extends Command {
  override name = 'userinfo'
  override guildOnly = true
  override aliases = ['u', 'user']

  override async execute(ctx: CommandContext): Promise<void> {
    const member: Member = ctx.message.member!
    const roles = await member.roles.array()
    const embed = new Embed()
      .setTitle(`User Info`)
      .setAuthor({ name: member.user.tag })
      .addField('ID', member.id)
      .addField('Roles', roles.map((r) => r.name).join(', '))
      .addField(
        'Permissions',
        JSON.stringify(member.permissions.has('ADMINISTRATOR'))
      )
      .setColor(0xff00ff)
    ctx.channel.send(embed)
  }
}
