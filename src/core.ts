import {Context} from "grammy";
import _fs from "fs";
import fs from "fs/promises";
import path from "path";
import { databaseService } from "./mariadb";
import { bot, getMode } from "./bot";
import type Secrets from "./secrets.interface";
import { AlreadyExistsError } from "./modules/exceptions";
import  type { Message, Update } from "grammy/types";
import { iModMed } from "./interface";
import config from "./modules/env";

export const checkAdmin = async (userid: number) => {
    if(!userid) return false;
    const user = await databaseService.getData({userid});
    if(user === null) return false;


    console.log(`Found user ${user.userid} in database`);
    return true;
}

export async function notifyAdmins(admins: { userid: number; name: string }[], message: string) {
    for (const admin of admins) {
      try {
        await bot.api.sendMessage(admin.userid, message);
        /* c8 ignore next 3 */
      } catch (err) {
        await bot.api.sendMessage(config.VenID, `Konnte Nachricht an Admin ${admin.name} nicht senden: RawError: ${JSON.stringify(err)}`);
      }
    }
  }

export const isDirectMessage = (e: Context) => e.message?.chat?.type === 'private';

export const ReportError = async (ctx: Context | any) => {
    // if(toVen) bot.api.sendMessage(VenID, JSON.stringify(ctx));
    const admins = await databaseService.getAllData();
    if(!admins) return;
    for(const admin of admins) {
        bot.api.sendMessage(admin.userid, "An Error ocurred: "+JSON.stringify(ctx));
        bot.api.sendMessage(admin.userid, JSON.stringify(new Error().stack));
    }
}

export const saveModMed = async (fileIdWithExt: string, Caption: string) =>
{
    const _path = path.join(__dirname, "..", "data", "modmed.json");
    let x = await fs.readFile(_path);
    let modmed = JSON.parse(x.toString()) as iModMed[];
    modmed.push({file: fileIdWithExt, caption: Caption});
    fs.writeFile(_path, JSON.stringify(modmed)).catch((err) => {
        //Handle error here
    })
}


export function extractCommandArgument(msg: (Message & Update.NonChannel)) {
    return msg.text?.split(" ").slice(1).join(" ");
}

export const checkVen = (e: Context) => e.chat?.id == config.VenID;

/** @throws {AlreadyExistsError | DBError} */
export const addAdmin = async (userid: number, name: string) => {
    if(await databaseService.getData({userid})) throw new AlreadyExistsError("User already exists");
    await databaseService.storeData({userid, name});
}

/** @throws {Error | DBError} */
export const removeAdmin = async (userid: number) => {
    if(!await databaseService.getData({userid})) throw new Error("User does not exist");
    await databaseService.deleteData({userid});
}

let secrets: Secrets | null  = null; 

export const getGroups = async() => {


    const mode = getMode();
    let channel: number;
    let group: number;
    /* c8 ignore next 6 */
    if(mode === "development") {
        channel = config.devChannels.channel.id;
        group = config.devChannels.group.id;
    } else if(mode === "beta") {
        channel = config.betaChannels.channel.id;
        group = config.betaChannels.group.id;
    } else {
        // Return production values if not dev or beta
        channel = config.channels.channel.id;
        group = config.channels.group.id;
    }

    return {
        channel: channel,
	    group: group
    }
}

/* c8 ignore next 5 */
export const getReverseToken = (token: string) => {
    if(token === process.env.BOT_TOKEN_DEV) return "DEV";
    if(token === process.env.BOT_TOKEN_BETA) return "BETA";
    return "PROD";
}