import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import https from "https";
dotenv.config();

import { Bot, Context, InputFile } from "grammy";
import { ReportError } from './core';
import { iModMed, media } from './interface';
//@ts-ignore
import {VenID, groups} from "../secrets.json";
import s from "node-schedule";
import { isChristmas, isNewYear, special } from './special';
import { getAllData, getData, storeData } from './mariadb';
import { downloadFile } from './modules/file';
if(process.env.BOT_TOKEN === undefined) throw "No Bot_Token";
export const bot = new Bot(process.env.BOT_TOKEN);

bot.command("caption", (ctx: Context) => AddModMed(ctx));
bot.command("start", (ctx: Context) => ctx.reply('You have to suck @Ventox2 dick now :3'));
bot.command('sendman', (ctx:Context) => {if(checkVen(ctx)) {SendMedia("normal")}});
bot.command("sendmannewyear", (ctx: Context) => {if(checkVen(ctx)) {SendMedia("newyear")}});
bot.command('ping', (e:Context) => e.reply("Pong"));
bot.command('version', (e: Context) => e.reply(process.env.VERSION as string));

bot.command("setchristmas", (e: Context) => { if(!checkVen(e)){return;} special.Christmas = true; special.NewYear = false; e.reply("Christmas mode enabled")});
bot.command("setnewyear", (e: Context) => { if(!checkVen(e)){return;} special.NewYear = true; special.Christmas = false; e.reply("NewYear set")});
bot.command("unsetchristmas", (e: Context) => { if(!checkVen(e)){return;} special.Christmas = false; e.reply("Christmas mode disabled")});
bot.command("unsetnewyear", (e: Context) => { if(!checkVen(e)){return;} special.NewYear = false; e.reply("NewYear disabled")});

bot.command("whichtime", (e:Context)=> {if(isNewYear(new Date())) { e.reply("newyear")} else if(isChristmas(new Date())) {e.reply("christmas")} else { e.reply("normal");}});
bot.command('test', (e: Context) => bot.api.sendMessage(groups[0].id, "Testing"));
bot.command('status', (e: Context) => HowMuchMedia(e));

async function handleMedia(e: Context, type: "photo" | "animation" | "video") {
    if(!isInDM(e)) return;

    if(!await checkAdmin(e)) return e.reply("Permission denied");

    switch(type) {
        case "photo":
            return await UploadPic(e);
        case "animation":
            return await UploadGif(e);
        case "video":
            return await UploadVid(e);
    }
}

function isInDM(e: Context) {
    return e.message?.chat?.type === 'private';
}

bot.command("adduser", (e: Context) => {
    try
    {
        if(!checkVen(e)) return e.reply("Permission denied");

        if(e.message?.text === undefined) return e.reply("No message text");
        if(e.message.text.split(" ").length < 2) return e.reply("No UserID");
        let ID = e.message.text.split(" ")[1];
        if(ID === undefined) return e.reply("No UserID");
        if(isNaN(parseInt(ID))) return e.reply("Invalid UserID");
    
        storeData({userid: parseInt(ID)});
    
        e.reply(`Added UserID ${ID}`);
    }
    catch(err)
    {
        ReportError(err);
    }
});




bot.start({drop_pending_updates: process.env.DROP_PENDING_UPDATES === "true", onStart: () => {
    console.log(VenID);
    bot.api.sendMessage(VenID, "Bot started");
}});


type directories = "christmas" | "newyear" | "normal";


bot.catch(err => {
    ReportError(err, true);
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
    console.log(err);
    ReportError(err, true);
    process.kill(process.pid, 'SIGINT');
});

