/**
 * Formats a name to ensure it starts with "Dr." if it's a doctor's name.
 * @param name The full name to format
 * @returns The formatted name with "Dr." prefix if not already present
 */
export const formatDoctorName = (name: string | null | undefined): string => {
    if (!name) return '';

    const trimmedName = name.trim();
    // Check for "Dr." or "Dr " (case insensitive) at the start
    if (/^dr\.?\s+/i.test(trimmedName)) {
        return trimmedName;
    }

    return `Dr. ${trimmedName}`;
};
