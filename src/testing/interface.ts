export interface iUser {
    id: number;
    pics:{
        pic: string;
        message_id: number;
        approved: boolean;
    }[];
    public_: boolean;
}


export interface iPicDB {
    pic: string;
    path: string;
}


export interface iUserTemp {
    id: string;
    pics?: string[];
    date: Date;
}

export interface Ipicmeta {
    pic: string;
    from_id: number;
}

// Make a new function
