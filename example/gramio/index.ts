// index.ts
import { Bot } from "gramio";
import { autoload } from "@gramio/autoload";

const bot = new Bot(process.env.TOKEN as string)
	.extend(autoload())
	.onStart(console.log);

bot.start();

export type BotType = typeof bot;
