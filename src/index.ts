import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import https from "https";
dotenv.config();

import { Bot, Context, InputFile } from "grammy";
import { ReportError } from './core';
import { iModMed, media } from './interface';
//@ts-ignore
import { admins, groups } from "../data/secrets.json";
import s from "node-schedule";
import { SpecialTime } from './special';

const envStuff = [
    "BOT_TOKEN",
    "VERSION",
    "DROP_PENDING_UPDATES",
    "NORMAL_PICS",
    "NEWYEAR_PICS",
    "CHRISTMAS_PICS",
    "PENDING_PICS",
    "APPROVED_PICS",
    "USER_LIST",
    "PIC_DB"
]

//Check if every key of process.env is defined
for (const key of envStuff) {
    console.log();
    if (process.env[key] === undefined) {
        throw `No ${key} in .env`;
    }
}



export const bot = new Bot(process.env.BOT_TOKEN);




bot.command("caption", (ctx: Context) => AddModMed(ctx));
bot.command("start", (ctx: Context) => ctx.reply('You have to suck @Ventox2 dick now :3'));
bot.command('sendman', (ctx:Context) => {if(checkVen(ctx)) SendMedia(SpecialTime.getMode().toLocaleLowerCase() as directories)});
bot.command('ping', (e:Context) => e.reply("Pong"));
bot.command('version', (e: Context) => e.reply(process.env.VERSION as string));

bot.command("setchristmas", (e: Context) => { if(!checkVen(e)){return;} SpecialTime.setMode("Christmas"); e.reply("Christmas mode enabled")});
bot.command("setnewyear", (e: Context) => { if(!checkVen(e)){return;} SpecialTime.setMode("NewYear"); e.reply("NewYear set")});
bot.command("setnormal", (e: Context) => { if(!checkVen(e)) return; SpecialTime.setMode("Normal"); e.reply("Back to normal")})

bot.command("whichtime", (e: Context) => e.reply(SpecialTime.getMode()));
bot.command('test', (e: Context) => bot.api.sendMessage(groups[0].id, "Testing"));
bot.command('status', (e: Context) => HowMuchMedia(e));

bot.command("debugcheck", (ctx: Context) => debugCheck(ctx));
bot.command("debug", (ctx: Context) => debug(ctx));
bot.command("setDebug", (ctx: Context) => setDebug(ctx));

bot.on(':photo', (e) =>  {if(!checkVen(e)){return;} UploadPic(e)});
bot.on(':animation', (e) => {if(!checkVen(e)){return;} UploadGif(e)});
bot.on(':video', (e) => {if(!checkVen(e)){return;} UploadVid(e)});


//When the user deletes a message, delete the media from the database
bot.command("delete", (e: Context) => {if(!checkVen(e)){return;} DeleteMedia(e)});




bot.start({drop_pending_updates: process.env.DROP_PENDING_UPDATES === "true", onStart: () => {admins.forEach(VenID => bot.api.sendMessage(VenID, "Bot started"))}});



bot.catch(err => {
    console.error(err);
    process.exit(1);
});

bot.api.setMyCommands([
    {command: "ping", description: "Ping the bot"},
    {command: "version", description: "Get the version of the bot"},
    
    {command: "---USER---", description: "Anything under this line is for users"},

    {command: "register", description: "Register yourself for the bot"},
    {command: "submit", description: "Allows you to send pics to your cache"},
    {command: "submit confirm", description: "Submit your cached pics"},
    {command: "submit cancel", description: "Cancels your submission"},
    {command: "status", description: "Get the status of your media"},

    {command: "---ADMIN---", description: "Anything under this line is for admins only"},
    
    {command: "caption", description: "Add a caption to a media"},
    {command: "sendman", description: "Send a random media"},
    {command: "setchristmas", description: "Enable Christmas mode"},
    {command: "setnewyear", description: "Enable NewYear mode"},
    {command: "setnormal", description: "Disable Christmas/NewYear mode"},
    {command: "whichtime", description: "Get the current time mode"},
    {command: "debug", description: "Set debug mode (only admins)"},
]);


//Start the bot

s.scheduleJob("0 * * * *", () => {
    let timeout = 0;
    let date = new Date();
    if(date.getMonth() === 11 && date.getDate() > 24 && date.getDate() < 27) timeout = 5000;

    setTimeout(() => {
        let mode = SpecialTime.getMode().toLocaleLowerCase() as directories;
        SendMedia(mode);
    }, timeout);
});

