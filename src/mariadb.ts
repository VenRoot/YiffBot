import mariadb from 'mariadb';

interface User {
    userid: number;
}

if(!process.env.DB_HOST ||
    !process.env.DB_USER ||
    !process.env.DB_PASS ||
    !process.env.DB_NAME || 
    !process.env.DB_PORT) throw new Error("Missing DB env vars");

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    connectionLimit: 50
});

export async function connect() {
    if(!healthCheck())
    {
        throw new Error("Failed to connect to database");
    }
    return pool.getConnection();
}


async function healthCheck() {
    let con: mariadb.PoolConnection | undefined;
    try
    {
        con = await pool.getConnection();
        await con.ping();

        // Check if database exists
        await con.query("CREATE DATABASE IF NOT EXISTS yiffslut");
        await con.query("USE yiffslut");
        await con.query("CREATE TABLE IF NOT EXISTS users (userid BIGINT PRIMARY KEY)");
        return true;
    }
    catch(err)
    {
        //@ts-ignore
        throw new Error(err);
    }
    finally
    {
        if(con) con.release();
    }
}

async function storeData(data: User)
{
    let con: mariadb.PoolConnection | undefined;
    try
    {
        con = await connect();
        let result = await con.query("INSERT INTO users (userid) VALUES (?)", [data.userid]);

    }
    catch(err)
    {
        throw new Error("Failed to store data");
    }
    finally
    {
        if(con) con.release();
    }
}

async function deleteData(query: User)
{
    let con: mariadb.PoolConnection | undefined;
    try
    {
        con = await connect();
        let result = await con.query("DELETE FROM users WHERE userid=?", [query.userid]);
    }
    catch(err)
    {
        throw new Error("Failed to delete data");
    }
    finally
    {
        if(con) con.release();
    }
}

async function getData(query: User)
{
    let con: mariadb.PoolConnection | undefined;
    try
    {
        con = await connect();
        console.log("SELECT * FROM users WHERE userid="+query.userid);
        const result = await con.query<User[]>("SELECT * FROM users WHERE userid=?", [query.userid]);
        console.log(result);
        
        if(result.length === 0) return null;
        return result[0];
    }
    catch(err)
    {

        throw new Error("Failed to get data" + JSON.stringify(err));
    }
    finally
    {
        if(con) con.release();
    }
}

async function getAllData()
{
    const results: number[] = [];
    let con: mariadb.PoolConnection | undefined;
    try
    {
        con = await connect();
        const res = await con.query<User[]>("SELECT * FROM users");
        if(res.length === 0) return null;
        for(const user of res)
        {
            results.push(user.userid);
        }
        return results;
    }
    catch(err)
    {
        throw new Error("Failed to get data");
    }
    finally
    {
        if(con) con.release();
    }
}

export {
    storeData,
    getData,
    deleteData,
    getAllData
}


setTimeout(() => {
    console.log("STARTING HEALTH CHECK");
    console.log(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASS, process.env.DB_NAME, process.env.DB_PORT)
    healthCheck().catch(err => {
        throw new Error("STARTUP: Failed to connect to database" + err)
    })
}, 1000);