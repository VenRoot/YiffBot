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
    console.log(user !== null);

    if(user !== null) return true;
    return false;
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

export const addAdmin = async (userid: number) => {
    await connect();
    if(await getData({userid})) throw new AlreadyExistsError("User already exists");
    await storeData({userid});
}

export const removeAdmin = async (userid: number) => {
    await connect();
    if(!await getData({userid})) throw new Error("User does not exist");
    await deleteData({userid});
}

export const getGroups = async () => {
    const devMode = process.env.NODE_ENV === "development";

    const channel = devMode ? secrets.devChannels.channel.id : secrets.channels.channel.id;
    const group = devMode ? secrets.devChannels.group.id : secrets.channels.group.id;

    return {
        channel: channel,
	    group: group
    }
}