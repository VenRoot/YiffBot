import fs from "fs";
import { CallbackQueryContext, Context, InlineKeyboard } from "grammy";
import { Animation, PhotoSize, Video } from "grammy/types";
import path from "path";
import https from "https";
import { bot } from ".";
import { userInfo } from "./strings";
const ToS = fs.readFileSync(path.join(__dirname, "phrases", "ToS.txt"), "utf-8");
const PrivacyPolicy = fs.readFileSync(path.join(__dirname, "phrases", "Datenschutzerklärung.txt"), "utf-8");

const MAX_SIZE_IN_MB = 10;

const TEMPLATE_MEDIA: MediaTypes = {
    gifs: 0,
    pics: 0,
    videos: 0
};

class User {
    public id: number;
    public username?: string;
    public karma: number;
    public optedIn: boolean;
    public data: {
        sentMedia: MediaTypes;
        approvedMedia: MediaTypes;
        rejectedMedia: MediaTypes;
        warnings: number;
        banned: boolean;
    }

    public static getTOS() {
        return ToS;
    }

    private getUserCachePath = () => path.join(__dirname, "..", "data", "user_cache", this.id.toString());
    /**
     * @description Will be triggered and reset after the last message of the user 
     * @date 19/03/2023
     * @type {(NodeJS.Timeout | null)}
     * @memberof User
     */
    public sendingTimeout: NodeJS.Timeout | null = null;
    public cacheTimeout: NodeJS.Timeout | null = null;
    public cachedMedia: MediaItem[] = [];

    constructor(id: number, karma = 0, optedIn = false, data = { sentMedia: TEMPLATE_MEDIA, rejectedMedia: TEMPLATE_MEDIA, approvedMedia: TEMPLATE_MEDIA, warnings: 0, banned: false }, username?: string) {
        this.id = id;
        this.karma = karma;
        this.optedIn = optedIn;
        this.data = data;
        this.username = username;

        User.allUsers.push(this);
    }

    private static allUsers: User[] = [];

