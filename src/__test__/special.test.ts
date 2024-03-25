import { isChristmas, isNewYear } from '../special';

describe('isChristmas', () => { 
    it("Should return true if it is christmas", () => {
        expect(isChristmas(new Date(2020, 11, 25))).toBe(true);
    });

    it("Should return false if it is not christmas", () => {
        expect(isChristmas(new Date(2020, 11, 24))).toBe(false);
    });
});

describe('isNewYear', () => { 
    it("Should return true if it is new year", () => {
        expect(isNewYear(new Date(2020, 11, 31))).toBe(true);
    });

    it("Should return false if it is not new year", () => {
        expect(isNewYear(new Date(2020, 11, 30))).toBe(false);
    });
 })