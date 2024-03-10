import fs from "fs/promises";
import { AnyError, EmptyFileError, NotAFileError } from "../exceptions";

/**
 * 
 * @param filePath The path to the file to check
 * @returns 
 * @description Check if the filePath is a file and not empty
 */
export async function checkIfValid(filePath: string) {

    const stats = await fs.stat(filePath);

    if(!stats.isFile()) throw new NotAFileError();
    if(stats.size === 0) throw new EmptyFileError();
    return;
}