import { PicDB, User, Users } from "./user";
import { iPicDB, iUser } from "./interface";
import fs from "fs";
import crypto from "crypto";

export const readUserPics = async() => {
    const users = JSON.parse(fs.readFileSync(process.env.USER_LIST, "utf8")) as iUser[];
    users.forEach(user => {
        //Add the users to the user list
        const user_ = new User(user.id, user.pics, user.public_);
        Users.push(user_);
    });
}

export const saveUserPics = async() => {
    fs.writeFileSync(process.env.USER_LIST, JSON.stringify(Users, null, 4));

}

export const readPicDB = async() => {
    const pics = JSON.parse(fs.readFileSync(process.env.PIC_DB, "utf8")) as iPicDB[];
    pics.forEach(pic => {
        PicDB.push(pic);
    });
}

export const savePicDB = async() => {
    fs.writeFileSync(process.env.PIC_DB, JSON.stringify(PicDB, null, 4));
}