    public static loadAllUsers(): void {
        try {
            User.startupCheck();
            // const usersFile = fs.readFileSync(path.join(__dirname, "..", "data", "users.json"), "utf-8");
            const users = fs.readdirSync(path.join(__dirname, "..", "data", "users")).map(file => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "users", file), "utf-8")) as User);
            users.forEach(user => user = User.from(user));
            // User.allUsers = users;
            
        } catch (err) {
            console.error(`Fehler beim Laden von Userdaten: ${err}`);
            User.allUsers = [];
        }
    }

    private static startupCheck() {
        const path_dirs = [
            path.join(__dirname, "..", "data", "users"),
            path.join(__dirname, "..", "data", "pics"),
            path.join(__dirname, "..", "data", "pics", "christmas"),
            path.join(__dirname, "..", "data", "pics", "normal"),
            path.join(__dirname, "..", "data", "pics", "newyear"),
            path.join(__dirname, "..", "data", "user_cache"),
        ]
        path_dirs.forEach(path => {
            if(!fs.existsSync(path)) fs.mkdirSync(path);
        });

        const path_files = [
            path.join(__dirname, "..", "data", "media.json"),
            path.join(__dirname, "..", "data", "users.json")
        ]

        try {
            path_files.forEach(__path => {
                let x = fs.readFileSync(__path, "utf-8");
                if(x?.length < 2) fs.writeFileSync(__path, JSON.stringify([] as CacheData | MediaData));
            });
        }
        catch(err) {}

        User.allUsers.forEach(user => {
            const _basePath = path.join(__dirname, "..", "data", "user_cache", user.id.toString());
            let _paths = [path.join(_basePath, "media.json"), path.join(_basePath, "cache.json")];
            console.log(_paths);
            fs.mkdirSync(path.join(__dirname, "..", "data", "user_cache", user.id.toString()), {recursive: true});

            try
            {
                _paths.forEach(path => {
                let x  = fs.readFileSync(path, "utf-8");
                if(x?.length < 2) fs.writeFileSync(path, JSON.stringify([] as CacheData | MediaData));
                });
            }
            catch(e) {
                try
                {
                    _paths.forEach(path => {
                        fs.writeFileSync(path, JSON.stringify([] as CacheData | MediaData), {flag: "wx"});
                    });
                }
                catch(err) {}
            }

        });
    }

    public static findById(id: number): User | undefined {
        return User.allUsers.find(user => user.id === id);
    }

    public save() {
        const index = User.allUsers.findIndex(user => user.id === this.id);
        if (index >= 0) {
            User.allUsers[index] = this;
        } else {
            User.allUsers.push(this);
        }
        // fs.writeFileSync(path.join(__dirname, "..", "data", "users.json"), JSON.stringify(User.allUsers));
        fs.writeFileSync(path.join(__dirname, "..", "data", "users", this.id+".json"), JSON.stringify(this));
        console.log(`User ${this.id} wurde gespeichert.`);
    }

    private getInfo()
    {
        console.log(this.data.approvedMedia);
        console.log(this.data.rejectedMedia);

        const approved_media_count = Object.values(this.data.approvedMedia).reduce((acc, val) => acc + val.length, 0) || 0;
        const rejected_media_count = Object.values(this.data.rejectedMedia).reduce((acc, val) => acc + val.length, 0) || 0;
        const total = approved_media_count + rejected_media_count;
        const ratio = approved_media_count / total;
        const percent = (ratio * 100)?.toFixed(2) || null; 

        let info = userInfo(this.id, this.username, this.karma, approved_media_count, total, percent, this.data, rejected_media_count)

        if(!this.optedIn)
        {
            info = `👤 <b>User Info</b>
🆔 <code>${this.id}</code>
⛔️ Banned: ${this.data.banned ? "Yes" : "No"}
<b>⚠ You are not opted in to the karma system, so we can't show that data! ⚠</b>`;
        }

        return info;       

    }

    public static settings(ctx: Context) {
        if (!ctx.message?.from?.id) return;
        const user = User.findById(ctx.message!.from!.id);
        if (!user) return ctx.reply("You are not registered yet! Please send /register to the bot to register!");

        const inlineKeyboard = new InlineKeyboard()
        .text("🔙 Back", "settings_back")
        .text()
    }

    

    public static pre_register(ctx: Context) {
        if (!ctx.message?.from?.id) return;
        if (User.findById(ctx.message!.from!.id)) return ctx.reply("You are already registered!");

        const inlineKeyboard = new InlineKeyboard()
            .text("✅ I accept", "register_accept").row()
            .text("❌ I do not accept", "register_cancel").row();

        // Add callback buttons to a message
        

        ctx.reply("You are not registered yet! If you want to register, you need to accept the ToS:\n\n"+ToS+"\n\nYou can always read the ToS with /tos", { reply_markup: inlineKeyboard, parse_mode: "HTML" });
        
        ctx.reply("You also may want to read the data privacy policy:\n\nhttps://telegra.ph/YiffBot-Privacy-Policy-05-15", { parse_mode: "HTML" });
    }

    static from(json: User){
        return new User(json.id, json.karma, json.optedIn, json.data, json.username);
      }


      public deleteMedia(ctx: Context) {

        if (!ctx.message?.reply_to_message) {
            ctx.reply('Reply to a message to delete it.');
            return;
          }
        
          // Prüfen, ob die Antwort eine Medien-Nachricht ist
          console.log(ctx.message.reply_to_message.photo?.[0] || ctx.message.reply_to_message.video || ctx.message.reply_to_message.animation)
          if (!(ctx.message.reply_to_message.photo?.[0] || ctx.message.reply_to_message.video || ctx.message.reply_to_message.animation)) {
            ctx.reply('Die Antwort ist keine Medien-Nachricht.');
            return;
          }
        
          // Die File ID der Medien-Nachricht bekommen
          const media = ctx.message.reply_to_message.photo?.[0] ?? ctx.message.reply_to_message.video ??
            ctx.message.reply_to_message.animation;
        
          if (!media) {
            ctx.reply('Es konnte kein Medium gefunden werden.');
            return;
          }
      }

      public getTotalSizes(latestFileSize: number): [number, CacheData, MediaData] {

        const userCachePath = this.getUserCachePath();

        const jsonMediaPath = path.join(userCachePath, "media.json");
        const jsonCachePath = path.join(userCachePath, "cache.json");
        console.log("JSON wird gelesen");
        const cacheData = mergeJSONData(JSON.parse(fs.readFileSync(jsonCachePath, "utf-8")) as CacheData, this.cachedMedia);

        //Scan the total size of any files in the user's cache folder
        const cacheSize = getDirectorySize(userCachePath);

        const mediaData = (JSON.parse(fs.readFileSync(jsonMediaPath, "utf-8")) as MediaData);

        const totalMediaSize = mediaData?.reduce((a, b) => a + b.size, 0) ?? 0;

        return [cacheSize + totalMediaSize + latestFileSize, cacheData, mediaData];        
      }


      public async viewMedia()
      {

        let response = `
📥 Sent Pics: ${this.data.sentMedia.pics}
📥 Sent Videos: ${this.data.sentMedia.videos}
📥 Sent GIFs: ${this.data.sentMedia.gifs}
✅ Approved Pics: ${this.data.approvedMedia.pics}
✅ Approved Videos: ${this.data.approvedMedia.videos}
✅ Approved GIFs: ${this.data.approvedMedia.gifs}
🚫 Rejected Pics: ${this.data.rejectedMedia.pics}
🚫 Rejected Videos: ${this.data.rejectedMedia.videos}
🚫 Rejected GIFs: ${this.data.rejectedMedia.gifs}
`

        const [cachePath, mediaPath] = [path.join(this.getUserCachePath(), "cache.json"), path.join(this.getUserCachePath(), "media.json")];
        const cache = JSON.parse(fs.readFileSync(cachePath, "utf-8")) as CacheData;
        const media = JSON.parse(fs.readFileSync(mediaPath, "utf-8")) as MediaData;

        // ! WIP


      }

      public async sendMedia(ctx: Context, mediaType: "jpg" | "gif.mp4" | "mp4") {
        if (!ctx.message?.from?.id) return;
        const user = User.findById(ctx.message!.from!.id);
        if (!user) return ctx.reply("You are not registered yet! Please send /register to the bot to register!");
    
        // if (!user.optedIn) return ctx.reply("You have not opted in to the karma system yet! Send /karma on to opt in.");
    
        if (user.data.banned) return ctx.reply("You are banned from using the bot!");
    
        if (user.data.warnings >= 3) {
            user.data.banned = true;
            user.save();
            return ctx.reply("You have been banned from using the bot due to excessive warnings.");
        }
    
        let _media: PhotoSize | Animation | Video | undefined;

        switch (mediaType) {
            case "jpg":
                _media = ctx.message!.photo![ctx.message!.photo!.length - 1];
                break;
            case "gif.mp4":
                _media = ctx.message?.animation;
                break;
            case "mp4":
                _media = ctx.message?.video;
                break;
            default:
                throw new Error(`Invalid media type provided: ${mediaType}`);
        }

        if (!_media) return ctx.reply("You need to send an image, document or video.");
        if (_media.file_size && _media.file_size > 20000000) return ctx.reply(`${mediaType.toUpperCase()} is too big`);
    
        // Save the media and update user data
        const [size, cacheData, mediaData] = this.getTotalSizes(_media.file_size ?? 0);
        if(size / (1024 * 1024) >= MAX_SIZE_IN_MB) return ctx.reply("🚫 You have reached the maximum stash+cache size of "+MAX_SIZE_IN_MB+"MB, your last media (the one I'm replying to) was discarded. Please delete some files from your cache with <code>/delete</code> as a reply to continue 🗑️ or wait for your submitted pictures to be processed\n\n<b>Please note that just deleting files won't delete them from the cache, you need to reply to them with <code>/delete</code> as I have no way to detect message deletion yet</b>", { parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});        

        for (let i = 0; i < cacheData.length; i++) {
            if (cacheData[i].fileId === _media.file_id) {
                //Check if the messageID is in the chat and not deleted
                try {
                    return ctx.reply("⚠You already uploaded your media here: ", { reply_to_message_id: cacheData[i].messageId });
                }
                catch (err) {
                    return ctx.reply("You already uploaded the file, but the Message doesn't exist anymore, idk, can't find it, deleted or smth, idk, I don't track any shit, my name's not Microsoft.");
                }
            }
        }

        for(let i = 0; i < mediaData.length; i++) {
            if(mediaData[i].fileId === _media.file_id) {
                try {
                    return ctx.reply("⚠You already uploaded your media here: ", { reply_to_message_id: mediaData[i].messageId });
                }
                catch (err) {
                    return ctx.reply("You already uploaded the file, but the Message doesn't exist anymore, idk, can't find it, deleted or smth, idk, I don't track any shit, my name's not Microsoft.");
                }
            }
        }


        let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(_media.file_id)).file_path}`;
        const file = fs.createWriteStream(path.join(this.getUserCachePath(), `${_media.file_id}.${mediaType}`));
        if(link === undefined) return ctx.reply("Something went wrong, please try again later.");
        https.get(link, (response) => response.pipe(file));

        cacheData.push({ fileId: _media.file_id, messageId: ctx.message!.message_id, type: mediaType, size: _media.file_size || 0 });        
        this.cachedMedia = cacheData;

        const previousTimeout = user.sendingTimeout;
        if (previousTimeout) clearTimeout(previousTimeout);
        const jsonCachePath = path.join(this.getUserCachePath(), "cache.json");

        user.sendingTimeout = setTimeout(() => {
            // fs.writeFileSync(jsonCachePath, JSON.stringify(cacheData));
            const media = JSON.parse(fs.readFileSync(jsonCachePath, "utf-8")) as MediaItem[];
            const result = mergeJSONData(media, this.cachedMedia);
            fs.writeFileSync(jsonCachePath, JSON.stringify(result));
            this.cachedMedia = [];
            ctx.reply(`
