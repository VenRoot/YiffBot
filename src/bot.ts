import { Bot } from "grammy";

export const getToken = () => {
    const mode = getMode();
    if(mode === "test") return "INVALID";
    if(mode === "development") return process.env.BOT_TOKEN_DEV as string;
    if(mode === "beta") return process.env.BOT_TOKEN_BETA as string;
    return process.env.BOT_TOKEN as string;
}

export const getMode = () => {
    return process.env.NODE_ENV as "development" | "production" | "beta" | "test";
}

export const bot = new Bot(getToken(), process.env.NODE_ENV === "test" ? {
    client: {
        apiRoot: "http://localhost:9001"
    }
} : undefined);