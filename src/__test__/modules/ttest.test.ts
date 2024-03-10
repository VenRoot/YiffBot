import nock from "nock";
import http from "http"

import TelegramServer from "telegram-test-api";
import { Bot } from "grammy";
import fs from "fs/promises";
import { Dirent } from "fs";

class MockDirent extends Dirent {
    constructor(name: string, isDirectory = false) {
        super();
        this.name = name;
        this.isDirectory = () => isDirectory;
    }
}

const filesDirent = [
 new MockDirent("test.jpg"),
 new MockDirent("test.gif"),
 new MockDirent("test.mp4")
];

const files = [
    "test.jpg",
    "test.gif",
    "test.mp4"
]

// nock.disableNetConnect();


describe("fs", () => {
    let fsSpy: jest.SpyInstance;

    beforeAll(() => {
        fsSpy = jest.spyOn(fs, "readdir").mockResolvedValue(files as string[] as any);
    });

    afterAll(() => {
        fsSpy.mockRestore();
    });

    it("should read files", async () => {
        const files = await fs.readdir("test");
        expect(files).toEqual(["test.jpg", "test.gif", "test.mp4"]);
    });
});

describe.skip('bot', () => {
    let server: TelegramServer;
    beforeAll(() => {
        server = new TelegramServer({
            host: "localhost",
            port: 9001,
            storage: "RAM",
            protocol: "https",
            storeTimeout: 60
        });
        server.start();
    });

    afterAll(async () => {
        await server.stop();
    })
    it("Should start the bot", async () => {
        const bot = new Bot("INVALID", {
            client: {
                apiRoot: "http://localhost:9001"
            }
        });

        bot.start();
        await bot.api.sendMessage("test", "test");
        expect(true).toBe(true);
    });
})


describe.skip("testing nock disable", () => {
    beforeEach(() => {
        nock("http://jsonplaceholder.typicode.com")
        .filteringPath(path =>{
            return '/';
        })
        .get("/")
        .reply(201);
    })

    it("should be a mock", async () => {   
        
        http.get('http://jsonplaceholder.typicode.com/todos/1', (res) => {
            expect(res.statusCode).toBe(201);
        });
    })
})

describe('ENV', () => { 
    it("Should get the env", () => {
        console.log(process.env.NODE_ENV);
        expect(process.env.NODE_ENV).toBe("test");
    }) 
})