🎉 Thank you for sharing your media! You've uploaded <b>${cacheData.length}</b> files so far and have <b>${(MAX_SIZE_IN_MB - ((size + (_media?.file_size || 0)) / (1024 * 1024))).toFixed(2)}MB</b> left in your cache 💾
You can delete files from your cache by typing <code>/delete</code> with the media in reply. 

⚠PLEASE NOTE THAT JUST DELETING THE MEDIA WON'T DELETE IT FROM THE CACHE, YOU NEED TO REPLY TO IT WITH <code>/delete</code> AS I HAVE NO WAY TO DETECT MESSAGE DELETION YET⚠

You can also view your cache by using the <code>/view</code> command 👀

When you're done, you can type <code>/submit</code> to submit your media to the bot! 🚀🚀🚀

PLEASE NOTE THAT YOUR CACHE WILL BE DELETED AFTER 1 HOUR FROM THE LATEST SUBMISSION IF YOU DON'T SUBMIT YOUR MEDIA TO THE BOT!

`, {parse_mode: "HTML"});
            user.sendingTimeout = null;
            user.cacheTimeout = setTimeout(() => {
                const old = JSON.parse(fs.readFileSync(jsonCachePath, "utf-8")) as CacheData;
                if(old.length > 0)
                {
                    this.cachedMedia = [];
                    fs.writeFileSync(jsonCachePath, "[]");
                    ctx.reply("Your cache has been deleted due to inactivity.");
                }
                
            }, 1000 * 60 * 60 * 1);
        }, 10000);
    }

    public submit(ctx: Context) {
        /**
         * Takes the cached media from both the cache.json file and the memory, picks the messageIDs and saves the chat messages with those IDs, which contain the media.
         * Then, after saving the media to the file system, it merges the new data into media.json
         */

        const userCachePath = this.getUserCachePath();
        const jsonMediaPath = path.join(userCachePath, "media.json");
        const jsonCachePath = path.join(userCachePath, "cache.json");

        const cacheData = JSON.parse(fs.readFileSync(jsonCachePath, "utf-8")) as CacheData;

        const newCacheData = mergeJSONData(cacheData, this.cachedMedia);
        const oldMediaData = JSON.parse(fs.readFileSync(jsonMediaPath, "utf-8")) as MediaData;

        const newMediaData = mergeJSONData(oldMediaData, newCacheData);

        fs.writeFileSync(jsonMediaPath, JSON.stringify(newMediaData));

        this.clearCache();
        return ctx.reply("Your media has been saved! You can now use /view to view your submissions.");
    }

    public view(ctx: Context) {
        bot.api.sendMessage(this.id, "Your media submissions: ");

        
    }

    public static getAnleitung()
    {
        return `
