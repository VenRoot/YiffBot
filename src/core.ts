import {Context} from "grammy";
import {bot} from "./index";
import * as secrets from "../secrets.json";
import { getData, connect, storeData, deleteData, getAllData } from "./mariadb";


// export const checkAdmin = (ctx: Context) => {
//     if(ctx.message === undefined) throw "no message";
//     if(ctx.message.from === undefined) throw "no message owner";
//     return ctx.message.from.id === VenID;
// }

export const checkAdmin = async (ctx: Context) => {
    const userid = ctx.message?.from?.id;
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

export const getGroups = () => {
    const mode = getMode();
    let channel: number;
    let group: number;

    if(mode === "development") {
        channel = secrets.devChannels.channel.id;
        group = secrets.devChannels.group.id;
    } else if(mode === "beta") {
        channel = secrets.betaChannels.channel.id;
        group = secrets.betaChannels.group.id;
    } else {
        // Return production values if not dev or beta
        channel = secrets.channels.channel.id;
        group = secrets.channels.group.id;
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

export const getToken = () => {
    const mode = getMode();
    if(mode === "development") return process.env.BOT_TOKEN_DEV as string;
    if(mode === "beta") return process.env.BOT_TOKEN_BETA as string;
    return process.env.BOT_TOKEN as string;
}

export const getMode = () => {
    return process.env.NODE_ENV as "development" | "production" | "beta";
}