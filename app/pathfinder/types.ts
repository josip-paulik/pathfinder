/**
 * Result of any process that can succeed or fail
 */
export type ProcessResult = {
    isSuccessful: boolean;
    customData?: any;
    errorDetails?: {
        row?: number;
        col?: number;
        errorMessage: string;
    };
}

/**
 * Function that processes a character at a specific position
 */
export type CharacterProcess = (row: number, col: number) => ProcessResult; 