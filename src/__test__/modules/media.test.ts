process.env.DB_PASS = "xxxx";
process.env.DB_HOST = "xxxx";
process.env.DB_NAME = "xxxx";
process.env.DB_PORT = "xxxx";
process.env.DB_USER = "xxxx";

import "mariadb";
import mariadb from "../../__mocks__/mariadb";

import fs from "fs/promises";
import path from "path";
import * as core from "../../core";
import * as envs from "../../modules/envs";
import * as media from "../../modules/media";
import * as bot from "../../bot";

import { queryMock, createPool, pingMock, getConnectionMock } from "../../__mocks__/mariadb";
import { EmptyDirectoryError, EmptyFileError, GetFileError, OutOfRetiesError } from "../../modules/exceptions";
import type { File, Message, Update } from "grammy/types";
import * as downloadFile from "../../modules/file/downloadFile";
import * as checkIfValid from "../../modules/file/checkIfValid";
import * as writeFile from "../../modules/file/writeFile";
import exp from "constants";
import { before } from "node:test";
jest.spyOn(bot, "getToken").mockImplementation(() => "INVALID");

const mediaFiles = [
    "test.jpg",
    "test.gif",
    "test.mp4"
]

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
            sendMessage: jest.fn().mockImplementation(async (chatId, text) => {}),
            sendPhoto: jest.fn().mockImplementation(async (chatId, text) => {}),
            sendAnimation: jest.fn().mockImplementation(async (chatId, text) => {}),
            sendVideo: jest.fn().mockImplementation(async (chatId, text) => {}),
            getFile: jest.fn().mockImplementation(async (fileId) => {
                return { file_path: fileId };
            })
        }
    },
    InputFile: class {
        constructor(file: string) {
        }
    }
}));

jest.mock("../../index.ts", () => ({
    
}));

describe('afterSubmission', () => {
    describe('successful tests', () => {
        let fsStatSpy: jest.SpyInstance;
        let fsUnlinkSpy: jest.SpyInstance;

        beforeAll(() => {
            fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: BigInt(1)} as any);
            fsUnlinkSpy = jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
        });

        afterAll(() => {
            fsStatSpy.mockRestore();
            fsUnlinkSpy.mockRestore();
        });

        it("Should call fs.stat() and fs.readFile() with the correct arguments", async () => {
            await media.afterSubmission("test");
            expect(fsStatSpy).toHaveBeenCalledTimes(1);
            expect(fsUnlinkSpy).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        let fsStatSpy: jest.SpyInstance;
        let fsUnlinkSpy: jest.SpyInstance;

        beforeAll(() => {
            fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: 0} as any);
            fsUnlinkSpy = jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
        });

        afterAll(() => {
            fsStatSpy.mockRestore();
            fsUnlinkSpy.mockRestore();
        });

        it("Should throw an error if the file is empty", async () => {
            await expect(media.afterSubmission("test")).rejects.toThrow(EmptyFileError);
            expect(fsStatSpy).toHaveBeenCalledTimes(1);
            expect(fsUnlinkSpy).toHaveBeenCalledTimes(1);
        });
    });
});

