import {Context, InlineKeyboard} from "grammy";
import {iPicDB, iUserTemp} from "./interface";
import fs from "fs";
import path from "path";
import https from "https";
import {differenceInMinutes} from "date-fns";
import { iUser } from "./interface";
import s from "node-schedule";

import {bot} from "./index";




export const Users: User[] = [];
export const PicDB: iPicDB[] = [];

export class User
{

    public static load()
    {
        const users = fs.readdirSync(path.join(__dirname, "..", "data", "pics", "users.json"));
    }

    public cache: iPicDB[] = [];
    public id: number;
    public pics:{
        pic: string;
        message_id: number;
        approved: boolean;
    }[];
    public public_: boolean;

    constructor(id: number, pics: {pic: string, message_id: number; approved: boolean}[], public_: boolean) { 
        this.id = id;
        this.pics = pics;
        this.public_ = public_;
    }


    /**
     * Adds a picture to the user's list of approved pictures and saves the file to the pending folder. 
     * CTX is the reply to the picture sent by the bot for approval.
     */
    private addApprovedPic(ctx: Context, user_id: number, file_name: string)
    {
        const orig_message = ctx.message?.reply_to_message;
        //Check if message contains a picture
        if(!orig_message?.photo)  return;
        if(!orig_message.photo[0]) return;

        const orig_photos = orig_message.photo;

        const picture  = Users.find(item => item.id === user_id && item.pics.filter(pic => pic.pic === file_name));
        if(!picture) throw new Error("User or pic not found in user list");

        if(picture.pics[0].approved) throw new Error("Pic already approved");
        picture.pics[0].approved = true;
    }

    public static register = (ctx: Context) => {
        const x = new InlineKeyboard()
        .text("Register", "register").row()
        .text("Cancel", "cancel").row();
    }

    private deletePic(message: Context)
    {
        
    }

}

const temp_users:iUserTemp[] = [];
const allowUsers:number[] = [];


export const handleSubmit = (ctx: Context) => 
{
    if(ctx.from !== undefined) return;
    if(ctx.message?.text?.endsWith("/submit")) return UserSend(ctx);
    //Check if the user types "/submit confirm"
    if(ctx.message?.text?.split(" ")[1] === "confirm") return UserSubmit(ctx);
    else ctx.reply("Unknown parameter. Please use \"/submit\" to queue and \"/submit confirm\" to submit your work.");

}

/**
 * @description Grants the user to send pics to the bot. Called after /submit
 * @param ctx 
 * @returns null
 */
export const UserSend = (ctx: Context) => 
{
    if(ctx.from === undefined) return;
    allowUsers.push(ctx.from.id);
    ctx.reply("You can now send pics to suggest to the bot! After you are done, you can submit your work with /submit or cancel your submission with /cancel. All pics will be deleted after 1 hour of inactivity."); 
}

export const UserSubmit = (ctx: Context) =>
{

    //Check if the user types "/submit confirm"
    if(ctx.message?.text?.endsWith("confirm") && ctx.from !== undefined) return;


    if(ctx.from === undefined) return;
    if(allowUsers.includes(ctx.from.id))
    {
        //Remove the id from the allowUsers array
        allowUsers.splice(allowUsers.indexOf(ctx.from.id), 1);

        const pics = temp_users.filter(user => user.id === ctx.from?.id.toString());
        if(pics.length == 0) return ctx.reply("You didn't submit any pics! Please submit your work with /submit after you sent pics. Please send /send to try again! Cancelling...");

        //Remove the id from the current_users array
        temp_users.splice(temp_users.findIndex(item => item.id === ctx.from?.id.toString()), 1);
    }
}

export const UserCancel = (ctx: Context) =>
{
    if(ctx.from === undefined) return;
    if(allowUsers.includes(ctx.from.id))
    {
        CleanPicsFromID(ctx.from.id.toString());
        ctx.reply("Your submission has been cancelled!");

    }
    
}

export const UserSendPics = async (ctx: Context) =>
{
    if(ctx.from === undefined) return;
    if(ctx.message?.photo === undefined) return;
    if(!allowUsers.includes(ctx.from.id)) return;

    //Get index of the user in the temp_users array
    const index = temp_users.findIndex(item => item.id === ctx.from?.id.toString());
    if(index == -1) temp_users.push({id: ctx.from?.id.toString(), pics: [], date: new Date()});

    //Save the photo in the tmp_pics directory
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    let link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${(await ctx.api.getFile(photo.file_id)).file_path}`;
    const file = fs.createWriteStream(path.join(__dirname, "..", "data", "tmp_pics", `${photo.file_id}.jpg`));
    if(link === undefined) throw "invalid file path"
    https.get(link, response => response.pipe(file));
    temp_users[index].pics!.push(ctx.message.photo[0].file_id);
    temp_users[index].date = new Date();
}

export const CheckExpired = () =>
{
    temp_users.forEach(user =>
    {
        if(differenceInMinutes(new Date(), user.date) > 15)
        {
            if(user.pics == undefined) return ;
            CleanPicsFromID(user.id);
            //Notify the user that the submission has been cancelled
            bot.api.sendMessage(user.id, "Your request has expired, because you didn't confirm your request! Please submit your work with /submit after you sent pics. Please send /send to try again!");
        }
    });
}

const CleanPicsFromID = async (id: string) =>
{

    //Get the index of the user in the temp_users array
    const index = temp_users.findIndex(item => item.id === id);

    //IF the user is not found or hasn't requested any pics, no need to proceed
    if(index == -1) return;
    if(temp_users[index].pics?.length == 0) return;

    //Remove the pics from the tmp_pics directory
    temp_users[index].pics!.forEach(pic => fs.unlinkSync(path.join(__dirname, "..", "data", "tmp_pics", `${pic}.jpg`)));

    //Remove the id from the current_users array
    temp_users.splice(index, 1);

    //Remove the id from the allowUsers array
    allowUsers.splice(allowUsers.indexOf(Number(id)), 1);
}


// user.pics.forEach(pic =>
//     {
//         fs.renameSync(path.join(__dirname, "..", "tmp_pics", `${pic}.jpg`), path.join(__dirname, "..", "requested", `${pic}.jpg`));
//     }


s.scheduleJob("*/2 * * * *", CheckExpired);
s.scheduleJob("*/2 * * * *", () => {
    fs.writeFileSync(path.join(__dirname, "..", "data", "tmp_users.json"), JSON.stringify(temp_users));
    fs.writeFileSync(path.join(__dirname, "..", "data", "allow_users.json"), JSON.stringify(allowUsers));
});

//Read the tmp_users.json file and parse it to the temp_users array
if(fs.existsSync(path.join(__dirname, "..", "data", "tmp_users.json"))) temp_users.push(...JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "tmp_users.json")).toString()));

//Read the allow_users.json file and parse it to the allowUsers array
if(fs.existsSync(path.join(__dirname, "..", "data", "allow_users.json"))) allowUsers.push(...JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "allow_users.json")).toString()));