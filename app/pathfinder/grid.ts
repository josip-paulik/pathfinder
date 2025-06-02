import type { ProcessResult, CharacterProcess } from './types';

export type NeighborPoints = {
    up: string;
    down: string;
    left: string;
    right: string;
}

/**
 * Grid class manages all grid-related operations and activities.
 * It provides a safe interface for:
 * - Accessing grid points
 * - Getting neighboring points
 * - Processing grid contents
 * 
 * The grid uses a coordinate system where:
 * - Row 0 is the top row, increasing downward
 * - Column 0 is the leftmost column, increasing rightward
 * - Empty or out-of-bounds spaces return empty string
 */
export class Grid {
    constructor(private readonly grid: string[][]) {}

    /**
     * Get the character at a given point.
     * Returns empty string for:
     * - Out of bounds coordinates
     * - Space characters
     * - Undefined/null values
     * 
     * @param row - Row index (0-based)
     * @param col - Column index (0-based)
     * @returns character at the point or empty string if invalid
     */
    public getPoint(row: number, col: number): string {
        if (row < 0 || col < 0) {
            return '';
        }

        if (row >= this.grid.length || col >= this.grid[row].length) {
            return '';
        }

        return this.grid[row][col] === ' ' ? '' : this.grid[row][col];
    }

    /**
     * Get all neighboring points for a given position.
     * Returns empty string for invalid neighbors.
     * 
     * Example:
     * ```
     *    up
     * left * right
     *   down
     * ```
     * 
     * @param row - Row index of center point
     * @param col - Column index of center point
     * @returns Object with up, down, left, and right neighbors
     */
    public getNeighbors(row: number, col: number): NeighborPoints {
        return {
            up: this.getPoint(row - 1, col),
            down: this.getPoint(row + 1, col),
            left: this.getPoint(row, col - 1),
            right: this.getPoint(row, col + 1),
        };
    }

    /**
     * Process the entire grid using provided character and regex processors.
     * Validates each character and runs appropriate processors.
     * 
     * @param characterProcesses - Map of character to processor function
     * @param regExpProcesses - Map of regex to processor function
     * @param validCharacters - Regex defining valid characters
     * @returns ProcessResult indicating success or failure with details
     */
    public runGridProcessing(
        characterProcesses: Map<string, CharacterProcess>,
        regExpProcesses: Map<RegExp, CharacterProcess>,
        validCharacters: RegExp,
    ): ProcessResult {
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                const character = this.getPoint(row, col);
                if (character === '') {
                    continue;
                }
                
                if (!validCharacters.test(character)) {
                    return { 
                        isSuccessful: false, 
                        errorDetails: { 
                            row, 
                            col, 
                            errorMessage: `Invalid character found: ${character}` 
                        } 
                    };
                }

                if (characterProcesses.has(character)) {
                    const result = characterProcesses.get(character)?.(row, col);
                    if (!result?.isSuccessful) {
                        return { 
                            isSuccessful: false, 
                            errorDetails: result?.errorDetails 
                        };
                    }
                    continue;
                }

                for (const regExp of regExpProcesses.keys()) {
                    if (regExp.test(character)) {
                        const result = regExpProcesses.get(regExp)?.(row, col);
                        if (!result?.isSuccessful) {
                            return { 
                                isSuccessful: false, 
                                errorDetails: { 
                                    row, 
                                    col, 
                                    errorMessage: `Validation failed for: ${character}` 
                                } 
                            };
                        }
                    }
                }
            }
        }

        return { isSuccessful: true };
    }
} 