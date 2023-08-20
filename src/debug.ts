import { Context } from "grammy";
import path from "path";
import fs from "fs";
import { checkVen } from ".";

export const debugCheck = (ctx: Context) =>  checkVen(ctx) ? ctx.reply("Du bist Admin") : ctx.reply("Du bist kein Admin");
export const debug = (ctx: Context) => {
    if(!checkVen(ctx)) return;
    return fs.readFileSync(path.join(__dirname, "..", "data", "debug")).toString() == "true";
}
export const setDebug = (ctx: Context) => {
    if(!checkVen(ctx)) return;
    const msg = ctx.message?.text?.split(" ");
    if(!msg) return ctx.reply("Fehler");
    let debug = fs.readFileSync(path.join(__dirname, "..", "data", "debug")).toString() == "true";
    fs.writeFileSync(path.join(__dirname, "..", "data", "debug"), debug ? "false" : "true");
    return ctx.reply(`Debug-Modus ist nun ${debug ? "aus" : "an"}`);
}