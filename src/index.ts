import dotenv from 'dotenv';

dotenv.config();

import { Bot } from "grammy";

if(process.env.BOT_TOKEN === undefined) throw "No Bot_Token";
const bot = new Bot(process.env.BOT_TOKEN);

bot.catch(err => {
    console.error(err);
    process.exit(1);
});