s.scheduleJob("30 * * * *", () => {
    let timeout = 0;
    let date = new Date();
    if(date.getMonth() === 11 && date.getDate() > 24 && date.getDate() < 27)
    {
        setTimeout(() => {
            let mode = SpecialTime.getMode().toLocaleLowerCase() as directories;
            SendMedia(mode);
        }, timeout);
    }    
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
    if (Media === null) return false;
    let modmed = await getModMed(Media);
    console.log(modmed);
        switch (path.extname(Media)) {
            case ".jpg": await bot.api.sendPhoto(groups[0].id, new InputFile(path.join(__dirname, "..", "data", "pics", directory, Media)), { caption: modmed }); break;
            case ".gif.mp4": await bot.api.sendAnimation(groups[0].id, new InputFile(path.join(__dirname, "..", "data", "pics", directory, Media)), { caption: modmed }); break;
            case ".mp4": await bot.api.sendVideo(groups[0].id, new InputFile(path.join(__dirname, "..", "data", "pics", directory, Media)), { caption: modmed }); break;
        }

    if (modmed != undefined) excludeFromModMed(Media);
    fs.unlinkSync(path.join(__dirname, "..", "data", "pics", directory, Media));
};


const getRandomMedia = async (dir: directories) => {
    let x = fs.readdirSync(path.join(__dirname, "..", "data", "pics", dir));
    if (x.length < 10) admins.forEach(id => bot.api.sendMessage(id, `Achtung! Nur noch ${x.length} Medien! Bitte nachfüllen`))
    if (x.length == 0) {
        admins.forEach(id => bot.api.sendMessage(id, `Ordner ist leer`));
        return null;
    }
    else return (x[Math.floor(Math.random() * x.length)]);
}

const excludeFromModMed = async (Media: string) => {
    if(!fs.existsSync(path.join(__dirname, "..", "data", "modmed.json"))) fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), "[]");
    let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
    let modmed = JSON.parse(x.toString()) as iModMed[];
    modmed = modmed.filter(x => x.file != Media);
    fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), JSON.stringify(modmed));
}

const saveModMed = async (Media: string, Caption: string) => {
    if(!fs.existsSync(path.join(__dirname, "..", "data", "modmed.json"))) fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), "[]");
    let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
    let modmed = JSON.parse(x.toString()) as iModMed[];
    modmed.push({ file: Media, caption: Caption });
    fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), JSON.stringify(modmed));
}

const AddModMed = async (ctx: Context) => {
    if (ctx.message?.chat.type != "private" && !checkVen(ctx) && ctx.message?.reply_to_message === undefined) return;
    if (ctx.message === undefined) return "no message";
    if (ctx.message.text === undefined) return "no message text";
    if (ctx.message.text.split(" ").length < 2) return "no caption";
    if (ctx.message.reply_to_message === undefined) return "no reply_to_message";
    if (ctx.message.reply_to_message.document === undefined) return "not replying to document";
    let Media = ctx.message.reply_to_message.video?.file_id ?? ctx.message.reply_to_message.animation?.file_id ?? ctx.message.reply_to_message.photo?.[0]?.file_id;
    if (Media === undefined) throw "no media";
    let Caption = ctx.message.text.split(" ").slice(1).join(" ");
    if (Caption != "") saveModMed(Media, Caption);

    ctx.reply(`${Media} wurde ${Caption} hinzugefügt`);
}

const DeleteMedia = (ctx: Context) => {
    //get the type of the file. Photo, Video, Animation
    let type: "photo" | "video" | "animation" | null = null;
    if (ctx.message?.reply_to_message?.photo !== undefined) type = "photo";
    else if (ctx.message?.reply_to_message?.video !== undefined) type = "video";
    else if (ctx.message?.reply_to_message?.animation !== undefined) type = "animation";
    else return ctx.reply("Reply to a photo, video or animation to delete");

    //@ts-expect-error
    let Media = ctx.message?.reply_to_message[type][ctx.message.reply_to_message[type]?.length - 1]?.file_id as string;

    if(!Media) return ctx.reply("irgendwas ist schief gelaufen");
    
    // Try to find the file in the christmas, newyear or normal folder
    if(fs.existsSync(path.join(__dirname, "..", "data", "christmas", Media))) fs.unlinkSync(path.join(__dirname, "..", "data", "christmas", Media));
    else if(fs.existsSync(path.join(__dirname, "..", "data", "newyear", Media))) fs.unlinkSync(path.join(__dirname, "..", "data", "newyear", Media));
    else if(fs.existsSync(path.join(__dirname, "..", "data", "normal", Media))) fs.unlinkSync(path.join(__dirname, "..", "data", "normal", Media));
    else return ctx.reply("I couldn't find that file");
    excludeFromModMed(Media);
    
}