describe('send', () => { 
    describe('successful tests', () => {
       let readdirSpy: jest.SpyInstance;
       let mkdirSpy: jest.SpyInstance;
       let pathJoinSpy: jest.SpyInstance;
       let getGroupsSpy: jest.SpyInstance;
       let fsStatSpy: jest.SpyInstance;
       let readFileSpy: jest.SpyInstance; // Modmed {x: {file: string}[]}
       let writeFileSpy: jest.SpyInstance; // ModmedWrite
       let fsUnlinkSpy: jest.SpyInstance;
       let checkEnvVariableSpy: jest.SpyInstance;
       let sendMessageSpy: jest.SpyInstance;
       let sendPhotoSpy: jest.SpyInstance;
       let sendVideoSpy: jest.SpyInstance;
       let sendAnimationSpy: jest.SpyInstance;
       let notifyAdminsSpy: jest.SpyInstance;

       beforeAll(() => {

        // NO MOCKING, JUST FOR WATCHING
        notifyAdminsSpy = jest.spyOn(core, "notifyAdmins");

        //DB
        pingMock.mockClear();
        queryMock.mockImplementation(() => Promise.reject()); // Should be implemented for each test
        getConnectionMock.mockClear();
        createPool.mockClear();

        //GRAMMY
            sendMessageSpy = jest.spyOn(bot.bot.api, "sendMessage").mockImplementation(() => Promise.resolve(void 0 as any));
            sendPhotoSpy = jest.spyOn(bot.bot.api, "sendPhoto").mockImplementation(() => Promise.resolve(void 0 as any));
            sendVideoSpy = jest.spyOn(bot.bot.api, "sendVideo").mockImplementation(() => Promise.resolve(void 0 as any));
            sendAnimationSpy = jest.spyOn(bot.bot.api, "sendAnimation").mockImplementation(() => Promise.resolve(void 0 as any));

        //FS
        fsUnlinkSpy = jest.spyOn(fs, "unlink").mockImplementation(() => Promise.resolve());
        readFileSpy = jest.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify([]));
        mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);
        writeFileSpy = jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
        fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: BigInt(1)} as any);
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([mediaFiles[0]] as string[] as any);

        //PATH
        pathJoinSpy = jest.spyOn(path, "join").mockReturnValue("test");

            checkEnvVariableSpy = jest.spyOn(envs, "checkEnvVariables").mockImplementation(() => true);
            getGroupsSpy = jest.spyOn(core, "getGroups").mockResolvedValue({channel: 0, group: 0});
       });

       afterAll(() => {
        queryMock.mockClear();
            sendMessageSpy.mockRestore();
            checkEnvVariableSpy.mockRestore();
            readdirSpy.mockRestore();
            mkdirSpy.mockRestore();
            pathJoinSpy.mockRestore();
            getGroupsSpy.mockRestore();
            fsStatSpy.mockRestore();
            readFileSpy.mockRestore();
            writeFileSpy.mockRestore();
            fsUnlinkSpy.mockRestore();

            sendAnimationSpy.mockRestore();
            sendPhotoSpy.mockRestore();
            sendVideoSpy.mockRestore();
            notifyAdminsSpy.mockRestore();
       });

       afterEach(() => {
        sendMessageSpy.mockClear();
        sendPhotoSpy.mockClear();
        sendVideoSpy.mockClear();
        sendAnimationSpy.mockClear();
        
        fsStatSpy.mockClear();
        fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: BigInt(1)} as any);
        readdirSpy.mockRestore();
        fsUnlinkSpy.mockClear();
        
        notifyAdminsSpy.mockClear();
       })

       it("Should send a jpeg file", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
        await media.send("normal");
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([mediaFiles[0]] as string[] as any);
        expect(sendPhotoSpy).toHaveBeenCalledTimes(1);
        expect(sendAnimationSpy).toHaveBeenCalledTimes(0);
        expect(sendVideoSpy).toHaveBeenCalledTimes(0);
       });

       it("Should send a mp4 file", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([mediaFiles[1]] as string[] as any);
        await media.send("normal");
        expect(sendPhotoSpy).toHaveBeenCalledTimes(0);
        expect(sendAnimationSpy).toHaveBeenCalledTimes(1);
        expect(sendVideoSpy).toHaveBeenCalledTimes(0);
       });

       it("Should send a gif file", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([mediaFiles[2]] as string[] as any);
        await media.send("normal");
        expect(sendPhotoSpy).toHaveBeenCalledTimes(0);
        expect(sendAnimationSpy).toHaveBeenCalledTimes(0);
        expect(sendVideoSpy).toHaveBeenCalledTimes(1);
       });
       
       it("Should return nothing if extension is invalid", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue(["test.txt"] as string[] as any);
        await media.send("normal");
        expect(sendPhotoSpy).toHaveBeenCalledTimes(0);
        expect(sendAnimationSpy).toHaveBeenCalledTimes(0);
        expect(sendVideoSpy).toHaveBeenCalledTimes(0);
        expect(fsUnlinkSpy).toHaveBeenCalledTimes(1);
       })

       it("should retry once after checkIfValid fails", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([mediaFiles[0]] as string[] as any);
        fsStatSpy.mockImplementationOnce(() => Promise.reject());
        await media.send("normal");
        expect(readdirSpy).toHaveBeenCalledTimes(2);
        expect(sendPhotoSpy).toHaveBeenCalledTimes(1);
        expect(sendAnimationSpy).toHaveBeenCalledTimes(0);
        expect(sendVideoSpy).toHaveBeenCalledTimes(0);
        expect(fsUnlinkSpy).toHaveBeenCalledTimes(1);
       });

       it("Should retry 5 times and throw an error", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([mediaFiles[0]] as string[] as any);
        fsStatSpy.mockImplementation(() => Promise.reject());
        try {
            await media.send("normal");
        }
        catch(err) {
            expect(err).toBeInstanceOf(OutOfRetiesError);
        }
        expect(readdirSpy).toHaveBeenCalledTimes(6);
        expect(sendPhotoSpy).toHaveBeenCalledTimes(0);
        expect(sendAnimationSpy).toHaveBeenCalledTimes(0);
        expect(sendVideoSpy).toHaveBeenCalledTimes(0);
        expect(fsUnlinkSpy).toHaveBeenCalledTimes(0);
       });

       it("Should notify an admin if there are less than 10 files", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
        const newMediaFiles = [];
        for(let i = 0; i < 8; i++) {
           newMediaFiles.push(mediaFiles[0]);
        }
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([...newMediaFiles] as string[] as any);
        fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: BigInt(1)} as any);

        await media.send("normal");
        expect(sendPhotoSpy).toHaveBeenCalledTimes(1);
        expect(fsStatSpy).toHaveBeenCalledTimes(1); // Says 2 instead of 1 if test above ran
        expect(readdirSpy).toHaveBeenCalledTimes(1);
        expect(sendMessageSpy).toHaveBeenCalledTimes(1);
       });

       it("Should not notify an admin if there are more than 10 files", async () => {
        queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
        const newMediaFiles = [];
        for(let i = 0; i < 12; i++) {
           newMediaFiles.push(mediaFiles[0]);
        }
        readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([...newMediaFiles] as string[] as any);
        await media.send("normal");
        expect(sendMessageSpy).toHaveBeenCalledTimes(0);
       });



    });

    describe("Error handling", () => {
        let readdirSpy: jest.SpyInstance;
        let mkdirSpy: jest.SpyInstance;
        let pathJoinSpy: jest.SpyInstance;
        let getGroupsSpy: jest.SpyInstance;
        let fsStatSpy: jest.SpyInstance;
        let readFileSpy: jest.SpyInstance; // Modmed {x: {file: string}[]}
        let writeFileSpy: jest.SpyInstance; // ModmedWrite
        let fsUnlinkSpy: jest.SpyInstance;
        let checkEnvVariableSpy: jest.SpyInstance;
        let sendMessageSpy: jest.SpyInstance;
        let sendPhotoSpy: jest.SpyInstance;
        let sendVideoSpy: jest.SpyInstance;
        let sendAnimationSpy: jest.SpyInstance;
        let notifyAdminsSpy: jest.SpyInstance;
 
        beforeAll(() => {
 
         // NO MOCKING, JUST FOR WATCHING
         notifyAdminsSpy = jest.spyOn(core, "notifyAdmins");
 
         //DB
         pingMock.mockClear();
         queryMock.mockImplementation(() => Promise.reject()); // Should be implemented for each test
         getConnectionMock.mockClear();
         createPool.mockClear();
 
         //GRAMMY
             sendMessageSpy = jest.spyOn(bot.bot.api, "sendMessage").mockImplementation(() => Promise.resolve(void 0 as any));
             sendPhotoSpy = jest.spyOn(bot.bot.api, "sendPhoto").mockImplementation(() => Promise.resolve(void 0 as any));
             sendVideoSpy = jest.spyOn(bot.bot.api, "sendVideo").mockImplementation(() => Promise.resolve(void 0 as any));
             sendAnimationSpy = jest.spyOn(bot.bot.api, "sendAnimation").mockImplementation(() => Promise.resolve(void 0 as any));
 
         //FS
         fsUnlinkSpy = jest.spyOn(fs, "unlink").mockImplementation(() => Promise.resolve());
         readFileSpy = jest.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify([]));
         mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);
         writeFileSpy = jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
         fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: BigInt(1)} as any);
         readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([mediaFiles[0]] as string[] as any);
 
         //PATH
         pathJoinSpy = jest.spyOn(path, "join").mockReturnValue("test");
 
             checkEnvVariableSpy = jest.spyOn(envs, "checkEnvVariables").mockImplementation(() => true);
             getGroupsSpy = jest.spyOn(core, "getGroups").mockResolvedValue({channel: 0, group: 0});
        });
 
        afterAll(() => {
         queryMock.mockClear();
             sendMessageSpy.mockRestore();
             checkEnvVariableSpy.mockRestore();
             readdirSpy.mockRestore();
             mkdirSpy.mockRestore();
             pathJoinSpy.mockRestore();
             getGroupsSpy.mockRestore();
             fsStatSpy.mockRestore();
             readFileSpy.mockRestore();
             writeFileSpy.mockRestore();
             fsUnlinkSpy.mockRestore();
        });
 
        afterEach(() => {
         sendMessageSpy.mockClear();
         sendPhotoSpy.mockClear();
         sendVideoSpy.mockClear();
         sendAnimationSpy.mockClear();
         
         fsStatSpy.mockClear();
         fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: BigInt(1)} as any);
         readdirSpy.mockRestore();
         fsUnlinkSpy.mockClear();
         
         notifyAdminsSpy.mockClear();
        })
        it("Should throw an error if the directory is empty", async () => {
            queryMock.mockImplementation(() => Promise.resolve([{userid: -1, name: "Test User"}] as User[]));
            readdirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([] as string[] as any);
            fsStatSpy.mockImplementationOnce(() => Promise.reject());
    
            await expect(media.send("normal")).rejects.toBeInstanceOf(EmptyDirectoryError);
            expect(readdirSpy).toHaveBeenCalledTimes(1);
            expect(sendPhotoSpy).toHaveBeenCalledTimes(0);
            expect(sendAnimationSpy).toHaveBeenCalledTimes(0);
            expect(sendVideoSpy).toHaveBeenCalledTimes(0);
            expect(fsUnlinkSpy).toHaveBeenCalledTimes(0);
           });
    })
});

