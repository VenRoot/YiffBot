import https from "https";
import http from "http";
import fs from "fs";

export function downloadFile(link: string, filePath: string) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);

        https.get(link, (response) => {
            if(response.statusCode !== 200) {
                return reject(new Error(`Request ${link} Failed with ${response.statusCode}`));
            }
 
            writeFile(file, response).then(resolve).catch((err) => {
                file.close();
                fs.unlink(filePath ,() => reject(err)); // Delete file, since download failed
            })
        }).on("error", (err) => reject(new Error(`Failed to request ${link}: ${err.message}`)))
    })
}




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


