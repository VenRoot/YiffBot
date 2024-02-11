import { Bot } from "grammy";

export const getToken = () => {
    const mode = getMode();
    if(mode === "development") return process.env.BOT_TOKEN_DEV as string;
    if(mode === "beta") return process.env.BOT_TOKEN_BETA as string;
    return process.env.BOT_TOKEN as string;
}

export const getMode = () => {
    return process.env.NODE_ENV as "development" | "production" | "beta";
}


export const bot = new Bot(getToken());