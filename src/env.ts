declare global {
    namespace NodeJS {
        export interface ProcessEnv {
            BOT_TOKEN: string;
            NODE_ENV: "development" | "production";
            DROP_PENDING_UPDATES: "true" | "false";
            CLOSED_BETA: "true" | "false";
            // Pictures

            NORMAL_PICS: string;
            NEWYEAR_PICS: string;
            CHRISTMAS_PICS: string;
            PENDING_PICS: string;
            APPROVED_PICS: string;
            USER_LIST: string;
            PIC_DB: string;
        }
    }
}

export {};