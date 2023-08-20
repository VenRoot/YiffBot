import { Context } from "grammy";
import { InputFile } from "grammy";
import { PhotoSize, Animation, Video } from "@grammyjs/types"
import path from "path";
import { bot, checkVen } from ".";
import { SpecialTime } from "./special";
import fs from "fs";
import https from "https";
import { media, directories } from "./interface";
import ModMed from "./ModMed";
import { admins, groups } from "../data/secrets.json";

export default class Media {
    /**
    * Uploads media to the appropriate directory based on the current special time mode.
    * Supports photos, GIFs, and videos.
    * @param {Context} ctx - The Telegraf context object.
    * @param {string} mediaType - The type of media being uploaded, either "photo", "gif", or "video".
    * @throws Will throw an error if the media is not provided or if the file size exceeds the maximum allowed size.
    */
    static async upload(ctx: Context, mediaType: "photo" | "gif" | "video") {
        if (!checkVen(ctx)) return;

        let directory: directories = "normal";
        if (SpecialTime.getMode() === "Christmas") directory = "christmas";
        else if (SpecialTime.getMode() === "NewYear") directory = "newyear";

        let media: PhotoSize | Animation | Video | undefined;
        let extension: string;
        let PID: string;

        switch (mediaType) {
            case "photo":
                media = ctx.message!.photo![ctx.message!.photo!.length - 1];
                extension = "jpg";
                break;
            case "gif":
                media = ctx.message?.animation;
                extension = "gif.mp4";
                break;
            case "video":
                media = ctx.message?.video;
                extension = "mp4";
                break;
            default:
                throw new Error(`Invalid media type provided: ${mediaType}`);
        }


        if (media === undefined) throw new Error(`No ${mediaType} provided`);
        if (media.file_size && media.file_size > 20000000) return ctx.reply(`${mediaType.toUpperCase()} is too big`);

        const jsonPath = path.join(__dirname, "..", "data", "media.json");
        const jsonData = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as MediaItem[] : [];

        for (let i = 0; i < jsonData.length; i++) {
            if (jsonData[i].uniqueFileId === media.file_unique_id) {
                //Check if the messageID is in the chat and not deleted
                try {
                    return ctx.reply("Diese Datei wurde bereits hochgeladen.", { reply_to_message_id: jsonData[i].messageId }).catch(() => {
                      return ctx.reply("Diese Datei wurde bereits hochgeladen, doch die ChatNachricht existiert nicht, wahrscheinlich hat sie ein anderer hochgeladen oder sie wurde gelöscht, keine Ahnung, ich tracke nicht jeden Scheiß, ich heiß nicht Microsoft.");
                    })
                }
                catch (err) {
                    return ctx.reply("Diese Datei wurde bereits hochgeladen, doch die ChatNachricht existiert nicht, wahrscheinlich hat sie ein anderer hochgeladen oder sie wurde gelöscht, keine Ahnung, ich tracke nicht jeden Scheiß, ich heiß nicht Microsoft.");
                }
            }
        }

        PID = media.file_unique_id;

        let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await bot.api.getFile(media.file_id)).file_path}`;
        const file = fs.createWriteStream(path.join(__dirname, "..", "data", "pics", directory, `${PID}.${extension}`));
        if (link === undefined) throw new Error(`Invalid file path for ${mediaType.toUpperCase()}`);
        https.get(link, response => response.pipe(file));


        jsonData.push({ uniqueFileId: PID, messageId: ctx.message!.message_id, type: directory });
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData));

        ctx.reply(`Uploaded ${mediaType.toUpperCase()} to ${directory}`);
    }

    static async howMuch(ctx: Context) {
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
    /**
    * Sendet eine zufällige Datei aus dem angegebenen Verzeichnis an die Gruppe.
    * Wenn die Datei erfolgreich gesendet wurde, wird sie gelöscht.
    * @param {directories} directory - Der Name des Verzeichnisses, aus dem eine Datei gesendet werden soll.
    * @returns {Promise<boolean>} Gibt `true` zurück, wenn eine Datei erfolgreich gesendet wurde, ansonsten `false`.
    */
    static async send(directory: directories) {
        try {
            const media = await this.random(directory);
            if (media === null) return false;
            const modmed = await ModMed.get(media);
            switch (path.extname(media)) {
              case ".jpg":
                await bot.api.sendPhoto(groups[0].id, new InputFile(path.join(__dirname, "..", "data", "pics", directory, media)), { caption: modmed });
                break;
              case ".gif.mp4":
                await bot.api.sendAnimation(groups[0].id, new InputFile(path.join(__dirname, "..", "data", "pics", directory, media)), { caption: modmed });
                break;
              case ".mp4":
                await bot.api.sendVideo(groups[0].id, new InputFile(path.join(__dirname, "..", "data", "pics", directory, media)), { caption: modmed });
                break;
              default:
                console.log(`Ungültiger Dateityp: ${path.extname(media)}`);
                return false;
            }
            if (modmed !== undefined) ModMed.remove(media);
            fs.unlinkSync(path.join(__dirname, "..", "data", "pics", directory, media));
            const jsonPath = path.join(__dirname, "..", "data", "media.json");
            const jsonData = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as MediaItem[] : [];
            for (let i = 0; i < jsonData.length; i++) {
              if (jsonData[i].uniqueFileId === media.split('.')[0]) {
                jsonData.splice(i, 1);
                fs.writeFileSync(jsonPath, JSON.stringify(jsonData));
                break;
              }
            }
            return true;
          } catch (error) {
            admins.forEach(id => bot.api.sendMessage(id, `Fehler beim Senden von Medien: ${error}`));
            return false;
          }
    }

    static async random(directory: directories) {
        try {
            const files = await fs.promises.readdir(path.join(__dirname, "..", "data", "pics", directory));
            if (files.length === 0) {
                admins.forEach(id => bot.api.sendMessage(id, `Ordner ${directory} ist leer`));
                return null;
            }
            if (files.length < 10) {
                admins.forEach(id => bot.api.sendMessage(id, `Achtung! Nur noch ${files.length} Medien im Ordner ${directory}! Bitte nachfüllen`))
            }
            return files[Math.floor(Math.random() * files.length)];
        } catch (error) {
            console.error(`Fehler beim Lesen des Verzeichnisses ${directory}:`, error);
            return null;
        }
    }

    static async delete(ctx: Context) {
        // Prüfen, ob der Befehl als Antwort auf eine Nachricht verwendet wird
    if (!ctx.message?.reply_to_message) {
        await ctx.reply('Antworte bitte auf eine Nachricht, um das Medium zu löschen.');
        return;
      }
    
      // Prüfen, ob die Antwort eine Medien-Nachricht ist
      console.log(ctx.message.reply_to_message.photo?.[0] || ctx.message.reply_to_message.video || ctx.message.reply_to_message.animation)
      if (!(ctx.message.reply_to_message.photo?.[0] || ctx.message.reply_to_message.video || ctx.message.reply_to_message.animation)) {
        await ctx.reply('Die Antwort ist keine Medien-Nachricht.');
        return;
      }
    
      // Die File ID der Medien-Nachricht bekommen
      const media = ctx.message.reply_to_message.photo?.[0] ?? ctx.message.reply_to_message.video ??
        ctx.message.reply_to_message.animation;
    
      if (!media) {
        await ctx.reply('Es konnte kein Medium gefunden werden.');
        return;
      }
    
      // Den Eintrag in media.json finden und entfernen
      const jsonData = fs.existsSync(mediaPath) ? JSON.parse(fs.readFileSync(mediaPath, 'utf-8')) as MediaItem[] : [];
      const index = jsonData.findIndex((item: MediaItem) => item.uniqueFileId === media.file_id);
      console.log(media.file_id)
      if (index !== -1) {
          const type = jsonData[index].type;
  
          // Die Datei aus dem Ordner löschen
          const filePath = path.join(__dirname, '..', 'data', 'pics', type);
  
          // Search for the file
          const file = fs.readdirSync(filePath).find((file) => file.startsWith(jsonData[index].uniqueFileId));
          console.log(file);
          if (!file || fs.existsSync(path.join(filePath, file))) return ctx.reply('Die Datei konnte nicht gefunden werden.');
          fs.unlinkSync(path.join(filePath, file));
  
          jsonData.splice(index, 1);
          fs.writeFileSync(mediaPath, JSON.stringify(jsonData));
      }
      else return ctx.reply('Die Datei konnte nicht gefunden werden.');
      
      ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.reply_to_message!.message_id).catch(() => ctx.reply('Beim Löschen der Nachricht ist ein Fehler aufgetreten.'));
    }
}


const mediaPath = path.join(__dirname, '..', 'data', 'media.json');
interface MediaItem {
    uniqueFileId: string;
    messageId: number;
    type: "christmas" | "newyear" | "normal";
}
