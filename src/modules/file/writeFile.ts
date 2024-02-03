import fs from "fs";
import http from "http";

export function writeFile(file: fs.WriteStream, response: http.IncomingMessage): Promise<void> {
    return new Promise((resolve, reject) => {
        response.pipe(file);
        let hasData = false;

        response.on("data", (chunk) => {
            if(chunk?.length > 0) hasData = true;
        });


        file.on("finish", () => {
            if(!hasData) return reject(new Error("File is empty"));
            resolve();
        })

        file.on("error", (err) => {
            reject(err);
            });
    })
}
