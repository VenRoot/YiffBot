import {Context} from "grammy";
import {bot} from "./index";
//@ts-ignore
import { admins } from "../data/secrets.json";
export const checkAdmin = (ctx: Context) => {
    if(ctx.message === undefined) throw "no message";
    if(ctx.message.from === undefined) throw "no message owner";
    return admins.includes(ctx.message.from.id);
}

export const ReportError = (ctx: Context, toVen: boolean) => {
    if(toVen) admins.forEach(id => bot.api.sendMessage(id, JSON.stringify(ctx)));
    else ctx.reply(`An error occured.`);
}