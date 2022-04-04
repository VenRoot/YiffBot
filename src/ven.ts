import fs from "fs";
import { Context, InputFile, InlineKeyboard } from "grammy";
import path from "path";
import {Ipicmeta} from "./interface";
import {bot} from "./index";

export const settings = {
    amount: 10
};

fs.readFile(path.join(__dirname, "..", "venSettings.json"), "utf8", (err, data) => {
    
});

export const getPics = async (ctx: Context) =>
{
    if(ctx.from?.id != Number(process.env.VenID)) return;
    const inlineKeyboard = new InlineKeyboard().text("✅", "addpic")
    .text("❌", "removepic");
    for(let i = 0; i < settings.amount; i++)
    {
        let pic = await getRandomMedia();
        let picmeta = await getPicMeta(pic);
        if(picmeta == null) ctx.replyWithPhoto(new InputFile(path.join(__dirname, "..", "tmp_pics", pic)), {reply_markup: inlineKeyboard, caption: pic});
    }
}

//Add the callback from the inline keyboard
bot.callbackQuery("addpic", async (ctx: Context) =>
{
    let caption = ctx.message!.caption;
    //Als nächstes wird gesucht, ob die PicID von der Caption im Array ist. Falls ja, dann prüfe, ob der User Public ist, wenn ja, dann füge das Caption zu einer Liste hinzu. 
    //Wenn der ein Bild sendet, prüft der aus eienr Datei, ob die PicID im Array ist. Wenn ja, dann sende das Pic mit seinen Credits
});

const getRandomMedia = async () =>
{
    const pics = fs.readdirSync(path.join(__dirname, "..", "tmp_pics"));
    return pics[Math.floor(Math.random() * pics.length)];
}

const getPicMeta = async (pic: string) =>
{
    const picmeta = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "picmeta.json"), "utf8")) as Ipicmeta[];
    const result = picmeta.filter(p => p.pic == pic);
    if(result.length == 0) return null;
    return result[0];
}