const SendMedia = async (directory: directories) => {

    let Media = await getRandomMedia(directory);
    console.log(Media);
    if(Media === null) return false;
    let modmed = await getModMed(Media);
    console.log(modmed);
        if(modmed !== undefined)
        {
            switch(path.extname(Media))
            {
                case ".jpg": await bot.api.sendPhoto(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", directory, Media)), {caption: modmed} ); break;
                case ".gif": await bot.api.sendAnimation(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", directory, Media)), {caption: modmed} ); break;
                case ".mp4": await bot.api.sendVideo(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", directory, Media)), {caption: modmed} ); break;
            }
        }
        else
        {
            switch(path.extname(Media))
            {
                case ".jpg": await bot.api.sendPhoto(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", directory, Media)) ); break;
                case ".gif": await bot.api.sendAnimation(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", directory, Media)) ); break;
                case ".mp4": await bot.api.sendVideo(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", directory, Media)) ); break;
            }
        }
    if(modmed != undefined) excludeFromModMed(Media);
    fs.unlinkSync(path.join(__dirname, "..", "pics", directory, Media));
};


const getRandomMedia = async (dir: directories) =>
{

    let x = fs.readdirSync(path.join(__dirname, "..", "pics", dir));
    if(x.length < 10) bot.api.sendMessage(VenID, `Achtung! Nur noch ${x.length} Medien! Bitte nachfüllen`)
    if (x.length == 0)
    {
      bot.api.sendMessage(VenID, `Ordner ist leer`);
      return null;
    }
    else return (x[Math.floor(Math.random() * x.length)]);
}

const excludeFromModMed = async (Media: string) =>
{
    let x = fs.readFileSync(path.join(__dirname, "..", "modmed.json"));
    let modmed = JSON.parse(x.toString()) as iModMed[];
    //if the media is not in the modmed list, return
    if(!modmed.some(x => x.file === Media)) return;
    modmed = modmed.filter(x => x.file != Media);
    fs.writeFileSync(path.join(__dirname, "..", "modmed.json"), JSON.stringify(modmed));
}

const saveModMed = async (Media: string, Caption: string) =>
{
    let x = fs.readFileSync(path.join(__dirname, "..", "modmed.json"));
    let modmed = JSON.parse(x.toString()) as iModMed[];
    modmed.push({file: Media, caption: Caption});
    fs.writeFileSync(path.join(__dirname, "..", "modmed.json"), JSON.stringify(modmed));
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
    let Caption = ctx.message.text.split(" ").slice(1).join(" ");
    if(Caption != "") saveModMed(Media, Caption);
    
    ctx.reply(`${Media} wurde ${Caption} hinzugefügt`);
}


const UploadPic = async (ctx: Context) =>
{
    let directory:directories = "normal";
    let fuse = false;
    if(special.Christmas) directory = "christmas";
    else if(special.NewYear) directory = "newyear";
    if(!await checkAdmin(ctx)) return ctx.reply("Permission denied");

    if(ctx.message?.photo === undefined) throw "no photo given";
    let PID = ctx.message.photo[ctx.message.photo.length-1].file_id;
    const file = await bot.api.getFile(PID).catch(err => {
        if(err) {
            console.error(err);
            ctx.reply("Failed to get photo: " +err);
            fuse = true;
        }
    });
    if(fuse) return;
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const filePath = path.join(__dirname, "..", "data", "pics", directory, `${PID}.jpg`);
    downloadFile(link, filePath).catch(err => {
        console.error(err);
        ctx.reply("Failed to download photo: " + err);
    });
}

const UploadGif = async (ctx: Context) =>
{
    let directory = "normal";
    let fuse = false;
    if(special.Christmas) directory = "christmas";
    else if(special.NewYear) directory = "newyear";
    if(!checkVen(ctx)) return;

    if(ctx.message?.animation === undefined) throw "no gif given";
    let PID = ctx.message.animation.file_id;
    const file = await bot.api.getFile(PID).catch(err => {
        if(err) {
            console.error(err);
            ctx.reply("Failed to get gif: " + err);
            fuse = true;
        }
    })
    if(fuse) return;
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const filePath = path.join(__dirname, "..", "data", "pics", directory, `${PID}.gif`);
    downloadFile(link, filePath).catch(err => {
        console.error(err);
        ctx.reply("Failed to download gif: " + err);
    });
}

const UploadVid = async (ctx: Context) =>
{
    let directory = "normal";
    let fuse = false;
    if(special.Christmas) directory = "christmas";
    else if(special.NewYear) directory = "newyear";
    if(!checkVen(ctx)) return;

    if(ctx.message?.video === undefined) throw "no video given";
    let PID = ctx.message.video.file_id;
    const file = await bot.api.getFile(PID).catch(err => {
        if(err) {
            console.error(err);
            ctx.reply("Failed to get video: " +err);
            fuse = true;
        }
    });
    if(fuse) return;
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const filePath = path.join(__dirname, "..", "data", "pics", directory, `${PID}.mp4`);
    downloadFile(link, filePath).catch(err => {
        console.error(err);
        ctx.reply("Failed to download video: " + err);
    });
}

const checkVen = (e: Context) => e.chat?.id == VenID;

const getModMed = async (Media: string) =>
{
    let x = fs.readFileSync(path.join(__dirname, "..", "modmed.json"));
    console.log(x);
    let modmed = JSON.parse(x.toString()) as iModMed[];
    return modmed.find(x => x.file == Media)?.caption ?? undefined;
}

const HowMuchMedia = async (ctx: Context) =>
{
    let locs: directories[] =  ["normal", "christmas", "newyear"];
    locs.forEach(loc => {
        let Anzahl = fs.readdirSync(path.join(__dirname, "..", "pics", loc));

        let med:media = {jpg: [], gif: [], mp4: []};
        
        med.gif = Anzahl.filter(x => path.extname(x) == ".gif");
        med.jpg = Anzahl.filter(x => path.extname(x) == ".jpg");
        med.mp4 = Anzahl.filter(x => path.extname(x) == ".mp4");

        ctx.reply(`Es sind noch folgende Medien in der ${loc}-Warteschlange: \n\nBilder: ${med.jpg.length}\nGIFs: ${med.gif.length}\nMP4: ${med.mp4.length}`);
    });
    
} 
