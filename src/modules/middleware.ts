/**
 * This module is the middleware
 * Between the telegram API Input
 * And the processing of the functions
 * 
 * Every command should get his own handler
 * 
 * As less data should be passed to the functions
 */

import { Context } from "grammy";
import * as modmed from "./modmed";
import { AlreadyExistsError, DBError, InvalidParamsError, MissingParamsError, NoCaptionError, NoMessageError, NoReplyToDocumentError, NotDirectMessageError, PermissionDeniedError } from "./exceptions";
import * as core from "../core";
import * as media from "./media";
import * as special from "../special";

export function caption(ctx: Context) {
    try {
        modmed.add(ctx);
    }
    catch(err) {

        if(err instanceof NoReplyToDocumentError) {
            ctx.reply("Please reply to a media to add it to the caption list");
        }
        else if(err instanceof NotDirectMessageError) {
            ctx.reply("This command can only be used in direct messages");
        }
        else if(err instanceof NoCaptionError) {
            ctx.reply("No caption given");
        }
        else if(err instanceof PermissionDeniedError) {
            ctx.reply("You are not allowed to use this command");
        }
        else {
            core.ReportError(ctx);
            console.error(err);
        }

    }
}

export function start(ctx: Context) {
    ctx.reply("You have to suck @Ventox2 dick now :3");
}

export function sendman(ctx: Context) {
    try {
        if(!ctx.message) throw new NoMessageError();
        const params = core.extractCommandArgument(ctx.message)?.trim() ?? "normal";
        if(params !== "normal" && params !== "christmas" && params !== "newyear") throw new MissingParamsError(`Invalid params. Usage: /sendman <newyear | christmas | normal>? | Your input: ${params}`);
        media.send(params);
    }
    catch(err) {
        if(err instanceof NoMessageError) {
            ctx.reply("No message object recieved-");
        }
        else if(err instanceof PermissionDeniedError) {
            ctx.reply("You are not allowed to use this command");
        }
        else if(err instanceof MissingParamsError) {
            ctx.reply(err.message);
        }
        else {
            core.ReportError(ctx);
            console.error(err);
        }
    }
}

export function sendmannewyear(ctx: Context) {

}

export function ping(ctx: Context) {
    ctx.reply("Pong");
}

export function version(ctx: Context) {
    const version = process.env.VERSION ?? "no version set";
    ctx.reply(`Version: ${version}`);
}

/** @deprecated use setMethod */
export function setChristmas(ctx: Context) {
    throw new Error("Method not implemented.");
}

/** @deprecated use setMethod */
export function setNewYear(ctx: Context) {
    throw new Error("Method not implemented.");
}

/** @deprecated use setMethod */
export function unsetChristmas(ctx: Context) {
    throw new Error("Method not implemented.");
}

/** @deprecated use setMethod */
export function unsetNewYear(ctx: Context) {
    throw new Error("Method not implemented.");
}

export async function setMethod(ctx: Context) {
    try {
        if(!await (core.checkAdmin(ctx.from?.id ?? -1))) throw new PermissionDeniedError();
        if(!ctx.message) throw new NoMessageError();
        const params = core.extractCommandArgument(ctx.message)?.trim() ?? "normal";
        if(params !== "normal" && params !== "christmas" && params !== "newyear") throw new MissingParamsError(`Invalid params. Usage: /setmethod <newyear | christmas | normal>? | Your input: ${params}`);
        special.updateSpecialMode(params);

    }
    catch(err) {
        if(err instanceof PermissionDeniedError) {
            ctx.reply("You are not allowed to use this command");
        }
        else if(err instanceof NoMessageError) {
            ctx.reply("No message object recieved-");
        }
        else if(err instanceof MissingParamsError) {
            ctx.reply(err.message);
        }
        else {
            core.ReportError(ctx);
            console.error(err);
        }
    }
}

export function whichTime(ctx: Context) {
    const now = new Date();
    if(special.isNewYear(now)) return ctx.reply("It's New Year's Eve!");
    if(special.isChristmas(now)) return ctx.reply("It's Christmas!");
    return ctx.reply("It's not Christmas or New Year's Eve!");
}

