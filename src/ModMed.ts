import path from "path";
import fs from "fs";
import { Context } from "grammy";
import { iModMed } from "./interface";
import { checkVen } from ".";

class ModMed
{
    static remove = async (Media: string) => {
        if(!fs.existsSync(path.join(__dirname, "..", "data", "modmed.json"))) fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), "[]");
        let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
        let modmed = JSON.parse(x.toString()) as iModMed[];
        modmed = modmed.filter(x => x.file != Media);
        fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), JSON.stringify(modmed));
    }
    
    static save = async (Media: string, Caption: string) => {
        if(!fs.existsSync(path.join(__dirname, "..", "data", "modmed.json"))) fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), "[]");
        let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
        let modmed = JSON.parse(x.toString()) as iModMed[];
        modmed.push({ file: Media, caption: Caption });
        fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), JSON.stringify(modmed));
    }
    
    static add = async (ctx: Context) => {
        if (ctx.message?.chat.type != "private" && !checkVen(ctx) && ctx.message?.reply_to_message === undefined) return;
        if (ctx.message === undefined) return "no message";
        if (ctx.message.text === undefined) return "no message text";
        if (ctx.message.text.split(" ").length < 2) return "no caption";
        if (ctx.message.reply_to_message === undefined) return "no reply_to_message";
        if (ctx.message.reply_to_message.document === undefined) return "not replying to document";
        let Media = ctx.message.reply_to_message.video?.file_id ?? ctx.message.reply_to_message.animation?.file_id ?? ctx.message.reply_to_message.photo?.[0]?.file_id;
        if (Media === undefined) throw "no media";
        let Caption = ctx.message.text.split(" ").slice(1).join(" ");
        if (Caption != "") ModMed.save(Media, Caption);
    
        ctx.reply(`${Media} wurde ${Caption} hinzugefügt`);
    }

    static get = async (Media: string) => {
        if(!fs.existsSync(path.join(__dirname, "..", "data", "modmed.json"))) fs.writeFileSync(path.join(__dirname, "..", "data", "modmed.json"), "[]");
        let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
        console.log(x);
        let modmed = JSON.parse(x.toString()) as iModMed[];
        return modmed.find(x => x.file == Media)?.caption ?? undefined;
    }
    
}


export default ModMed;
