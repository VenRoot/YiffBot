import fs from "fs";
import https from "https";
import { writeFile } from "./writeFile";
import { InvalidStatusCode } from "../exceptions";

export function downloadFile(link: string, filePath: string) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);

        https.get(link, (response) => {
            if(response.statusCode !== 200) {
                return reject(new InvalidStatusCode(link, response.statusCode));
            }
 
            writeFile(file, response).then(resolve).catch((err) => {
                file.close();
                fs.unlink(filePath ,() => reject(err)); // Delete file, since download failed
            })
        }).on("error", (err) => reject(new Error(`Failed to request ${link}: ${err.message}`)))
    })
}

