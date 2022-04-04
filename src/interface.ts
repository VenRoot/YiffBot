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


export interface iUser {
    id: string;
    pics: string[];
    public: boolean;
    approved_pics: string[];
    submitted_pics: number;
};

export interface iUserTemp {
    id: string;
    pics?: string[];
    date: Date;
}

export interface Ipicmeta {
    pic: string;
    from_id: number;
}