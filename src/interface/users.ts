export default interface RootObject {
    user_id: number;
    public: boolean;
    pics: Pic[];
  }
  
  interface Pic {
    pic: string;
    message_id: number;
    approved: boolean;
  }