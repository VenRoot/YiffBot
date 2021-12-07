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
if(process.env.BOT_TOKEN === undefined) throw "No Bot_Token";
export const bot = new Bot(process.env.BOT_TOKEN);


bot.command("caption", (ctx: Context) => AddModMed(ctx));
bot.command("start", (ctx: Context) => ctx.reply('You have to suck @Ventox2 dick now :3'));
bot.command('sendman', (ctx:Context) => {if(checkVen(ctx)) {SendMedia(false)}});
bot.command('ping', (e:Context) => e.reply("Pong"));
bot.command('version', (e: Context) => e.reply(process.env.VERSION as string));


bot.command('test', (e: Context) => bot.api.sendMessage(groups[0].id, "Testing"));
bot.command('status', (e: Context) => HowMuchMedia(e));
bot.on(':photo', (e) => UploadPic(e));
bot.on(':animation', (e) => UploadGif(e));
bot.on(':video', (e) => UploadVid(e));

bot.start({drop_pending_updates: process.env.DROP_PENDING_UPDATES === "true"});


bot.catch(err => {
    console.error(err);
    process.exit(1);
});

//Start the bot

s.scheduleJob("0 * * * *", () => {
    SendMedia(false);
});

//Send a picture every hour

process.on('uncaughtException', (err: any) => {
    console.log(err);
    ReportError(err, true);
    process.kill(process.pid, 'SIGINT');
});

const SendMedia = async (again: boolean) => {
    let Media = await getRandomMedia();
    console.log(Media);
    if(Media === null) return false;
    let modmed = await getModMed(Media);
    console.log(modmed);
        if(modmed !== undefined)
        {
            switch(path.extname(Media))
            {
                case ".jpg": await bot.api.sendPhoto(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", Media)), {caption: modmed} ); break;
                case ".gif": await bot.api.sendAnimation(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", Media)), {caption: modmed} ); break;
                case ".mp4": await bot.api.sendVideo(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", Media)), {caption: modmed} ); break;
            }
        }
        else
        {
            switch(path.extname(Media))
            {
                case ".jpg": await bot.api.sendPhoto(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", Media)) ); break;
                case ".gif": await bot.api.sendAnimation(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", Media)) ); break;
                case ".mp4": await bot.api.sendVideo(groups[0].id, new InputFile(path.join(__dirname, "..", "pics", Media)) ); break;
            }
        }
    if(modmed != undefined) excludeFromModMed(Media);
    fs.unlinkSync(path.join(__dirname, "..", "pics", Media));
};


const getRandomMedia = async () =>
{
    let x = fs.readdirSync(path.join(__dirname, "..", "pics"));
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
    console.log("Hallo", ctx.message?.from?.id, VenID);
    
    if(!await checkVen(ctx)) return;

    if(ctx.message?.photo === undefined) throw "no photo given";
    let PID = ctx.message.photo[ctx.message.photo.length-1].file_id;
    // let FID = await makeid(20);
    // if(await AlreadySent(e.message.photo[e.message.photo.length-1])) return e.reply("Already sent... won't save");
    // while(fs.existsSync(`VARS.PICS/${FID}.jpg`)) FID = await makeid(20);
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const file = fs.createWriteStream(path.join(__dirname, "..", "pics", `${PID}.jpg`));
    if(link === undefined) throw "invalid file path"
    https.get(link, response => response.pipe(file));
}

const UploadGif = async (ctx: Context) =>
{
    if(!await checkVen(ctx)) return;

    if(ctx.message?.animation === undefined) throw "no gif given";
    let PID = ctx.message.animation.file_id;
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const file = fs.createWriteStream(path.join(__dirname, "..", "pics", `${PID}.gif`));
    if(link === undefined) throw "invalid file path"
    https.get(link, response => response.pipe(file));
}

const UploadVid = async (ctx: Context) =>
{
    if(!await checkVen(ctx)) return;

    if(ctx.message?.video === undefined) throw "no video given";
    let PID = ctx.message.video.file_id;
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(PID)).file_path}`;
    const file = fs.createWriteStream(path.join(__dirname, "..", "pics", `${PID}.mp4`));
    if(link === undefined) throw "invalid file path"
    https.get(link, response => response.pipe(file));
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
    let Anzahl = fs.readdirSync(path.join(__dirname, "..", "pics"));

    let med:media = {jpg: [], gif: [], mp4: []};
    
    med.gif = Anzahl.filter(x => path.extname(x) == ".gif");
    med.jpg = Anzahl.filter(x => path.extname(x) == ".jpg");
    med.mp4 = Anzahl.filter(x => path.extname(x) == ".mp4");

    ctx.reply(`Es sind noch folgende Medien in der Warteschlange: \n\nBilder: ${med.jpg.length}\nGIFs: ${med.gif.length}\nMP4: ${med.mp4.length}`);
} 