import {Context} from "grammy";
import fs from "fs";
import path from "path";
import { getData, connect, storeData, deleteData, getAllData } from "./mariadb";
import { bot, getMode } from "./bot";
import type Secrets from "./secrets.interface";


export const checkAdmin = async (userid: number) => {
    if(!userid) return false;
    const user = await getData({userid});
    if(user === null) return false;


    console.log(`Found user ${user.userid} in database`);
    return true;

}

export const ReportError = async (ctx: Context | any) => {
    // if(toVen) bot.api.sendMessage(VenID, JSON.stringify(ctx));
    const admins = await getAllData();
    if(!admins) return;
    for(const admin of admins) {
        bot.api.sendMessage(admin, "An Error ocurred: "+JSON.stringify(ctx));
        bot.api.sendMessage(admin, JSON.stringify(new Error().stack));
    }
}

class AlreadyExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AlreadyExistsError";
    }
}

export const addAdmin = async (userid: number, name: string) => {
    await connect();
    if(await getData({userid})) throw new AlreadyExistsError("User already exists");
    await storeData({userid, name});
}

export const removeAdmin = async (userid: number) => {
    await connect();
    if(!await getData({userid})) throw new Error("User does not exist");
    await deleteData({userid});
}

let secrets: Secrets | null  = null; 

export const getGroups = () => {

    const _secrets = secrets ?? JSON.parse(fs.readFileSync(path.join(__dirname, "..", "secrets.json")).toString()) as Secrets;
    secrets = _secrets;
    const mode = getMode();
    let channel: number;
    let group: number;

    if(mode === "development") {
        channel = _secrets.devChannels.channel.id;
        group = _secrets.devChannels.group.id;
    } else if(mode === "beta") {
        channel = _secrets.betaChannels.channel.id;
        group = _secrets.betaChannels.group.id;
    } else {
        // Return production values if not dev or beta
        channel = _secrets.channels.channel.id;
        group = _secrets.channels.group.id;
    }

    return {
        channel: channel,
	    group: group
    }
}

export const getReverseToken = (token: string) => {
    if(token === process.env.BOT_TOKEN_DEV) return "DEV";
    if(token === process.env.BOT_TOKEN_BETA) return "BETA";
    return "PROD";
}