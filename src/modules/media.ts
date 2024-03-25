import fs from "fs/promises";
import { GrammyError, InputFile } from "grammy";
import path from "path";
import { bot, getToken } from "../bot";
import { getDataPath, getGroups, notifyAdmins } from "../core";
import type { iModMed, media } from '../interface';
import { special } from '../special';
import * as files from "./file";
import * as downloadFile from "./file/downloadFile";

import config from "./env";
import type { Animation, Message, PhotoSize, Update, Video } from "grammy/types";
import { databaseService } from "../mariadb";
import { EmptyDirectoryError, EmptyFileError, GetFileError, InvalidMediaError, OutOfRetiesError, NoMediaError, InvalidStatusCode } from "./exceptions";

/**
 * 
 * @param directory 
 * @param retries 
 * @returns 
 * @throws {EmptyFileError | EmptyDirectoryError | OutOfRetiesError | DBError}
 */
export const send = async (directory: directories, retries: number = 0): Promise<void> => {

    const basePath = path.join(getDataPath(), "pics", directory);
    let fileIdWithExt = await getRandomMedia(directory);
    if(fileIdWithExt === null) throw new EmptyDirectoryError();
    const groups = await getGroups();
    const mediaPath = path.join(basePath, fileIdWithExt);

    try {
        await files.checkIfValid(mediaPath);
    }
    catch(err) {
        if(retries < 5) return send(directory, retries+1);
        else throw new OutOfRetiesError("Too many retries trying to send media", retries);
    }
    const modmed = await getModMed(fileIdWithExt);
    const extension = path.extname(fileIdWithExt).toLocaleLowerCase();
    switch(extension) {
        case ".jpg": await bot.api.sendPhoto(groups.channel, new InputFile(mediaPath), { caption: modmed }); break;
        case ".gif": await bot.api.sendAnimation(groups.channel, new InputFile(mediaPath), { caption: modmed }); break;
        case ".mp4": await bot.api.sendVideo(groups.channel, new InputFile(mediaPath), { caption: modmed }); break;
        default: 
            console.log(`Nicht unterstütztes Medienformat: ${extension}`); 
            fs.unlink(mediaPath);
            return; // Beende frühzeitig, wenn Format nicht unterstützt wird
    }
    if(modmed) excludeFromModMed(fileIdWithExt);
    fs.unlink(mediaPath);
};

/** @throws {DBError} */
const getRandomMedia = async (dir: directories) => {
    const _path = path.join(getDataPath(), "pics", dir);


    await fs.mkdir(_path, {recursive: true});
    const files = await fs.readdir(_path);

    let admins = await databaseService.getAllData();
    if (!admins.find(admin => admin.userid === config.VenID)) admins.push({ name: "Ven", userid: config.VenID });

    if(files.length === 0) return null;
    
    if(files.length < 10) {
        await notifyAdmins(admins, `Achtung! Nur noch ${files.length} Medien! Bitte nachfüllen`);
    }

    return files[Math.floor(Math.random() * files.length)];
};

/**
 * 
 * @throws {NoMediaError | GrammyError | InvalidStatusCode | HttpError | EmptyFileError}
 */
export const uploadMedia = async (message: (Message & Update.NonChannel), mediaType: MediaType) => {
    let directory = "normal";
    if (special.christmas) directory = "christmas";
    else if (special.newyear) directory = "newyear";


    let mediaObj: PhotoSize | Animation | Video | null = getMediaObject(message, mediaType);

    const PID = mediaObj.file_id;
    const file = await bot.api.getFile(PID);
    const fileExtension = mediaType === "photo" ? "jpg" : (mediaType === "animation" ? "gif" : "mp4");
    const link = `https://api.telegram.org/file/bot${getToken()}/${file.file_path}`;
    const filePath = path.join(getDataPath(), "pics", directory, `${PID}.${fileExtension}`);

    //TODO Extract from function
    await downloadFile.downloadFile(link, filePath);
    await afterSubmission(filePath);
    return null;
};

export type mediaCounts = {
    jpg: number;
    gif: number;
    mp4: number;
};


export const getMediaCount = async () =>
{
    const locs: directories[] =  ["normal", "christmas", "newyear"];
    const dataPath = getDataPath();
    
    const mediaCount = new Map<directories, mediaCounts>();
    const promises = locs.map(async item => {
        await fs.mkdir(path.join(dataPath, "pics", item), {recursive: true})
        let Anzahl = await fs.readdir(path.join(dataPath, "pics", item));

        let med:mediaCounts = {jpg: 0, gif: 0, mp4: 0};
        
        med.gif = Anzahl.filter(x => path.extname(x) == ".gif").length;
        med.jpg = Anzahl.filter(x => path.extname(x) == ".jpg").length;
        med.mp4 = Anzahl.filter(x => path.extname(x) == ".mp4").length;
        mediaCount.set(item, {jpg: med.jpg, gif: med.gif, mp4: med.mp4});

        return;
    });

    await Promise.all(promises);
    return mediaCount;
    
} 


/** @throws {InvalidMediaError} */
export function getAutomaticMediaObject(message: Message) {
    let mediaObj: PhotoSize | Animation | Video | null = null;
    if (message?.photo) {
        mediaObj = message.photo[message?.photo?.length - 1];
    } else if (message?.animation) {
        mediaObj = message.animation;
    } else if (message?.video) {
        mediaObj = message.video;
    } else {
        throw new InvalidMediaError();
    }
    return {media: mediaObj, type: path.extname(mediaObj.file_id).toLocaleLowerCase()};
}

/**
 * 
 * @throws {NoMediaError}
 */
export function getMediaObject(message: Message, mediaType: string) {
    let mediaObj: PhotoSize | Animation | Video;
    if (mediaType === "photo" && message?.photo) {
        mediaObj = message.photo[message?.photo?.length - 1];
    } else if (mediaType === "animation" && message?.animation) {
        mediaObj = message.animation;
    } else if (mediaType === "video" && message?.video) {
        mediaObj = message.video;
    } else {
        throw new NoMediaError(mediaType);
    }
    return mediaObj;
}

/** @throws {EmptyFileError} */
export async function afterSubmission(filePath: string) {
    try {
        await files.checkIfValid(filePath);
    }
    catch(err) {
        await fs.unlink(filePath);
        throw err;
    }
}

const excludeFromModMed = async (Media: string) =>
{
    const dataPath = getDataPath();
    let x = await fs.readFile(path.join(dataPath, "modmed.json"));
    let modmed = JSON.parse(x.toString()) as iModMed[];
    //if the media is not in the modmed list, return
    if(!modmed.some(x => x.file === Media)) return;
    modmed = modmed.filter(x => x.file != Media);
    await fs.writeFile(path.join(dataPath, "modmed.json"), JSON.stringify(modmed));
}

const getModMed = async (fileId: string) =>
{
    const dataPath = getDataPath();
    let x = await fs.readFile(path.join(dataPath, "modmed.json"));
    let modmed = JSON.parse(x.toString()) as iModMed[];
    return modmed.find(x => x.file == fileId)?.caption ?? undefined;
}



export type directories = "christmas" | "newyear" | "normal";
type MediaType  = "photo" | "animation" | "video";

