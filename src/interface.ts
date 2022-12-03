export interface iModMed {
    file: string;
    caption: string;
}

export interface media {
    jpg: string[];
    gif: string[];
    mp4: string[];
}



//USERS
// export interface iUser {
//     user_id: number;
//     public: boolean;
//     pics: {
//         pic: string;
//         message_id: number;
//         approved: boolean;
//     }[];
// }


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