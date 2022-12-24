import { scheduleJob } from "node-schedule";
import fs from "fs";
import path from "path";
//@ts-ignore
import { groups } from "../data/secrets.json";
import { bot } from ".";
export let special: "Christmas" | "NewYear" | "Normal" = "Normal";

export const setMode = (mode: "Christmas" | "NewYear" | "Normal") =>  {
    special = mode;
}

//Check if it is christmas
export const isChristmas = (date: Date) => date.getMonth() === 11 && (date.getDate() === 25 || date.getDate() === 26);

//Check if it is new year
const isNewYear = (date: Date) => date.getMonth() === 11 && date.getDate() === 31;
// export const isNewYear = (date: Date) => (date.getMonth() === 0 && date.getDate() === 1) || (date.getMonth() === 11 && date.getDate() === 31);


scheduleJob({
    hour: 0,
    minute: 0,
    second: 0
}, () => {
    //Make a new date with Europe/Berlin timezone
    const date = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
    if(date.getTimezoneOffset() === 60) date.setHours(date.getHours() - 1);
    if(date.getTimezoneOffset() === -60) date.setHours(date.getHours() + 1);

    if(isChristmas(date))
    {
        SpecialTime.setMode("Christmas");
        const text = fs.readFileSync("./phrases/christmas.txt", "utf-8");
        bot.api.sendMessage(groups[0].id, text);
        bot.api.sendMessage(groups[3].id, text);
    }
    else if(isNewYear(date))
    {
        SpecialTime.setMode("NewYear");
        const text = fs.readFileSync("./phrases/newyear.txt", "utf-8");
        bot.api.sendMessage(groups[0].id, text);
        bot.api.sendMessage(groups[3].id, text);

    }


});



export class SpecialTime
{
    private static getFile()
    {
        const file = fs.readFileSync(path.join(__dirname, "..", "data", "special.json"), "utf-8");
        return JSON.parse(file) as {special: "Christmas" | "NewYear" | "Normal"};
    }
    private static setFile(special: "Christmas" | "NewYear" | "Normal")
    {
        fs.writeFileSync(path.join(__dirname, "..", "data", "special.json"), JSON.stringify({special}));
    }

    public static setMode(special: "Christmas" | "NewYear" | "Normal")
    {
        SpecialTime.setFile(special);
    }
    public static getMode()
    {
        return SpecialTime.getFile().special;
    }
}



//set timezone to Europe/Berlin
process.env.TZ = "Europe/Berlin";