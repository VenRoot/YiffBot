import fs from "fs/promises";
import path from "path";

import { Context } from "grammy";

import { checkAdmin, extractCommandArgument, isDirectMessage } from "../core";
import { NoCaptionError, NoReplyToDocumentError, NotDirectMessageError, PermissionDeniedError } from "./exceptions";
import { getAutomaticMediaObject, getMediaObject } from "./media";
import { iModMed } from "../interface";

export async function add(ctx: Context) {
    if(!isDirectMessage(ctx)) throw new NotDirectMessageError();
    if(!ctx.message?.reply_to_message?.photo && !ctx.message?.reply_to_message?.video && !ctx.message?.reply_to_message?.animation) throw new NoReplyToDocumentError();
    if(!await checkAdmin(ctx.message?.from.id ?? -1)) throw new PermissionDeniedError();

    let Media = getAutomaticMediaObject(ctx.message.reply_to_message);
    let Caption = extractCommandArgument(ctx.message);
    if(!Caption || Caption.length === 0) throw new NoCaptionError();
    await save(Media.media.file_id, Caption);
}

async function save(Media: string, Caption: string) {
    const filePath = path.join(__dirname, "..", "data", "modmed.json");
    const x = await fs.readFile(filePath);
    let modmed = JSON.parse(x.toString()) as iModMed[];
    modmed.push({file: Media, caption: Caption});
    await fs.writeFile(filePath, JSON.stringify(modmed));
}