export async function status(ctx: Context) {
    try {
        if(!await (core.checkAdmin(ctx.from?.id ?? -1))) throw new PermissionDeniedError();
        const howMuch = await media.getMediaCount();
        let message = "Folgende Medien sind vorhanden:\n\n";
        howMuch.forEach((element, key) => {
            message += `${key}-Warteschlange:\n`;
            message += `Bilder: ${element.jpg}\n`;
            message += `GIFs: ${element.gif}\n`;
            message += `MP4: ${element.mp4}\n\n`;
        });

        ctx.reply(message);
    }
    catch(err) {
        if(err instanceof PermissionDeniedError) {
            ctx.reply("You are not allowed to use this command");
        }
        else {
            core.ReportError(ctx);
            console.error(err);
        }
    }

}

export function addAdmin(ctx: Context) {
    try {
        if(!ctx.message) throw new NoMessageError();
        if(!core.isDirectMessage(ctx)) throw new NotDirectMessageError();
        if(!core.checkVen(ctx)) throw new PermissionDeniedError();
        const params = core.extractCommandArgument(ctx.message)?.trim() ?? "normal";
        if(!params) throw new MissingParamsError("Usage: /adduser <ID> <name>");

        const id = params.split(" ")[0];
        const name = params.split(" ").slice(1).join(" ");

        if(!id ||!name) throw new MissingParamsError("Usage: /adduser <ID> <name>");

        if(isNaN(parseInt(id))) throw new InvalidParamsError("ID must be a number");
        core.addAdmin(parseInt(id), name);
    } catch(err) {
        if(err instanceof NoMessageError) {
            ctx.reply("No message object recieved-");
        }
        else if(err instanceof NotDirectMessageError) {
            ctx.reply("This command can only be used in direct messages");
        }
        else if(err instanceof PermissionDeniedError) {
            ctx.reply("You are not allowed to use this command");
        }
        else if(err instanceof MissingParamsError) {
            ctx.reply(err.message);
        }
        else if(err instanceof InvalidParamsError) {
            ctx.reply(err.message);
        }
        else if(err instanceof AlreadyExistsError) {
            ctx.reply(err.message);
        }
        else if(err instanceof DBError) {
            ctx.reply("Error while adding user to database: " + JSON.stringify(err));
        }
        else {
            core.ReportError(ctx);
            console.error(err);
            ctx.reply("Unknown error, informing the developer");
        }
    }
}

export function removeAdmin(ctx: Context) {
    try {
        if(!ctx.message) throw new NoMessageError();
        if(!core.isDirectMessage(ctx)) throw new NotDirectMessageError();
        if(!core.checkVen(ctx)) throw new PermissionDeniedError();
        const params = core.extractCommandArgument(ctx.message)?.trim() ?? "normal";
        if(!params) throw new MissingParamsError("Usage: /removeuser <ID>");

        const id = params;

        if(!id) throw new MissingParamsError("Usage: /removeuser <ID>");

        if(isNaN(parseInt(id))) throw new InvalidParamsError("ID must be a number");
        core.removeAdmin(parseInt(id));
    } catch(err) {
        if(err instanceof NoMessageError) {
            ctx.reply("No message object recieved-");
        }
        else if(err instanceof NotDirectMessageError) {
            ctx.reply("This command can only be used in direct messages");
        }
        else if(err instanceof PermissionDeniedError) {
            ctx.reply("You are not allowed to use this command");
        }
        else if(err instanceof MissingParamsError) {
            ctx.reply(err.message);
        }
        else if(err instanceof InvalidParamsError) {
            ctx.reply(err.message);
        }
        else if(err instanceof DBError) {
            ctx.reply("Error while removing user from the database: " + JSON.stringify(err));
        }
        else {
            core.ReportError(ctx);
            console.error(err);
            ctx.reply("Unknown error, informing the developer");
        }
    }
}