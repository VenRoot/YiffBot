process.env.DB_HOST = "localhost";
process.env.DB_USER = "root";
process.env.DB_PASS = "<PASSWORD>";
process.env.DB_NAME = "test";
process.env.DB_PORT = "3306";

import "mariadb";
import mariadb from "../__mocks__/mariadb";
import { queryMock, createPool, pingMock, getConnectionMock } from "../__mocks__/mariadb";
import { databaseService } from "../mariadb";


jest.mock("../modules/envs", () => ({
    checkEnvVariables: jest.fn(() => true)
}));

import * as envs from "../modules/envs";





describe('databaseService', () => {
    describe('successful tests', () => { 
        beforeAll(() => {
            queryMock.mockClear();
            createPool.mockClear();
            pingMock.mockClear();
        });
        afterAll(() => {
            queryMock.mockClear();
            createPool.mockClear();
            pingMock.mockClear();
        })

        it("initialConnect should establish a connection", async () => {
            await expect(databaseService.initialConnect()).resolves.toBeDefined();
            expect(pingMock).toHaveBeenCalled();
        });

        it("storeData should insert user data correctly", async () => {
            const userData = { userid: 1, name: "Test User"} as User;
            await databaseService.storeData(userData);
            expect(queryMock).toHaveBeenCalledWith("INSERT INTO users (userid, name) VALUES (?,?)", [userData.userid, userData.name]);
        });

        it("should insert a partial user data correctly", async () => {
            const userData = { userid: 1};
            await databaseService.storeData(userData);
            expect(queryMock).toHaveBeenCalledWith("INSERT INTO users (userid) VALUES (?)", [userData.userid]);
        });

        it("getData should retrieve user data", async () => {
            const userData = { userid: 1, name: "Test User"} as User;
            queryMock.mockResolvedValueOnce([userData]);
            const result = await databaseService.getData({userid: userData.userid});
            expect(result).toEqual(userData);
            expect(queryMock).toHaveBeenCalledWith("SELECT * FROM users WHERE userid = ?", [userData.userid]);
        });

        it("Should delete data correctly", async () => {
            const userData = { userid: 1, name: "Test User"} as User;
            await databaseService.deleteData(userData);
            expect(queryMock).toHaveBeenCalledWith("DELETE FROM users WHERE userid = ?", [userData.userid]);
        });

        it("Should get all users correctly", async () => {
            const userData = [{ userid: 1, name: "Test User"}, { userid: 2, name: "Jane Doe"}, { userid: 3, name: "John Doe"}] as User[];
            queryMock.mockResolvedValueOnce([...userData]);
            const result = await databaseService.getAllData();
            expect(result).toEqual(userData);
            expect(queryMock).toHaveBeenCalledWith("SELECT * FROM users");
        });
    });

    describe('failing tests', () => { 
        describe('Missing environment variables', () => {
            let envSpy: jest.SpyInstance;
            beforeAll(() => {
                process.env.DB_HOST = undefined as any;
                envSpy = jest.spyOn(envs, "checkEnvVariables").mockImplementation(() => false)
            });
            afterAll(() => {
                envSpy.mockRestore();
            });

            it.skip("Should throw an error if DB_HOST is missing", async () => {
                expect(await import("../mariadb")).toThrow();
            });
        });
        describe('getConnection throws an error', () => { 
            beforeAll(() => {
                getConnectionMock.mockImplementation(() => Promise.reject(new Error("Connection failed")));
                queryMock.mockClear();
                createPool.mockClear();
                pingMock.mockClear();
            });
    
            afterAll(() => {
                getConnectionMock.mockClear();
                queryMock.mockClear();
                createPool.mockClear();
                pingMock.mockClear();
            });
    
            
            it("storeData should fail if connection fails", async () => {
                const userData = { userid: 1, name: "Test User"} as User;
                await expect(databaseService.storeData(userData)).rejects.toThrow();
                expect(queryMock).not.toHaveBeenCalled();
            });
            it("getData should fail if connection fails", async () => {
                const userData = { userid: 1, name: "Test User"} as User;
                await expect(databaseService.getData(userData)).rejects.toThrow();
                expect(queryMock).not.toHaveBeenCalled();
            });
            it("deleteData should fail if connection fails", async () => {
                const userData = { userid: 1, name: "Test User"} as User;
                await expect(databaseService.deleteData(userData)).rejects.toThrow();
                expect(queryMock).not.toHaveBeenCalled();
            });
            it("getAllData should fail if connection fails", async () => {
                await expect(databaseService.getAllData()).rejects.toThrow();
                expect(queryMock).not.toHaveBeenCalled();
            });
        });

        describe('ping throws an error', () => {
            beforeAll(() => {
                pingMock.mockImplementation(() => Promise.reject(new Error("Connection failed")));
                queryMock.mockClear();
                createPool.mockClear();
                getConnectionMock.mockImplementation(() => Promise.resolve({ping: pingMock, release: () => {}}));
            });

            afterAll(() => {
                pingMock.mockClear();
                queryMock.mockClear();
                createPool.mockClear();
                getConnectionMock.mockClear();
            });
            it("initialConnect should fail if connection fails", async () => {
                await expect(databaseService.initialConnect()).rejects.toThrow();
                expect(pingMock).toHaveBeenCalled();
            });
        })
    });
})
















interface User {
    userid: number;
    name: string;
}