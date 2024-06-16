// commands/command.ts
import type { BotType } from "..";

export default (bot: BotType) =>
	bot.command("start", (context) => context.send("hello!"));