👋 <b>Welcome to the Yiff me~! submission bot</b> (pun intended) 👋
ℹ <i>Getting Started</i>


After you've read the rules thoroughly and found some nice straight yiff media, whether it's images, GIFs, or videos (files are not supported yet), you can send them here. 
They will be temporarily stored in a cache. If you want to discard a single media, you can reply to it with <code>/delete</code> to remove it. 
If you're sure everything is okay, you can submit these files with <code>/submit</code>, or discard them with <code>/submit cancel</code>. 
The channel's admins will review your submissions and either accept or reject them. 
If there is content that clearly violates the rules, you will receive a warning, and in extreme cases, your usage rights may be revoked. 
If the admins like your media, it will soon be featured in the Yiff me~ channel.


<b>Please note that this whole feature is in active development.</b>
`;
    
    }

    public clearCache() { 
        this.cachedMedia = [];
        const userCachePath = this.getUserCachePath();
        fs.writeFileSync(path.join(userCachePath, "cache.json"), "[]");
    }

    public static register(ctx: CallbackQueryContext<Context>) {

        const user = User.findById(ctx.callbackQuery.from.id);
        console.log(ctx.callbackQuery.from.id);
        if (user) return ctx.reply("You are already registered!");

        const newUser = new User(ctx.callbackQuery.from.id);
        newUser.save();

        const inlineKeyboard = new InlineKeyboard()
            .text("✅ Opt in", "optin_accept").row()
            .text("❌ Do not opt in", "optin_decline").row();
        console.log("User registered");

        // Alter the message
        ctx.editMessageText(`
