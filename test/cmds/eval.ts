import { Command, type CommandContext } from '../../mod.ts'

export default class EvalCommand extends Command {
  name = 'eval'
  ownerOnly = true

  async execute(ctx: CommandContext): Promise<void> {
    try {
      let evaled = eval(ctx.argString)
      if (evaled instanceof Promise) evaled = await evaled
      if (typeof evaled === 'object') evaled = Deno.inspect(evaled)
      await ctx.message.reply(
        `\`\`\`js\n${`${evaled}`.substring(0, 1990)}\n\`\`\``
      )
    } catch (e) {
      ctx.message.reply(`\`\`\`js\n${(e as Error).stack}\n\`\`\``)
    }
  }
}
