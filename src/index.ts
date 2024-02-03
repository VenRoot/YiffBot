import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import https from "https";
dotenv.config();

import { Bot, Context, InputFile } from "grammy";
import { ReportError, addAdmin, checkAdmin, getGroups, getReverseToken, getToken, removeAdmin } from './core';
import { iModMed, media } from './interface';
//@ts-ignore
import {VenID} from "../secrets.json";
import s from "node-schedule";
import { isChristmas, isNewYear, special } from './special';
import { getAllData, getData, storeData } from './mariadb';
import { checkIfValid, downloadFile } from './modules/file';
if(process.env.BOT_TOKEN === undefined) throw "No Bot_Token";
export const bot = new Bot(getToken());

bot.command("caption", (ctx: Context) => AddModMed(ctx));
bot.command("start", (ctx: Context) => ctx.reply('You have to suck @Ventox2 dick now :3'));
bot.command('sendman', async (ctx:Context) => {if(await checkAdmin(ctx)) {SendMedia("normal").then(() => ctx.reply("Media sent"))} else {ctx.reply("Permission denied")}});
bot.command("sendmannewyear", (ctx: Context) => {if(checkVen(ctx)) {SendMedia("newyear")}});
bot.command('ping', (e:Context) => e.reply("Pong"));
bot.command('version', (e: Context) => e.reply(process.env.VERSION as string));

bot.command("setchristmas", (e: Context) => { if(!checkVen(e)){return;} special.Christmas = true; special.NewYear = false; e.reply("Christmas mode enabled")});
bot.command("setnewyear", (e: Context) => { if(!checkVen(e)){return;} special.NewYear = true; special.Christmas = false; e.reply("NewYear set")});
bot.command("unsetchristmas", (e: Context) => { if(!checkVen(e)){return;} special.Christmas = false; e.reply("Christmas mode disabled")});
bot.command("unsetnewyear", (e: Context) => { if(!checkVen(e)){return;} special.NewYear = false; e.reply("NewYear disabled")});

bot.command("whichtime", (e:Context)=> {if(isNewYear(new Date())) { e.reply("newyear")} else if(isChristmas(new Date())) {e.reply("christmas")} else { e.reply("normal");}});
//bot.command('test', (e: Context) => bot.api.sendMessage(groups[0].id, "Testing"));
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
        if(e.message.text.split(" ").length < 3) return e.reply("No Name");
        let ID = e.message.text.split(" ")[1];
        let name = e.message.text.split(" ")[2];
        if(ID === undefined) return e.reply("No UserID");
        if(name === undefined) return e.reply("No Name");
        if(isNaN(parseInt(ID))) return e.reply("Invalid UserID");
    
        addAdmin(parseInt(ID), name).then(() => {
            e.reply(`Added User ${name} with ID: ${ID}`);
        })
    
    }
    catch(err)
    {
        ReportError(err);
    }
});

bot.command("removeuser", (e: Context) => {
    try {
        if(!checkVen(e)) return e.reply("Permission denied");

        if(e.message?.text === undefined) return e.reply("No message text");
        if(e.message.text.split(" ").length < 2) return e.reply("No UserID");
        let ID = e.message.text.split(" ")[1];

        if(ID === undefined) return e.reply("No UserID");
        if(isNaN(parseInt(ID))) return e.reply("Invalid UserID");

        removeAdmin(parseInt(ID)).then(() => {
            e.reply(`Removed User with ID: ${ID}`);
        })
    } catch(err) {
        ReportError(err);
    }
})

bot.on(":photo", async (e) => handleMedia(e, "photo"));
bot.on(":animation", async (e) => handleMedia(e, "animation"));
bot.on(":video", async (e) => handleMedia(e, "video"));



bot.start({drop_pending_updates: process.env.DROP_PENDING_UPDATES === "true", onStart: () => {
    console.log("Started bot in "+getReverseToken(bot.token) + " mode");
    bot.api.sendMessage(VenID, "Bot started");
}});


type directories = "christmas" | "newyear" | "normal";


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

const SendMedia = async (directory: directories, retries?: number): Promise<void> => {

    let Media = await getRandomMedia(directory);
    const groups = getGroups();
    console.log(Media);
    if(Media === null) return;

    fs.mkdirSync(path.join(__dirname, "..", "data", "pics", directory), {recursive: true});
    const _path = path.join(__dirname, "..", "data", "pics", directory, Media);
    let fuse = false;
    try {
        await checkIfValid(_path)
    } catch(err) {
        console.error(err);
        fuse = true;
        return;
    }
    if(fuse) {
        if(retries && retries > 5) throw new Error("Too many retries trying to send media");
        return SendMedia(directory, retries ? retries + 1 : 1);
    }

    let modmed = await getModMed(Media);
    console.log(modmed);
        if(modmed !== undefined)
        {
            switch(path.extname(Media))
            {
                case ".jpg": await bot.api.sendPhoto(groups.channel, new InputFile(_path), {caption: modmed} ); break;
                case ".gif": await bot.api.sendAnimation(groups.channel, new InputFile(_path), {caption: modmed} ); break;
                case ".mp4": await bot.api.sendVideo(groups.channel, new InputFile(_path), {caption: modmed} ); break;
            }
        }
        else
        {
            switch(path.extname(Media))
            {
                case ".jpg": await bot.api.sendPhoto(groups.channel, new InputFile(_path) ); break;
                case ".gif": await bot.api.sendAnimation(groups.channel, new InputFile(_path) ); break;
                case ".mp4": await bot.api.sendVideo(groups.channel, new InputFile(_path) ); break;
            }
        }
    if(modmed != undefined) excludeFromModMed(Media);
    fs.unlinkSync(path.join(__dirname, "..", "data", "pics", directory, Media));
};


