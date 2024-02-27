import fs from "fs";
import path from "path";

import { Context } from "grammy";

import { checkAdmin, extractCommandArgument, isDirectMessage } from "../core";
import { NoCaptionError, NoReplyToDocumentError, NotDirectMessageError, PermissionDeniedError } from "./exceptions";
import { getAutomaticMediaObject, getMediaObject } from "./media";
import { iModMed } from "../interface";

export function add(ctx: Context) {
    if(!isDirectMessage(ctx)) throw new NotDirectMessageError();
    if(!ctx.message?.reply_to_message?.document) throw new NoReplyToDocumentError();
    if(!checkAdmin(ctx.message?.from.id ?? -1)) throw new PermissionDeniedError();

    let Media = getAutomaticMediaObject(ctx.message);
    let Caption = extractCommandArgument(ctx.message);
    if(!Caption || Caption.length === 0) throw new NoCaptionError();

    save(Media.file_id, Caption);
}

async function save(Media: string, Caption: string) {
    const filePath = path.join(__dirname, "..", "data", "modmed.json");
    let x = fs.readFileSync(filePath);
    let modmed = JSON.parse(x.toString()) as iModMed[];
    modmed.push({file: Media, caption: Caption});
    fs.writeFileSync(filePath, JSON.stringify(modmed));
}