describe('uploadMedia', () => { 

    describe('successful tests', () => { 

        let getFileSpy: jest.SpyInstance;
        let downloadFileSpy: jest.SpyInstance;
        let checkIfValidSpy: jest.SpyInstance;
        beforeEach(() => {
            downloadFileSpy = jest.spyOn(downloadFile, "downloadFile").mockImplementation(() => Promise.resolve());
            checkIfValidSpy = jest.spyOn(checkIfValid, "checkIfValid").mockImplementation(() => Promise.resolve());
            getFileSpy = jest.spyOn(bot.bot.api, "getFile").mockImplementation(() => Promise.resolve({file_path: "INVALID", } as File));
        });

        afterEach(() => {
            downloadFileSpy?.mockRestore();
            checkIfValidSpy?.mockRestore();
            getFileSpy?.mockRestore();
        });


        it("Should download a jpeg", async () =>  {
            const message: (Message & Update.NonChannel) = {
                photo: [{file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0, file_size: 0}],
                chat: {id: 0, type: "private", first_name: "Test"},
                date: Date.now(),
                from: {id: 0, first_name: "Test", is_bot: false},
                message_id: 0,
            }
            await media.uploadMedia(message, "photo");
            expect(downloadFileSpy).toHaveBeenCalledTimes(1);
            expect(downloadFileSpy).toHaveBeenCalledWith("https://api.telegram.org/file/botINVALID/INVALID", path.join(__dirname, "..", "..", "data", "pics", "normal", "INVALID.jpg"));
            expect(true).toBe(true);
        });

        it("Should download a gif", async () =>  {
            const message: (Message & Update.NonChannel) = {
                animation: {file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0, file_size: 0, duration: 0},
                chat: {id: 0, type: "private", first_name: "Test"},
                date: Date.now(),
                from: {id: 0, first_name: "Test", is_bot: false},
                message_id: 0,
            }
            await media.uploadMedia(message, "animation");
            expect(downloadFileSpy).toHaveBeenCalledTimes(1);
            expect(downloadFileSpy).toHaveBeenCalledWith("https://api.telegram.org/file/botINVALID/INVALID", path.join(__dirname, "..", "..", "data", "pics", "normal", "INVALID.gif"));
            expect(true).toBe(true);
        });

        it("Should download a video", async () =>  {
            const message: (Message & Update.NonChannel) = {
                video: {file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0, file_size: 0, duration: 0},
                chat: {id: 0, type: "private", first_name: "Test"},
                date: Date.now(),
                from: {id: 0, first_name: "Test", is_bot: false},
                message_id: 0,
            }
            await media.uploadMedia(message, "video");
            expect(downloadFileSpy).toHaveBeenCalledTimes(1);
            expect(downloadFileSpy).toHaveBeenCalledWith("https://api.telegram.org/file/botINVALID/INVALID", path.join(__dirname, "..", "..", "data", "pics", "normal", "INVALID.mp4"));
            expect(true).toBe(true);
        });
    });

    describe("Error handling", () => {
        let getFileSpy: jest.SpyInstance;

        beforeEach(() => {
            getFileSpy = jest.spyOn(bot.bot.api, "getFile").mockImplementation(() => Promise.resolve({file_path: "INVALID"} as File));
        });

        afterEach(() => {
            getFileSpy?.mockClear();
        });

        afterAll(() => {
            getFileSpy?.mockRestore();
        });

        it("Should throw an error if getMediaObj throws", async () => {
            const message: (Message & Update.NonChannel) = {
                photo: [{file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0, file_size: 0}],
                chat: {id: 0, type: "private", first_name: "Test"},
                date: Date.now(),
                from: {id: 0, first_name: "Test", is_bot: false},
                message_id: 0,
            }
            await expect(media.uploadMedia(message, "INVALID" as any)).rejects.toBeInstanceOf(Error);
        });

        it("Should throw a GetFileError if bot.api.getFile fails", async () => {
            const message: (Message & Update.NonChannel) = {
                photo: [{file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0, file_size: 0}],
                chat: {id: 0, type: "private", first_name: "Test"},
                date: Date.now(),
                from: {id: 0, first_name: "Test", is_bot: false},
                message_id: 0,
            }
            getFileSpy = jest.spyOn(bot.bot.api, "getFile").mockImplementation(() => Promise.reject());
            await expect(media.uploadMedia(message, "photo")).rejects.toBeInstanceOf(GetFileError);
            getFileSpy.mockRestore();
        });
    })
})

