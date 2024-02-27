import { Context, InputFile } from "grammy";
import { checkAdmin, getGroups, isDirectMessage, notifyAdmins } from "../core";
import fs from "fs";
import path from "path";
import { bot, getToken } from "../bot";
import * as files from "./file"
import type { iModMed, media } from '../interface';
import { isChristmas, isNewYear, special } from '../special';

//@ts-ignore
import {VenID} from "../secrets.json";
import { databaseService } from "../mariadb";
import { Animation, Message, PhotoSize, Update, Video } from "grammy/types";
import { EmptyDirectoryError, EmptyFileError, GetFileError, OutOfRetiesError, PermissionDeniedError } from "./exceptions";

async function handle(e: Context, type: "photo" | "animation" | "video") {
    if(!isDirectMessage(e)) return;

    if(!await checkAdmin(e.message?.from.id ?? -1)) return e.reply("Permission denied");
    if(!e.message) throw new Error();

    uploadMedia(e.message, type);
}

/**
 * 
 * @param directory 
 * @param retries 
 * @returns 
 * @throws {EmptyFileError | EmptyDirectoryError | OutOfRetiesError}
 */
export const send = async (directory: directories, retries: number = 0): Promise<void> => {

    const basePath = path.join(__dirname, "..", "data", "pics", directory);
    let mediaFileName = await getRandomMedia(directory);
    if(mediaFileName === null) throw new EmptyDirectoryError();
    const groups = getGroups();



    const mediaPath = path.join(basePath, mediaFileName);

    try {
        await files.checkIfValid(mediaPath);
    }
    catch(err) {
        if(retries < 5) return send(directory, retries+1);
        else throw new OutOfRetiesError("Too many retries trying to send media");
    }
    const modmed = await getModMed(mediaFileName);
    const extension = path.extname(mediaFileName).toLocaleLowerCase();

    switch(extension) {
        case ".jpg": await bot.api.sendPhoto(groups.channel, new InputFile(mediaPath), { caption: modmed }); break;
        case ".gif": await bot.api.sendAnimation(groups.channel, new InputFile(mediaPath), { caption: modmed }); break;
        case ".mp4": await bot.api.sendVideo(groups.channel, new InputFile(mediaPath), { caption: modmed }); break;
        default: 
            console.log(`Nicht unterstütztes Medienformat: ${extension}`); 
            return; // Beende frühzeitig, wenn Format nicht unterstützt wird
    }
    if(modmed) excludeFromModMed(mediaFileName);
    fs.unlinkSync(mediaPath);
};

const getRandomMedia = async (dir: directories) => {
    const _path = path.join(__dirname, "..", "data", "pics", dir);


    fs.mkdirSync(_path, {recursive: true});
    const files = fs.readdirSync(_path);

    let admins = await databaseService.getAllData() || [{ name: "Ven", userid: VenID}];

    if(files.length < 10) {
        const warningMessage = files.length === 0 ? `Ordner ist leer` : `Achtung! Nur noch ${files.length} Medien! Bitte nachfüllen`;
        await notifyAdmins(admins, warningMessage);
        if(files.length === 0) {
            return null; // Keine Medien vorhanden, frühzeitige Rückkehr
        }
    }

    return files[Math.floor(Math.random() * files.length)];
};

/**
 * 
 * @throws {PermissionDeniedError | GetFileError}
 */
const uploadMedia = async (message: (Message & Update.NonChannel), mediaType: MediaType) => {
    let directory = "normal";
    if (special.christmas) directory = "christmas";
    else if (special.newyear) directory = "newyear";

    if (!await checkAdmin(message?.from.id ?? -1)) throw new PermissionDeniedError();

    let mediaObj: PhotoSize | Animation | Video | null = getMediaObject(mediaType, message);

    if (!mediaObj) {
        throw new Error(`No ${mediaType} given`);
    }


    const PID = mediaObj.file_id;
    const file = await bot.api.getFile(PID).catch(err => {
        throw new GetFileError(`Failed to get ${mediaType}: ${err}`);
    });

    if (!file) return; // Frühes Beenden, wenn beim Abrufen der Datei ein Fehler aufgetreten ist

    const fileExtension = mediaType === "photo" ? "jpg" : (mediaType === "animation" ? "gif" : "mp4");
    const link = `https://api.telegram.org/file/bot${getToken()}/${file.file_path}`;
    const filePath = path.join(__dirname, "..", "data", "pics", directory, `${PID}.${fileExtension}`);

    //TODO Extract from function
    files.downloadFile(link, filePath).then(() => afterSubmission(message, filePath));
};

export const getMediaCount = async () =>
{
    const locs: directories[] =  ["normal", "christmas", "newyear"];
    type mediaCounts = {
        jpg: number;
        gif: number;
        mp4: number;
    }
    const mediaCount = new Map<directories, mediaCounts>();
    locs.forEach(loc => {
        fs.mkdirSync(path.join(__dirname, "..", "data", "pics", loc), {recursive: true});
        let Anzahl = fs.readdirSync(path.join(__dirname, "..", "data", "pics", loc));

        let med:media = {jpg: [], gif: [], mp4: []};
        
        med.gif = Anzahl.filter(x => path.extname(x) == ".gif");
        med.jpg = Anzahl.filter(x => path.extname(x) == ".jpg");
        med.mp4 = Anzahl.filter(x => path.extname(x) == ".mp4");
        mediaCount.set(loc, {jpg: med.jpg.length, gif: med.gif.length, mp4: med.mp4.length});
    });

    return mediaCount;
    
} 

export function getAutomaticMediaObject(message: Message) {
    let mediaObj: PhotoSize | Animation | Video | null = null;
    if (message?.photo) {
        mediaObj = message.photo[message?.photo?.length - 1];
    } else if (message?.animation) {
        mediaObj = message.animation;
    } else if (message?.video) {
        mediaObj = message.video;
    } else {
        throw new Error(`No media given`);
    }
    return mediaObj;
}

export function getMediaObject(mediaType: string, message: Message) {
    let mediaObj: PhotoSize | Animation | Video | null = null;

    if (mediaType === "photo" && message?.photo) {
        mediaObj = message.photo[message?.photo?.length - 1];
    } else if (mediaType === "animation" && message?.animation) {
        mediaObj = message.animation;
    } else if (mediaType === "video" && message?.video) {
        mediaObj = message.video;
    } else {
        throw new Error(`No ${mediaType} given`);
    }
    return mediaObj;
}

function afterSubmission(ctx: Context, filePath: string) {
    files.checkIfValid(filePath).catch(err => {
        if(err instanceof EmptyFileError)
        console.error(err);
        ctx.reply("File is empty... deleting file " + err, {reply_to_message_id: ctx.message?.message_id});
        fs.unlink(filePath, (err) => {
            if(err) { 
                console.error(err);
                ctx.reply("Failed to delete file: " + err, {reply_to_message_id: ctx.message?.message_id});
            }
        });
        throw new EmptyFileError();
    });
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

const getModMed = async (Media: string) =>
{
    let x = fs.readFileSync(path.join(__dirname, "..", "data", "modmed.json"));
    console.log(x);
    let modmed = JSON.parse(x.toString()) as iModMed[];
    return modmed.find(x => x.file == Media)?.caption ?? undefined;
}



type directories = "christmas" | "newyear" | "normal";
type MediaType  = "photo" | "animation" | "video";

