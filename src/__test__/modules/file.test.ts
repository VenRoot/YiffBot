// FILEPATH: /home/ven/Projekte/Privat/YiffBot/src/__test__/file.test.ts

import { downloadFile, checkIfValid } from '../../modules/file';
import fs from 'fs/promises';
import * as writeFile from "../../modules/file/writeFile"
import nock from 'nock';
import https from 'https';
import { InvalidStatusCode } from '../../modules/exceptions';
import type { PathLike, Stats } from 'fs';
jest.mock('fs', () => ({
    ...jest.requireActual("fs"), // Import the actual functions of fs
    writeFileSync: jest.fn(), // Override the actual writeFile function
}));


describe("downloadFile", () => {
    describe("success tests", () => {
        
        let writeFileSpy: jest.SpyInstance;

        beforeEach(() => {
            writeFileSpy = jest.spyOn(writeFile, 'writeFile').mockImplementation(async (file, reponse) => Promise.resolve());
        });

        afterEach(() => {
            writeFileSpy.mockRestore();
        });

        afterAll(() => {
            nock.cleanAll();
        })

        it("should download a file", async () => {
            nock("https://www.example.com")
               .get("/test.txt")
               .reply(200, "Hello World!");
            const filePath = "/tmp/test.txt";
            await downloadFile("https://www.example.com/test.txt", filePath);
            expect(writeFileSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('failing tests', () => { 
        describe('http error', () => { 
            
            beforeEach(() => {
                nock("https://www.example.com")
                .get("/test.txt")
                .reply(404, "Not Found");
            });

            afterEach(() => {
                nock.cleanAll();
            });

            it("should throw an error if the http request fails", async () => {
                const filePath = "/tmp/test.txt";
                await expect(downloadFile("https://www.example.com/test.txt", filePath)).rejects.toThrow(InvalidStatusCode);
            });
         });

         describe('writeFile fails', () => { 
            beforeEach(() => {
                nock("https://www.example.com")
                .get("/test.txt")
                .reply(200, "Hello World!");
            });

            afterEach(() => {
                nock.cleanAll();
            });

            it("should throw an error if the writeFile fails", async () => {
                const writeFileSpy = jest.spyOn(writeFile, 'writeFile').mockImplementation(async (file, reponse) => Promise.reject(new Error("WriteFile failed")));
                const filePath = "/tmp/test.txt";
                await expect(downloadFile("https://www.example.com/test.txt", filePath)).rejects.toThrow("WriteFile failed");
            });
          })
     });
});

describe('checkIfValid', () => { 
    describe('success tests', () => {
        let fsStatSpy: jest.SpyInstance;
        beforeAll(() => {
            fsStatSpy = jest.spyOn(fs, "stat").mockImplementation((_path: PathLike) => {
                return new Promise<Stats>((resolve, reject) => {
                    resolve({
                        isFile: () => true,
                        size: 10
                    } as Stats);
                });
            })
        });

        afterAll(() => {
            fsStatSpy.mockRestore();
        });

        it("should return if the file exists and is not empty", async () => {
            const filePath = "/tmp/test.txt";
            await fs.writeFile(filePath, "Hello World!");
            await expect(checkIfValid(filePath)).resolves.toBeUndefined();
        });
    });

    describe('failing tests', () => {
        let statMock: jest.SpyInstance;

    beforeEach(() => {
        statMock = jest.spyOn(fs, 'stat');
    });

    afterEach(() => {
        statMock.mockRestore();
    });

    it('should resolve if file exists, is a file and is not empty', async () => {
        statMock.mockImplementation((path,) => Promise.resolve({
            isFile: () => true,
            size: 10
        }));

        await expect(checkIfValid('filePath')).resolves.toBeUndefined();
    });

    it('should reject if stat returns an error', async () => {
        statMock.mockImplementation((path,) => Promise.reject(new Error('stat error')));

        await expect(checkIfValid('filePath')).rejects.toThrow('stat error');
    });

    it('should reject if path is not a file', async () => {
        statMock.mockImplementation((path) => Promise.resolve({
            isFile: () => false,
            size: 10
        }));

        await expect(checkIfValid('filePath')).rejects.toThrow('Path is not a file');
    });

    it('should reject if file is empty', async () => {
        statMock.mockImplementation((path) => Promise.resolve({
            isFile: () => true,
            size: 0
        }));

        await expect(checkIfValid('filePath')).rejects.toThrow('File is empty');
    });
    });
});