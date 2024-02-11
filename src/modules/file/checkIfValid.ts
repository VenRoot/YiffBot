import fs from "fs";

/**
 * 
 * @param filePath The path to the file to check
 * @returns 
 * @description Check if the filePath is a file and not empty
 */
export async function checkIfValid(filePath: string) {
    return new Promise<void>((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if(err) return reject(err);
            if(!stats.isFile()) return reject("Path is not a file");
            if(stats.size === 0) return reject(new Error("File is empty"));
            resolve();
        })
    })
}