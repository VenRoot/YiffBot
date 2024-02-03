import fs from "fs";

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