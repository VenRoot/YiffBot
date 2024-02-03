// FILEPATH: /home/ven/Projekte/Privat/YiffBot/src/__test__/file.test.ts

import { downloadFile } from '../modules/file';
import fs from 'fs';
import nock from 'nock';
import https from 'https';
jest.mock('fs', () => ({
    ...jest.requireActual("fs"), // Import the actual functions of fs
    writeFileSync: jest.fn(), // Override the actual writeFile function
}));

describe('first', () => { 
    beforeEach(() => {
        jest.spyOn(fs, 'writeFileSync').mockImplementation((path, data) => {
            console.log(`Called writeFileSync with ${data} written to ${path}`);
        });
    })


    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Should call writeFileSync", () => {

        fs.writeFileSync("./test.log", "LogEntry");
        expect(fs.writeFileSync).toHaveBeenCalled();
    });
});