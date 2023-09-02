import * as db from "../mariadb";
import * as core from "../core";
import { Context, Bot } from "grammy";
import { bot } from "..";
// jest.mock("../mariadb", () => ({
//     getData: jest.fn()
// }));

jest.mock("grammy", () => ({
    Bot: jest.fn().mockImplementation(() =>{
        return {
            command: jest.fn(),
            catch: jest.fn(),
            api: {
                setMyCommands: jest.fn(),

                sendMessage: jest.fn(),
                sendPhoto: jest.fn(),
                sendVideo: jest.fn(),
                sendAnimation: jest.fn(),

                getFile: jest.fn(),
            }
        }
    }),
    Context: jest.fn().mockImplementation(() => {

    })
}));

const spyCommand = jest.spyOn(bot, "command");
const spyCatch = jest.spyOn(bot, "catch");

const spySendMessage = jest.spyOn(bot.api, "sendMessage");
const spySendAnimation = jest.spyOn(bot.api, "sendAnimation");
const spySendVideo = jest.spyOn(bot.api, "sendVideo");
const spySendPhoto = jest.spyOn(bot.api, "sendPhoto");

const spyGetFile = jest.spyOn(bot.api, "getFile");
describe("checkAdmin", () => {
    let dbConnectSpy: jest.SpyInstance;

    beforeAll(() => {
        dbConnectSpy = jest.spyOn(db, "getData").mockImplementation((user) => {
            return new Promise<db.User>((resolve, reject) => {
                resolve({
                    userid: 1
                })
            });
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    })

    afterAll(() => {
        dbConnectSpy.mockRestore();
    });
    it("Should return true if the user is an admin in the db", async () => {

        const mockContext: Context = {
            message: {
                from: {
                    id: 1
                }
            }
        } as unknown as Context;

        const admin = await core.checkAdmin(mockContext);

        expect(admin).toBe(true);
    });
});

const x: Partial<Context> = {
    message: {
        from: {
            id: 1
        },
        reply_to_message: {

        },
        photo: {
            
        }
    },
    reply: () => {},

}
