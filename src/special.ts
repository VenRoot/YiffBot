import { scheduleJob } from "node-schedule";
import fs from "fs";
import path from "path";

//Check if it is christmas
export const isChristmas = (date: Date) => date.getMonth() === 11 && (date.getDate() === 25 || date.getDate() === 26);

//Check if it is new year
const isNewYear = (date: Date) => date.getMonth() === 11 && date.getDate() === 31;
// export const isNewYear = (date: Date) => (date.getMonth() === 0 && date.getDate() === 1) || (date.getMonth() === 11 && date.getDate() === 31);


export class SpecialTime
{
    private static getFile()
    {
        //Create special.json if it does not exist
        if(!fs.existsSync(path.join(__dirname, "..", "data", "special.json"))) fs.writeFileSync(path.join(__dirname, "..", "data", "special.json"), JSON.stringify({special: "Normal"}));
        const file = fs.readFileSync(path.join(__dirname, "..", "data", "special.json"), "utf-8");
        console.log(`SpecialTime: ${file}`);
        return JSON.parse(file) as {special: "Christmas" | "NewYear" | "Normal"};
    }


    private static setFile = (special: "Christmas" | "NewYear" | "Normal") => fs.writeFileSync(path.join(__dirname, "..", "data", "special.json"), JSON.stringify({special}));
    public static setMode = (special: "Christmas" | "NewYear" | "Normal") => SpecialTime.setFile(special);
    public static getMode = () => SpecialTime.getFile().special;
}



//set timezone to Europe/Berlin
process.env.TZ = "Europe/Berlin";