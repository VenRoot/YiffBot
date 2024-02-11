process.env.DB_PASS = "xxxx";
process.env.DB_HOST = "xxxx";
process.env.DB_NAME = "xxxx";
process.env.DB_PORT = "xxxx";
process.env.DB_USER = "xxxx";
import * as bot from "../bot";
jest.spyOn(bot, "getToken").mockImplementation(() => "test");

import * as db from "../mariadb";


import * as core from "../core";

jest.spyOn(global, "setTimeout").mockImplementation((cb: Function) => {
  return setTimeout(() => {});
});

jest.mock("grammy", () => ({
    Bot: class {
        constructor(token: string) {
        }
        start = jest.fn();
        on = jest.fn();
        api = {
            call: jest.fn(),
            sendMessage: jest.fn().mockImplementation(async (chatId, text) => console.log(chatId, text))
        }
    }
}));


jest.mock("../index.ts", () => ({

}));

jest.mock("../core", () => ({
    getToken: jest.fn(),
    ...jest.requireActual("../core")
}))


describe('checkAdmin', () => {
    let getDataSpy: jest.SpyInstance;
    let connectSpy: jest.SpyInstance;
    beforeAll(() => {
        connectSpy = jest.spyOn(db, "databaseService").mockImplementation(async () => Promise.resolve({
            query: async () => Promise.resolve({
                length: 1,
                rows: [{
                    userid: -1,
                    name: "test",
                }]
            }),
            ...jest.requireActual("mariadb").PoolConnection
        } as mariadb.PoolConnection));

        // getDataSpy = jest.spyOn(db, "getData").mockImplementation(async () => Promise.resolve({
        //     userid: -1,
        //     name: "test",
        // }));
    });

    afterAll(() => {
        // getDataSpy.mockRestore();
        connectSpy.mockRestore();
    });

    it("should return true if the user is an admin", async () => {
        await expect(core.checkAdmin(-1)).resolves.toBe(true);
    });

    it("should return false if the user is not an admin", async () => {
        await expect(core.checkAdmin(1)).resolves.toBe(false);
    });
 })