const UploadPic = async (ctx: Context) => {
    if (!checkVen(ctx)) return;

    let directory:directories = "normal";
    if(SpecialTime.getMode() === "Christmas") directory = "christmas";
    else if(SpecialTime.getMode() === "NewYear") directory = "newyear";

    if (ctx.message?.photo === undefined) throw "no photo given";
    let PID = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    // let FID = await makeid(20);
    // if(await AlreadySent(e.message.photo[e.message.photo.length-1])) return e.reply("Already sent... won't save");
    // while(fs.existsSync(`VARS.PICS/${FID}.jpg`)) FID = await makeid(20);
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const file = fs.createWriteStream(path.join(__dirname, "..", "data", "pics", directory, `${PID}.jpg`));
    if (link === undefined) throw "invalid file path"
    https.get(link, response => response.pipe(file));
}

const UploadGif = async (ctx: Context) => {
    if (!checkVen(ctx)) return;

    let directory = "normal";
    if(SpecialTime.getMode() === "Christmas") directory = "christmas";
    else if(SpecialTime.getMode() === "NewYear") directory = "newyear";

    if (ctx.message?.animation === undefined) throw "no gif given";
    if(ctx.message.animation.file_size && ctx.message.animation.file_size > 20000000) return ctx.reply("GIF is too big");
    let PID = ctx.message.animation.file_id;
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const file = fs.createWriteStream(path.join(__dirname, "..", "data", "pics", directory, `${PID}.gif.mp4`));
    if (link === undefined) throw "invalid file path"
    https.get(link, response => response.pipe(file));

    if(debug(ctx)) ctx.reply(`Uploaded to ${directory}`);
}

const UploadVid = async (ctx: Context) => {
    if (!checkVen(ctx)) return;

    

    let directory = "normal";
    if(SpecialTime.getMode() === "Christmas") directory = "christmas";
    else if(SpecialTime.getMode() === "NewYear") directory = "newyear";

    if (ctx.message?.video === undefined) throw "no video given";
    // If the video exceeds 20MB
    if(ctx.message.video.file_size && ctx.message.video.file_size > 20000000) return ctx.reply("Video is too big"); 
    let PID = ctx.message.video.file_id;
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const file = fs.createWriteStream(path.join(__dirname, "..", "data", "pics", directory, `${PID}.mp4`));
    if (link === undefined) throw "invalid file path"
    https.get(link, response => response.pipe(file));

    if(debug(ctx)) ctx.reply(`Uploaded to ${directory}`)

}

const checkVen = (e: Context) => admins.includes(e.chat?.id || -1);

const getModMed = async (Media: string) => {
    if(!fs.existsSync(path.join(__dirname, "..", "data", "modmed.json"))) fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), "[]");
    let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
    console.log(x);
    let modmed = JSON.parse(x.toString()) as iModMed[];
    return modmed.find(x => x.file == Media)?.caption ?? undefined;
}


type directories = "christmas" | "newyear" | "normal";
const HowMuchMedia = async (ctx: Context) =>
{
    let locs: directories[] =  ["normal", "christmas", "newyear"];
    locs.forEach(loc => {
        let Anzahl = fs.readdirSync(path.join(__dirname, "..", "data", "pics", loc));

        let med:media = {jpg: [], gif: [], mp4: []};
        
        med.gif = Anzahl.filter(x => path.extname(x) == ".gif.mp4");
        med.jpg = Anzahl.filter(x => path.extname(x) == ".jpg");
        med.mp4 = Anzahl.filter(x => path.extname(x) == ".mp4");

        ctx.reply(`Es sind noch folgende Medien in der ${loc}-Warteschlange: \n\nBilder: ${med.jpg.length}\nGIFs: ${med.gif.length}\nMP4: ${med.mp4.length}`);
    });
    
} 

declare global {
    namespace NodeJS {
        export interface ProcessEnv {
            BOT_TOKEN: string;
            VERSION: string;
            DROP_PENDING_UPDATES: "true" | "false";


            // Pictures

            NORMAL_PICS: string;
            NEWYEAR_PICS: string;
            CHRISTMAS_PICS: string;
            PENDING_PICS: string;
            APPROVED_PICS: string;
            USER_LIST: string;
            PIC_DB: string;
        }
    }
}

const debugCheck = (ctx: Context) =>  checkVen(ctx) ? ctx.reply("Du bist Admin") : ctx.reply("Du bist kein Admin");
const debug = (ctx: Context) => {
    if(!checkVen(ctx)) return;
    return fs.readFileSync(path.join(__dirname, "..", "data", "debug")).toString() == "true";
}
const setDebug = (ctx: Context) => {
    if(!checkVen(ctx)) return;
    const msg = ctx.message?.text?.split(" ");
    if(!msg) return ctx.reply("Fehler");
    let debug = fs.readFileSync(path.join(__dirname, "..", "data", "debug")).toString() == "true";
    fs.writeFileSync(path.join(__dirname, "..", "data", "debug"), debug ? "false" : "true");
    return ctx.reply(`Debug-Modus ist nun ${debug ? "aus" : "an"}`);
}