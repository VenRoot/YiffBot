process.env.DB_PASS = "xxxx";
process.env.DB_HOST = "xxxx";
process.env.DB_NAME = "xxxx";
process.env.DB_PORT = "xxxx";
process.env.DB_USER = "xxxx";
import * as bot from "../bot";
import "mariadb";
import mariadb from "../__mocks__/mariadb";
import { queryMock, createPool, pingMock, getConnectionMock } from "../__mocks__/mariadb";
jest.spyOn(bot, "getToken").mockImplementation(() => "INVALID");


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
            sendMessage: jest.fn().mockImplementation(async (chatId, text) => {})
        }
    }
}));


jest.mock("../index.ts", () => ({

}));

jest.mock("../core", () => ({
    getToken: jest.fn(),
    ...jest.requireActual("../core")
}));

describe('checkAdmin', () => {
    beforeAll(() => {
        pingMock.mockClear();
        queryMock.mockImplementation(() => Promise.reject()); // Should be implemented for each test
        getConnectionMock.mockClear();
        createPool.mockClear();
    });

    afterAll(() => {
        queryMock.mockClear();
    });

    it("should return true if the user is an admin", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{ userid: -1, name: "Test User" }] as User[]));
        await expect(core.checkAdmin(-1)).resolves.toBe(true);
    });

    it("should return false if the user is not an admin", async () => {
        queryMock.mockImplementation(() => Promise.resolve([] as User[]));
        await expect(core.checkAdmin(-1)).resolves.toBe(false);
    });
    it("should return false if no user is passed", async () => {
        await expect(core.checkAdmin(null as any)).resolves.toBe(false);
    });
});

describe('ReportError', () => {
    let sendMessageSpy: jest.SpyInstance;
    beforeAll(() => {
        sendMessageSpy = jest.spyOn(bot.bot.api, "sendMessage");
        pingMock.mockClear();
        getConnectionMock.mockClear();
        createPool.mockClear();
    });

    afterEach(() => {
        queryMock.mockClear();
        sendMessageSpy.mockClear();
    })

    afterAll(() => {
        sendMessageSpy.mockReset();
    });

    it("should send a message to all admins", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: 1}, {userid: 2}, {userid: 621}] as User[])); // Should be implemented for each test
        await core.ReportError({ chat: { id: 1 } });
        expect(queryMock).toHaveBeenCalled();
        console.warn(sendMessageSpy.mock.calls);
        expect(sendMessageSpy).toHaveBeenCalledTimes(6);
    });

    it("Should still send a message to the owner regardless", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: 1}, {userid: 2}] as User[])); // Should be implemented for each test
        await core.ReportError({ chat: { id: 1 } });
        expect(sendMessageSpy).toHaveBeenCalledTimes(6);
    })
})

interface User {
    userid: number;
    name: string;
}