🎉 <b>You are now registered!</b>

Would you like to opt in to the karma system? This allows admins to give you karma points for your submissions. You can then use these points to get your submissions approved faster, to get special thanks and more!

By opting in to the karma system, you allow us to collect the following data (sorted by relevance):
👤 <b>Your Telegram Username</b>
📥 <b>The amount of pictures you've sent</b>
✅ <b>The amount of pictures you've sent that have been approved</b>

You can opt out of the karma system at any time by sending <code>/karma off</code> to the bot.

<b>⚠ Please note we ALWAYS collect your Telegram ID for the bot to function. Your ID will not be displayed anywhere and only used by the bot instance to regocnise you. You can request a deletion of your Telegram ID by deleting your account</b>
         `, { reply_markup: inlineKeyboard, parse_mode: "HTML" });

         ctx.reply("To get more information about how this all works, send /gettingstarted to the bot.");
    }

    public static optin(ctx: CallbackQueryContext<Context>) {
        const user = User.findById(ctx.callbackQuery.from.id);
        if (!user) return ctx.reply("You are not registered yet!");

        if (user.optedIn) return ctx.reply("You are already opted in!");
        user.optedIn = true;
        ctx.callbackQuery.from.username ? user.username = ctx.callbackQuery.from.username : null;
        user.save();
        const inlineKeyboard = new InlineKeyboard().text("🔙 Opt out", "optin_cancel").row();
        ctx.editMessageText("✅ You have opted in to the karma system! You can opt out at any time by sending `/karma off` to the bot.", {reply_markup: inlineKeyboard});
    }

    public static optin_decline(ctx: CallbackQueryContext<Context>) {
        const inlineKeyboard = new InlineKeyboard().text("🔜 Opt in", "optin_accept").row();
        ctx.editMessageText("❌ Alright, we won't collect any data besides your Telegram ID! You can opt in at any time by sending `/karma on` to the bot.", {reply_markup: inlineKeyboard});
    }

    public static sendMedia(ctx: Context) {
        if (!ctx.message?.from?.id) return;
        const user = User.findById(ctx.message!.from!.id);

        if(!user) return ctx.reply("You are not registered yet! Please send /register to the bot to register!");

    }

    public static optout(ctx: CallbackQueryContext<Context>) {
        const user = User.findById(ctx.callbackQuery.from.id);
        if(!user) return ctx.reply("You are not registered yet!");

        user.optedIn = false;
        user.save();
        const inlineKeyboard = new InlineKeyboard().text("↪ Opt back in", "optin_accept").row();

        ctx.editMessageText("❌ You have opted out of the karma system! You can opt in at any time by sending `/karma on` to the bot.\nYou can delete your karma data by sending `/karma delete` to the bot.", {reply_markup: inlineKeyboard} );
    }

    public static getUserInfo(ctx: Context) {
        if (!ctx.message?.from?.id) return;
        const user = User.findById(ctx.message.from.id);
        if (!user) return ctx.reply("You are not registered yet! Please send /register to the bot to register!");

        ctx.reply(user.getInfo(), {parse_mode: "HTML"});
    }

}

export default User;

setTimeout(User.loadAllUsers, 1000);


function getDirectorySize(directoryPath: string, exceptions: string[] = []): number {
    let totalSize = 0;

    if (!fs.existsSync(directoryPath)) {
        return totalSize;
    }

    const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
        if(exceptions.includes(file.split(".")[0])) return;
        if(file.endsWith(".json")) return;
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            totalSize += stats.size;
        } else if (stats.isDirectory()) {
            totalSize += getDirectorySize(filePath);
        }
    });

    return totalSize;
}

type CacheData = MediaItem[];
type MediaData = SubmittedMediaItem[];

interface MediaItem {
    fileId: string;
    messageId: number;
    type: "jpg" | "mp4" | "gif.mp4";
    size: number;
}

interface SubmittedMediaItem extends MediaItem {
    reviewed: boolean;
    approved: boolean;
}

interface MediaTypes {
    pics: number;
    videos: number;
    gifs: number;
}


function mergeJSONData(jsonData1: MediaItem[], jsonData2: MediaItem[]): MediaItem[] {
    const result: MediaItem[] = [];
    const Ids = new Set<string>();
  
    // merge media arrays
    for (const item of [...jsonData1, ...jsonData2]) {
      if (!Ids.has(item.fileId)) {
        Ids.add(item.fileId);
        result.push(item);
      }
    }
    return result;
  }
  