describe('getMediaCount', () => { 
    let mkdirSpy: jest.SpyInstance;
    let readdirSpy: jest.SpyInstance;
    
    beforeEach(() => {
        mkdirSpy = jest.spyOn(fs, "mkdir").mockImplementation(() => Promise.resolve(void 0));
        readdirSpy = jest.spyOn(fs, "readdir").mockImplementation((_path) => {
            if(_path.toString().includes("normal")) return Promise.resolve([...mediaFiles] as string[] as any);
            return Promise.resolve([] as string[] as any);
        })
    });

    afterEach(() => {
        mkdirSpy?.mockClear();
        readdirSpy?.mockClear();
    })

    afterAll(() => {
        mkdirSpy?.mockRestore();
        readdirSpy?.mockRestore();
    })

    it('Should return the number of media files', async () => {
        const count = await media.getMediaCount();
        const expectedMap = new Map<directories, mediaCounts>();

        expectedMap.set("normal", {jpg: 1, gif: 1, mp4: 1});
        expectedMap.set("christmas", {jpg: 0, gif: 0, mp4: 0});
        expectedMap.set("newyear", {jpg: 0, gif: 0, mp4: 0});

        expect(count).toEqual(expectedMap);
    });
});


describe("getAutomaticMediaObject", () => {
    it("Should return a photo object", () => {
        const message: (Message & Update.NonChannel) = {
            photo: [{file_id: "INVALID.jpg", file_unique_id: "INVALID", height: 0, width: 0, file_size: 0}],
            chat: {id: 0, type: "private", first_name: "Test"},
            date: Date.now(),
            from: {id: 0, first_name: "Test", is_bot: false},
            message_id: 0,
        }
        const mediaObj = media.getAutomaticMediaObject(message);
        expect(mediaObj).toEqual({media: {file_id: "INVALID.jpg", file_unique_id: "INVALID", height: 0, width: 0, file_size: 0}, type: ".jpg"});
    });
});

interface User {
    userid: number;
    name: string;
}

type mediaCounts = {
    jpg: number;
    gif: number;
    mp4: number;
};

type directories = "christmas" | "newyear" | "normal";
 