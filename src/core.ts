import {Context} from "grammy";
import {bot} from "./index";
//@ts-ignore
import {VenID} from "../secrets.json";
export const checkAdmin = (ctx: Context) => {
    if(ctx.message === undefined) throw "no message";
    if(ctx.message.from === undefined) throw "no message owner";
    return ctx.message.from.id === VenID;
}

export const ReportError = (ctx: Context, toVen: boolean) => {
    if(toVen) bot.api.sendMessage(VenID, JSON.stringify(ctx));
    else ctx.reply(`An error occured.`);
}