const getRandomMedia = async (dir: directories) =>
{
    fs.mkdirSync(path.join(__dirname, "..", "data", "pics", dir), {recursive: true});
    let x = fs.readdirSync(path.join(__dirname, "..", "data", "pics", dir));

    let admins = await getAllData();
    if(admins === null)
    {
        admins = [VenID];
    }

    if(x.length < 10)
    {
        admins.forEach(async (admin) => {
            await bot.api.sendMessage(admin, `Achtung! Nur noch ${x.length} Medien! Bitte nachfüllen`).catch(async err => {
                await bot.api.sendMessage(VenID, `Konnte Nachricht an Admin ${admin} nicht senden: RawError: ${JSON.stringify(err)}`);
            })
        });
    }

    if (x.length == 0)
    {
      admins.forEach(async (admin) => {
          await bot.api.sendMessage(admin, `Ordner ist leer`).catch(async err => {
            await bot.api.sendMessage(VenID, `Konnte Nachricht an Admin ${admin} nicht senden: RawError: ${JSON.stringify(err)}`);
          });
      });
      return null;
    }
    else return (x[Math.floor(Math.random() * x.length)]);
}

const excludeFromModMed = async (Media: string) =>
{
    let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
    let modmed = JSON.parse(x.toString()) as iModMed[];
    //if the media is not in the modmed list, return
    if(!modmed.some(x => x.file === Media)) return;
    modmed = modmed.filter(x => x.file != Media);
    fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), JSON.stringify(modmed));
}

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
    let link = `https://api.telegram.org/file/bot${getToken()}/${file!.file_path}`;
    const filePath = path.join(__dirname, "..", "data", "pics", directory, `${PID}.jpg`);
    downloadFile(link, filePath).catch(err => {
        console.error(err);
        ctx.reply("Failed to download photo: " + err);
    }).then(() => afterSubmission(ctx, filePath));
}

const UploadGif = async (ctx: Context) =>
{
    let directory = "normal";
    let fuse = false;
    if(special.Christmas) directory = "christmas";
    else if(special.NewYear) directory = "newyear";
    // if(!checkVen(ctx)) return;
    if(!await checkAdmin(ctx)) return ctx.reply("Permission denied");

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
    let link = `https://api.telegram.org/file/bot${getToken()}/${file!.file_path}`;
    const filePath = path.join(__dirname, "..", "data", "pics", directory, `${PID}.gif`);
    downloadFile(link, filePath).catch(err => {
        console.error(err);
        ctx.reply("Failed to download gif: " + err);
    }).then(() => afterSubmission(ctx, filePath));
}

const UploadVid = async (ctx: Context) =>
{
    let directory = "normal";
    let fuse = false;
    if(special.Christmas) directory = "christmas";
    else if(special.NewYear) directory = "newyear";
    // if(!checkVen(ctx)) return;
    if(!await checkAdmin(ctx)) return ctx.reply("Permission denied");

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
    let link = `https://api.telegram.org/file/bot${getToken()}/${file!.file_path}`;
    const filePath = path.join(__dirname, "..", "data", "pics", directory, `${PID}.mp4`);
    downloadFile(link, filePath).catch(err => {
        console.error(err);
        ctx.reply("Failed to download video: " + err);
    }).then(() => afterSubmission(ctx, filePath));
}

function afterSubmission(ctx: Context, filePath: string) {
    checkIfValid(filePath).catch(err => {
        console.error(err);
        ctx.reply("File is empty... deleting file " + err, {reply_to_message_id: ctx.message?.message_id});
        fs.unlink(filePath, (err) => {
            if(err) { 
                console.error(err);
                ctx.reply("Failed to delete file: " + err, {reply_to_message_id: ctx.message?.message_id});
            }
        })
    });
}

const checkVen = (e: Context) => e.chat?.id == VenID;

const getModMed = async (Media: string) =>
{
    let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
    console.log(x);
    let modmed = JSON.parse(x.toString()) as iModMed[];
    return modmed.find(x => x.file == Media)?.caption ?? undefined;
}

const HowMuchMedia = async (ctx: Context) =>
{
    let locs: directories[] =  ["normal", "christmas", "newyear"];
    locs.forEach(loc => {
        fs.mkdirSync(path.join(__dirname, "..", "data", "pics", loc), {recursive: true});
        let Anzahl = fs.readdirSync(path.join(__dirname, "..", "data", "pics", loc));

        let med:media = {jpg: [], gif: [], mp4: []};
        
        med.gif = Anzahl.filter(x => path.extname(x) == ".gif");
        med.jpg = Anzahl.filter(x => path.extname(x) == ".jpg");
        med.mp4 = Anzahl.filter(x => path.extname(x) == ".mp4");

        ctx.reply(`Es sind noch folgende Medien in der ${loc}-Warteschlange: \n\nBilder: ${med.jpg.length}\nGIFs: ${med.gif.length}\nMP4: ${med.mp4.length}`);
    });
    
} 
