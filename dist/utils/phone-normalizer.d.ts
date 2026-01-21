/**
 * Normalizes phone numbers to a consistent format
 * - Removes spaces, dashes, parentheses
 * - Converts +84 to 0
 * - Removes country code prefixes
 */
export declare class PhoneNormalizer {
    /**
     * Normalize a phone number to Vietnamese format (0xxxxxxxxx)
     */
    static normalize(phone: string): string;
    /**
     * Validate if phone number is valid Vietnamese format
     */
    static isValid(phone: string): boolean;
    /**
     * Extract phone number from text (finds first valid phone)
     */
    static extract(text: string): string | null;
}
//# sourceMappingURL=phone-normalizer.d.ts.map