declare namespace NodeJS {
    export interface ProcessEnv {
        BOT_TOKEN: string;
        BOT_TOKEN_BETA: string;
        BOT_TOKEN_DEV: string;
        NODE_ENV: string;
        DROP_PENDING_UPDATES: string;
        CLOSED_BETA: string;

        NORMAL_PICS: string;
        NEWYEAR_PICS: string;
        CHRISTMAS_PICS: string;

        PENDING_PICS: string;
        APPROVED_PICS: string;

        USER_LIST: string;
        
        PIC_DB: string;

        DB_HOST: string;
	    DB_USER: string;
	    DB_PASS: string;
        DB_NAME: string;
        DB_PORT: string;
    }
}