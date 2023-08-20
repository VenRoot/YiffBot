import dotenv from 'dotenv';
dotenv.config();

import { Bot, Context } from "grammy";
import { ReportError } from './core';
import { admins } from "../data/secrets.json";
import s from "node-schedule";
import { SpecialTime } from './special';
import ModMed from './ModMed';
import Media from './Media';
import { debugCheck, debug, setDebug } from './debug';
import { directories } from './interface';
import User from './user';
//@ts-ignore
import PackageJSON from '../package.json';

const envStuff = [
    "BOT_TOKEN",
    "NODE_ENV",
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

export const bot = new Bot(process!.env!.BOT_TOKEN!);


bot.command("caption", (ctx: Context) => ModMed.add(ctx));
bot.command("start", (ctx: Context) => ctx.reply('You have to suck @Ventox2 dick now :3'));
bot.command('sendman', (ctx: Context) => { if (checkVen(ctx)) Media.send(SpecialTime.getMode().toLocaleLowerCase() as directories) });
bot.command('ping', (e: Context) => e.reply("Pong"));
bot.command('version', (e: Context) => e.reply(PackageJSON.version));

bot.command("setchristmas", (e: Context) => { if (!checkVen(e)) { return; } SpecialTime.setMode("Christmas"); e.reply("Christmas mode enabled") });
bot.command("setnewyear", (e: Context) => { if (!checkVen(e)) { return; } SpecialTime.setMode("NewYear"); e.reply("NewYear set") });
bot.command("setnormal", (e: Context) => { if (!checkVen(e)) return; SpecialTime.setMode("Normal"); e.reply("Back to normal") })

bot.command("whichtime", (e: Context) => e.reply(SpecialTime.getMode()));
// bot.command('test', (e: Context) => bot.api.sendMessage(groups[0].id, "Testing"));
bot.command('status', (e: Context) => Media.howMuch(e));

bot.command("debugcheck", (ctx: Context) => debugCheck(ctx));
bot.command("debug", (ctx: Context) => debug(ctx));
bot.command("setDebug", (ctx: Context) => setDebug(ctx));

// bot.on(':photo', (e) => Media.upload(e, "photo"));

bot.on(':photo', (e) => {
    if(checkVen(e)) return Media.upload(e, "photo");
    const x = User.findById(e.from!.id);
    if(!x) return;

    x.sendMedia(e, "jpg");
});

bot.on(":animation", (e) => {
    if(checkVen(e)) return Media.upload(e, "gif");
    const x = User.findById(e.from!.id);
    if(!x) return;

    x.sendMedia(e, "gif.mp4");
});

bot.on(":video", (e) => {
    if(checkVen(e)) return Media.upload(e, "video");
    const x = User.findById(e.from!.id);
    if(!x) return;

    x.sendMedia(e, "mp4");
});

// bot.on(':animation', (e) => Media.upload(e, "gif"));
// bot.on(':video', (e) => Media.upload(e, "video"));


bot.command("register", (e: Context) => User.pre_register(e));

//When the user deletes a message, delete the media from the database
// bot.command("delete", (e: Context) => { if (!checkVen(e)) { return; } Media.delete(e) });

bot.on("edit:media", (e: Context) => {
    e.message?.photo ? e.reply("Du hast ein Bild gelöscht") : null;
    e.message?.animation ? e.reply("Du hast ein GIF gelöscht") : null;
    e.message?.video ? e.reply("Du hast ein Video gelöscht") : null;
});

bot.command("test", (e: Context) => {
    // Get the message the user replied to
    const reply = e.message!.reply_to_message;

    // Get the message ID of the reply and the photo ID of the reply
    const replyId = reply!.message_id;
    const photoId = reply!.photo![0].file_id;

    // Send both ids to the user
    e.reply(`Reply ID: ${replyId}\nPhoto ID: ${photoId}`);
})

bot.command("testdelete", (e: Context) => {
    const reply = e.message!.reply_to_message;
    const replyId = reply!.message_id;
    bot.api.deleteMessage(e.chat!.id, replyId);
    e.reply("Deleted");
});

// bot.start({drop_pending_updates: process.env.DROP_PENDING_UPDATES === "true", onStart: () => {admins.forEach(VenID => bot.api.sendMessage(VenID, "Bot started"))}});
bot.start({ drop_pending_updates: true, onStart: () => console.log("Bot Started") });
bot.catch(err => {
    console.error(err);
    process.exit(1);
});

bot.callbackQuery("register_accept", (e) => {
    User.register(e);
    e.answerCallbackQuery("✅ Registered");
});

bot.callbackQuery("register_cancel", (e) => {
    e.answerCallbackQuery("🚫 Cancelled");
})

bot.callbackQuery("optin_accept", (e) => User.optin(e));
bot.callbackQuery("optin_cancel", (e) => User.optout(e));
bot.callbackQuery("optin_decline", (e) => User.optin_decline(e));

// * Is working
bot.command("info", (e) => User.getUserInfo(e));

bot.command("delete", (e: Context) => { 
    if (!checkVen(e)) { 
        const x = User.findById(e.from!.id);
        if(!x) return;
        x.deleteMedia(e); 
    }
    

    User.findById(e.from!.id)?.deleteMedia(e);

 });

 bot.command("gettingstarted", (e) => {
    e.reply(User.getAnleitung(), { parse_mode: "HTML" });
 });

bot.command("view", (e) => {
    const x = User.findById(e.from!.id);
    if(!x) return;

    x.viewMedia();
})


bot.command("tos", (e) => {
    e.reply(User.getTOS(), { parse_mode: "HTML" });
})
bot.command("submit", (e) => {
    const msg = e.message?.text;
    if (msg?.toLocaleLowerCase().startsWith("/submit start"))
    {
      e.reply("Not implemented yet");   
    }
    else if (msg?.toLocaleLowerCase().startsWith("/submit confirm"))
    {
        const user = User.findById(e.from!.id);
        if (!user) return e.reply("You are not registered");
        user.submit(e);
    }
    else if (msg?.toLocaleLowerCase().startsWith("/submit cancel"))
    {
        const user = User.findById(e.from!.id);
        if (!user) return e.reply("You are not registered");
        user.clearCache();
    }
    else e.reply(`
    Invalid command. Use one of the following:
    ${ false ? "<code>/submit start</code> to start caching media" : ""}
    <code>/submit confirm</code> to send your cached media
    <code>/submit cancel</code> to discard your cached media

    If you did a mistake for one media, you can just reply to it with <code>/delete</code> and it will be removed from the cache.
    `, { parse_mode: "HTML" });
});

bot.api.setMyCommands([
    { command: "ping", description: "Ping the bot" },
    { command: "version", description: "Get the version of the bot" },

    // {command: "---USER---", description: "Anything under this line is for users"},

    { command: "register", description: "Register yourself for the bot" },
    { command: "info", description: "Get information about your profile" },
    { command: "submit", description: "(start/confirm/cancel) Submit/Cancels your cached pics. `/submit start` to start caching" },
    { command: "status", description: "Get the status of your media" },
    { command: "gettingstarted", description: "Get the status of your media" },

    // {command: "", description: "Anything under this line is for admins only"},

    { command: "caption", description: "Add a caption to a media" },
    { command: "sendman", description: "Send a random media" },
    { command: "setchristmas", description: "Enable Christmas mode" },
    { command: "setnewyear", description: "Enable NewYear mode" },
    { command: "setnormal", description: "Disable Christmas/NewYear mode" },
    { command: "whichtime", description: "Get the current time mode" },
    { command: "debug", description: "Set debug mode (only admins)" },
]);

s.scheduleJob("0 * * * *", () => {
    if(process.env.NODE_ENV === "development") return;
    let timeout = isChristmas() ? 5000 : 0;
    
    setTimeout(() => {
        let mode = SpecialTime.getMode().toLocaleLowerCase() as directories;
        Media.send(mode);
    }, timeout);
});



s.scheduleJob("30 * * * *", () => {
    if(isDev()) return;
    if(!isChristmas()) return;
    
    let mode = SpecialTime.getMode().toLocaleLowerCase() as directories;
    Media.send(mode);
});

//Send a picture every hour

process.on('uncaughtException', (err: any) => {
    console.log(err);
    ReportError(err, true);
    process.kill(process.pid, 'SIGINT');
});

export const checkVen = (e: Context) => admins.includes(e.chat?.id || -1);

function isChristmas() {
    let date = new Date();
    return date.getMonth() === 11 && date.getDate() > 24 && date.getDate() < 27;
}

export function isDev()
{
    return process.env.NODE_ENV === "development";
}
