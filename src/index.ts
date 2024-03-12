import dotenv from 'dotenv';
dotenv.config();

import { Context } from "grammy";
import { ReportError, getReverseToken } from './core';
import config from "./modules/env";
import s from "node-schedule";
import { isChristmas, isNewYear, special } from './special';
if(process.env.BOT_TOKEN === undefined) throw "No Bot_Token";
import { bot } from './bot';
import * as middleware from "./modules/middleware";
import * as media from "./modules/media";
import { EmptyDirectoryError, EmptyFileError, OutOfRetiesError } from './modules/exceptions';

bot.command("caption", middleware.addCaptionToMedia);
bot.command("start", middleware.start);
bot.command('sendman', middleware.sendman);
bot.command('ping', middleware.ping);
bot.command('version', middleware.version);

bot.command("setMethod", middleware.setMethod)
bot.command("whichtime", middleware.whichTime)
bot.command('status', middleware.status);



bot.command("addAdmin", (e: Context) => middleware.addAdmin(e));

bot.command("removeAdmin", (e: Context) => middleware.removeAdmin(e));

bot.on(":photo", (e) => middleware.handleMedia(e, "photo"));
bot.on(":animation", (e) => middleware.handleMedia(e, "animation"));
bot.on(":video", (e) => middleware.handleMedia(e, "video"));



bot.start({drop_pending_updates: process.env.DROP_PENDING_UPDATES === "true", onStart: () => {
    console.log("Started bot in "+getReverseToken(bot.token) + " mode");
    bot.api.sendMessage(config.VenID, "Bot started");
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
    {command: "status", description: "Get the status of the bot"},
    {command: "addadmin", description: "Add an user to the bot by their ID"},
    {command: "removeadmin", description: "Remove an user from the bot by their ID"},
]);

//Start the bot

s.scheduleJob("0 * * * *", async () => {
    try {
        let mode: "normal" | "christmas" | "newyear" = "normal";
        const date = new Date();
        if(isChristmas(date)) mode = "christmas";
        else if(isNewYear(date)) mode = "newyear";
        await media.send(mode);
    } catch(err) {
        if(err instanceof OutOfRetiesError) {
            bot.api.sendMessage(config.VenID, "ERROR: Out of retries sending media");
        }
        else if(err instanceof EmptyDirectoryError) {
            bot.api.sendMessage(config.VenID, "ERROR: Directory is empty");
        }
        else if(err instanceof EmptyFileError) {
            bot.api.sendMessage(config.VenID, "ERROR: File is empty");
        }
        else {
            console.error(err);
            bot.api.sendMessage(config.VenID, "ERROR: "+JSON.stringify(err));
        }
    }
});

//Send a picture every hour

process.on('uncaughtException', (err: any) => {
    console.error(err);
    ReportError(err);
    process.kill(process.pid, 'SIGINT');
});
