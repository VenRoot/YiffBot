import type {Config} from "jest";

const config: Config = {
    preset: "ts-jest",
    transform: {
        '^.+\\.test.ts$': 'ts-jest',
    },
    collectCoverage: true,
    workerThreads: false,
    rootDir: "./src",
    roots: ["<rootDir>"],
    modulePaths: ["<rootDir>"],
    setupFilesAfterEnv: ["../jest.setup.ts"]
}

export default config;