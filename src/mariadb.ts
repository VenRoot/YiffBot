import mariadb from 'mariadb';
import { checkEnvVariables } from './modules/envs';
import { DBError } from './modules/exceptions';

interface User {
    userid: number;
    name: string;
}



class DatabaseService implements Disposable {
    private pool: mariadb.Pool;

    constructor(pool: mariadb.Pool) {
        this.pool = pool;
    }

    private async healthCheck() {
        let con: mariadb.PoolConnection | undefined;
        try
        {
            con = await this.pool.getConnection();
            await con.ping();
            con.query("CREATE TABLE IF NOT EXISTS users (userid INT NOT NULL, name VARCHAR(255) NOT NULL, PRIMARY KEY (userid))");
            return true;
        }
        catch(err)
        {
            console.error("Database health check failed:", err);
            return false;
        }
        finally
        {
            con?.release();
        }
    }

    public async initialConnect() {
        const healthy = await this.healthCheck();
        if(!healthy) {
            throw new Error("Failed to connect to database");
        }
        return this.pool.getConnection();
    }
    /** @throws {DBError} */
    public async storeData(data: Partial<User> & {userid: number}): Promise<void> {
        let con: mariadb.PoolConnection | undefined;
        try {
            const con = await this.pool.getConnection();
            data.name 
            ? await con.query("INSERT INTO users (userid, name) VALUES (?,?)", [data.userid, data.name])
            : await con.query("INSERT INTO users (userid) VALUES (?)", [data.userid]);
        }
        catch(err) {
            console.error("Failed to store data:", err);
            throw new DBError(err, "store");
        }
        finally {
            con?.release();
        }
        
    }
    /** @throws {DBError} */
    public async deleteData(query: Partial<User> & {userid: number}) {
        let con: mariadb.PoolConnection | undefined;
        try {
            const con = await this.pool.getConnection();
            await con.query("DELETE FROM users WHERE userid = ?", [query.userid]);
        }
        catch(err) {
            console.error("Failed to delete data:", err);
            throw new DBError(err, "delete");
        }
        finally {
            con?.release();
        }
    }
    /** @throws {DBError} */
    public async getData(query: Partial<User> & {userid: number}): Promise<User | null> {
        let con: mariadb.PoolConnection | undefined;
        try {
            const con = await this.pool.getConnection();
            const result = await con.query<User[]>("SELECT * FROM users WHERE userid = ?", [query.userid]);
            return result.length > 0? result[0] : null;
        }
        catch(err) {
            console.error("Failed to get data:", err);
            throw new DBError(err, "get");
        }
        finally {
            con?.release();
        }
    }
    /** @throws {DBError} */
    public async getAllData() {
        let con: mariadb.PoolConnection | undefined;
        const results: User[] = [];

        try {
            con = await this.pool.getConnection();
            const result = await con.query<User[]>("SELECT * FROM users");
            for (const row of result) {
                results.push(row);
            }
            return results;
        }
        catch(err) {
            console.error("Failed to get data:", err);
            throw new DBError(err, "get");
        }
        finally {
            con?.release();
        }

    }
    /* c8 ignore next 4 */
    [Symbol.dispose] () {
        this.pool.end();
        console.log("Database connection closed");
    }
}

function initializeDatabase() {
    if (!checkEnvVariables()) {
        throw new Error("Missing DB environment variables");
    }

    return mariadb.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT ?? 3306, 10),
        connectionLimit: 50,
        bigIntAsNumber: true,
    });
}


const pool = initializeDatabase();
const databaseService = new DatabaseService(pool);

export default DatabaseService;
export { databaseService };