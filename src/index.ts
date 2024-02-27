import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import https from "https";
dotenv.config();

import { Context, InputFile } from "grammy";
import { ReportError, addAdmin, checkAdmin, extractCommandArgument, getGroups, getReverseToken, isDirectMessage, removeAdmin } from './core';
import { iModMed, media } from './interface';
//@ts-ignore
import {VenID} from "../secrets.json";
import s from "node-schedule";
import { isChristmas, isNewYear, special } from './special';
import { databaseService } from './mariadb';
import { checkIfValid, downloadFile } from './modules/file';
if(process.env.BOT_TOKEN === undefined) throw "No Bot_Token";
import { bot, getToken } from './bot';
import * as middleware from "./modules/middleware";

bot.command("caption", (ctx: Context) => AddModMed(ctx));
bot.command("start", (ctx: Context) => ctx.reply('You have to suck @Ventox2 dick now :3'));
bot.command('sendman', async (ctx:Context) => {if(await checkAdmin(ctx.message?.from.id ?? -1)) {SendMedia("normal").then(() => ctx.reply("Media sent"))} else {ctx.reply("Permission denied")}});
bot.command("sendmannewyear", (ctx: Context) => {if(checkVen(ctx)) {SendMedia("newyear")}});
bot.command('ping', (e:Context) => e.reply("Pong"));
bot.command('version', (e: Context) => e.reply(process.env.VERSION as string));

bot.command("setchristmas", (e: Context) => { if(!checkVen(e)){return;} special.christmas = true; special.newyear = false; e.reply("Christmas mode enabled")});
bot.command("setnewyear", (e: Context) => { if(!checkVen(e)){return;} special.newyear = true; special.christmas = false; e.reply("NewYear set")});
bot.command("unsetchristmas", (e: Context) => { if(!checkVen(e)){return;} special.christmas = false; e.reply("Christmas mode disabled")});
bot.command("unsetnewyear", (e: Context) => { if(!checkVen(e)){return;} special.newyear = false; e.reply("NewYear disabled")});

bot.command("whichtime", (e:Context)=> {if(isNewYear(new Date())) { e.reply("newyear")} else if(isChristmas(new Date())) {e.reply("christmas")} else { e.reply("normal");}});
//bot.command('test', (e: Context) => bot.api.sendMessage(groups[0].id, "Testing"));
bot.command('status', (e: Context) => HowMuchMedia(e));



bot.command("adduser", (e: Context) => middleware.addAdmin(e));

bot.command("removeuser", (e: Context) => middleware.removeAdmin(e));

bot.on(":photo", async (e) => handleMedia(e, "photo"));
bot.on(":animation", async (e) => handleMedia(e, "animation"));
bot.on(":video", async (e) => handleMedia(e, "video"));



bot.start({drop_pending_updates: process.env.DROP_PENDING_UPDATES === "true", onStart: () => {
    console.log("Started bot in "+getReverseToken(bot.token) + " mode");
    bot.api.sendMessage(VenID, "Bot started");
}});





bot.catch(err => {
    ReportError(err);
    console.error(err);
    process.exit(1);
});

bot.api.setMyCommands([
    {command: "caption", description: "Add a caption to a media"},
    {command: "sendman", description: "Send a random media"},
    {command: "ping", description: "Ping the bot"},
    {command: "version", description: "Get the version of the bot"},
    {command: "setchristmas", description: "Enable Christmas mode"},
    {command: "setnewyear", description: "Enable NewYear mode"},
    {command: "unsetchristmas", description: "Disable Christmas mode"},
    {command: "unsetnewyear", description: "Disable NewYear mode"},
    {command: "status", description: "Get the status of the bot"},
    {command: "adduser", description: "Add an user to the bot by their ID"},
    {command: "removeuser", description: "Remove an user from the bot by their ID"},
]);

//Start the bot

s.scheduleJob("0 * * * *", () => {
    if(isChristmas(new Date()))
    {
        SendMedia("christmas");
    }
    else if(isNewYear(new Date()))
    {
        SendMedia("newyear");
    }
    else SendMedia("normal");
});

//Send a picture every hour

process.on('uncaughtException', (err: any) => {
    console.error(err);
    ReportError(err);
    process.kill(process.pid, 'SIGINT');
});







const saveModMed = async (Media: string, Caption: string) =>
{
    let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
    let modmed = JSON.parse(x.toString()) as iModMed[];
    modmed.push({file: Media, caption: Caption});
    fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), JSON.stringify(modmed));
}

const AddModMed = async (ctx: Context) =>
{
    if(ctx.message?.chat.type != "private" && !checkVen(ctx) && ctx.message?.reply_to_message === undefined) return;
    if(ctx.message === undefined) return "no message";
    if(ctx.message.text === undefined) return "no message text";
    if(ctx.message.text.split(" ").length < 2) return "no caption";
    if(ctx.message.reply_to_message === undefined) return "no reply_to_message";
    if(ctx.message.reply_to_message.document === undefined) return "not replying to document";
    if(!checkVen(ctx)) return ctx.reply("You're not Ven!");
    let Media = ctx.message.reply_to_message.video?.file_id ?? ctx.message.reply_to_message.animation?.file_id ?? ctx.message.reply_to_message.photo?.[0]?.file_id;
    if(Media === undefined) throw "no media";
    let Caption = extractCommandArgument(ctx.message);
    if((Caption?.length ?? 0) > 0) saveModMed(Media, Caption!);
    
    ctx.reply(`${Media} wurde ${Caption} hinzugefügt`);
}





const checkVen = (e: Context) => e.chat?.id == VenID;

