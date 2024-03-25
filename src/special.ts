type Special = typeof special;
export const special = {
    christmas: false,
    newyear: false,
    normal: true
};

//Check if it is christmas
export const isChristmas = (date: Date) => date.getMonth() === 11 && (date.getDate() === 25 || date.getDate() === 26);

//Check if it is new year
export const isNewYear = (date: Date) => date.getMonth() === 11 && date.getDate() === 31;
// export const isNewYear = (date: Date) => (date.getMonth() === 0 && date.getDate() === 1) || (date.getMonth() === 11 && date.getDate() === 31);



export function updateSpecialMode(mode: keyof Special) {
    // Make this a loop so it can be dynamically increased
    Object.keys(special).forEach((key) => {
        const specificKey = key as keyof Special;
        special[specificKey] = false;
    });
    special[mode] = true;
}