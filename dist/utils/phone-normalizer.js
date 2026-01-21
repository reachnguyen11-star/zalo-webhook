"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNormalizer = void 0;
/**
 * Normalizes phone numbers to a consistent format
 * - Removes spaces, dashes, parentheses
 * - Converts +84 to 0
 * - Removes country code prefixes
 */
class PhoneNormalizer {
    /**
     * Normalize a phone number to Vietnamese format (0xxxxxxxxx)
     */
    static normalize(phone) {
        if (!phone)
            return '';
        // Remove all non-digit characters except +
        let cleaned = phone.replace(/[^\d+]/g, '');
        // Convert +84 to 0
        if (cleaned.startsWith('+84')) {
            cleaned = '0' + cleaned.slice(3);
        }
        // Convert 84 to 0 (if doesn't start with 0)
        if (cleaned.startsWith('84') && !cleaned.startsWith('840')) {
            cleaned = '0' + cleaned.slice(2);
        }
        // Remove leading 0s if more than one
        cleaned = cleaned.replace(/^0+/, '0');
        return cleaned;
    }
    /**
     * Validate if phone number is valid Vietnamese format
     */
    static isValid(phone) {
        const normalized = this.normalize(phone);
        // Vietnamese phone: 0 + 9-10 digits
        return /^0\d{9,10}$/.test(normalized);
    }
    /**
     * Extract phone number from text (finds first valid phone)
     */
    static extract(text) {
        // Match patterns: +84xxxxxxxxx, 84xxxxxxxxx, 0xxxxxxxxx
        const patterns = [
            /\+84\d{9,10}/,
            /84\d{9,10}/,
            /0\d{9,10}/,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const normalized = this.normalize(match[0]);
                if (this.isValid(normalized)) {
                    return normalized;
                }
            }
        }
        return null;
    }
}
exports.PhoneNormalizer = PhoneNormalizer;
//# sourceMappingURL=phone-normalizer.js.map