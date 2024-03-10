import { checkEnvVariables } from "../modules/envs";

describe("checkEnvVariables", () => {
    it("should return true if all env variables are set", () => {
        process.env.DB_HOST = "localhost";
        process.env.DB_USER = "root";
        process.env.DB_PASS = "<PASSWORD>";
        process.env.DB_NAME = "test";
        process.env.DB_PORT = "3306";
        expect(checkEnvVariables()).toBe(true);
    });

    it.skip("should return false if any env variable is missing", () => {
        process.env.DB_HOST = "localhost";
        process.env.DB_USER = "root";
        process.env.DB_PASS = "<PASSWORD>";
        process.env.DB_NAME = "test";
        process.env.DB_PORT = undefined as any;
        expect(checkEnvVariables()).toBe(false);
    });
});

