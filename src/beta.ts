import fs from "fs";
import path from "path";

type UserId = number;

class ClosedBeta
{
    private static acceptedUsers: UserId[] = [];
    private static _acceptedUsers: UserId[] = [];

    public static isInBeta = () => process.env.CLOSED_BETA === "true";

    public static add = (user: UserId) => ClosedBeta.acceptedUsers.push(user);
    public static remove = (user: UserId) => ClosedBeta.acceptedUsers = ClosedBeta.acceptedUsers.filter(x => x !== user);
    public static isAccepted = (user: UserId) => ClosedBeta.acceptedUsers.includes(user);

    public static startup = () => {
        ClosedBeta.acceptedUsers = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "beta.json"), "utf8")) as number[];
    }

    public static save = () => {

        fs.writeFileSync(path.join(__dirname, "..", "data", "beta.json"), JSON.stringify(ClosedBeta.acceptedUsers));
        ClosedBeta._acceptedUsers = [...ClosedBeta.acceptedUsers];
    }

    public static checkIfAccepted(user: UserId) {
        if(!ClosedBeta.isAccepted(user)) throw new Error("You are not in the closed beta, you can apply with /register! The bot will notify you when you're accepted!");
        else return true;
    }

    public static handleChange = () =>
    {
        //Compare accepted users with _acceptedUsers
        //If there is a difference, save the new list

        if(ClosedBeta.acceptedUsers.sort().join() === ClosedBeta._acceptedUsers.sort().join()) return;
        ClosedBeta.save();
    }
}