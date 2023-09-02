process.env.DB_HOST = "test";
process.env.DB_USER = "test";
process.env.DB_PASS = "test";
process.env.DB_NAME = "test";
process.env.DB_PORT = "test";

jest.mock("grammy", () => {
    Bot: jest.fn().mockImplementation(() => {
        return {
            command: jest.fn(),
            catch: jest.fn(),
            api: {
                setMyCommands: jest.fn(),
                sendMessage: jest.fn(),
                sendPhoto: jest.fn(),
                sendAnimation: jest.fn(),
                sendVideo: jest.fn(),
                getFile: jest.fn(),
            }
        }
    });
})


import { Bot, BotConfig, Context } from "grammy";