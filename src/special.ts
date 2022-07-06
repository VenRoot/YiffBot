import s from "node-schedule";
import {} from "date-fns";

export const special = {
    Christmas: false,
    NewYear: false
};

//Check if it is christmas
export const isChristmas = (date: Date) => date.getMonth() === 11 && (date.getDate() === 25 || date.getDate() === 26);

//Check if it is new year
export const isNewYear = (date: Date) => date.getMonth() === 11 && date.getDate() === 31;
// export const isNewYear = (date: Date) => (date.getMonth() === 0 && date.getDate() === 1) || (date.getMonth() === 11 && date.getDate() === 31);