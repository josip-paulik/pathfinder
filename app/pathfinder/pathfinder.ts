class Pathfinder {
    private readonly grid: Grid;
    private readonly HORIZONTAL_ROAD: string = '-';
    private readonly VERTICAL_ROAD: string = '|';
    private readonly CROSSROAD: string = '+';
    private readonly UPPERCASE_ALPHABET: RegExp = /[A-Z]/;
    private readonly START_CHARACTER: string = '@';
    private readonly END_CHARACTER: string = 'x';
    private readonly VALID_GRID_CHARACTERS: RegExp = /[A-Z@x\+\-\|\s]/;
    private collectedLetterCoordinates: { x: number, y: number }[] = [];
    private collectedPathCharacters: string[] = [];

    constructor(
        private readonly gridParam: string[][],
    ) {
        this.grid = new Grid(gridParam);
    }

    public findPath() {
        if (!this.checkGridValidity()) {
            throw new Error('Invalid grid');
        }
        
    }

    private checkGridValidity(): boolean {
        if (!this.grid.checkForInvalidCharacters(this.VALID_GRID_CHARACTERS)) {
            return false;
        }

        const startPoints = this.grid.getAllCharacterOccurences(this.START_CHARACTER);
        const endPoints = this.grid.getAllCharacterOccurences(this.END_CHARACTER);

        if (startPoints.length !== 1 || endPoints.length !== 1) {
            return false;
        }

        if (!this.checkStartPoint(startPoints[0])) {
            return false;
        }

        const crossroads = this.grid.getAllCharacterOccurences(this.CROSSROAD);
        if (!this.checkCrossroads(crossroads)) {
            return false;
        }

        

        // checking path validity would require me to actually solve the path
        // and to do that I would have to implement a pathfinding algorithm in this method
        // which would be inneficient at best

        return true;
    }

    private checkStartPoint(startPoint: { x: number, y: number }): boolean {
        const neighbors = this.grid.getNeighbors(startPoint.x, startPoint.y);
        const neighborsCount = Object.values(neighbors).filter(Boolean).length;
        if (neighborsCount !== 1) {
            return false;
        }

        return true;
    }

    private checkCrossroads(crossroads: { x: number, y: number }[]): boolean {
        for (const crossroad of crossroads) {
            const neighbors = this.grid.getNeighbors(crossroad.x, crossroad.y);
            
            // intersection must have exactly 2 roads coming into it
            const neighborsCount = Object.values(neighbors).filter(Boolean).length;
            if (neighborsCount !== 2) {
                return false;
            }

            // check for fake turns
            if (neighbors.up && neighbors.down && !neighbors.left && !neighbors.right) {
                return false;
            }

            if (!neighbors.up && !neighbors.down && neighbors.left && neighbors.right) {
                return false;
            }
        }

        return true;
    }
}

type NeighborPoints = {
    up: string;
    down: string;
    left: string;
    right: string;
}

/**
 * This class manages all grid related operations and activities.
 */
class Grid {
    constructor(private readonly grid: string[][]) {}

    /**
     * Get the character at a given point
     * @param x 
     * @param y 
     * @returns character at the point or empty string if the point is out of bounds
     */
    public getPoint(x: number, y: number) {
        if (x < 0 || y < 0) {
            throw new Error('Invalid coordinates');
        }

        // grid is jagged matrix, so no need to return error
        // because some rows may be shorter than others
        if (x >= this.grid.length || y >= this.grid[x].length) {
            return '';
        }

        return this.grid[x][y];
    }


    /**
     * Check if the start and end characters are present in the grid
     * and if there is only one of each
     * @param characters 
     * @returns object with characters as keys and their counts as values
     */
    public getCharactersCount(characters: string[]): Record<string, number> {
        const counts: Record<string, number> = {};
        
        // Initialize counts
        for (const character of characters) {
            counts[character] = 0;
        }

        // Count characters
        for (const row of this.grid) {
            for (const cell of row) {
                if (characters.includes(cell)) {
                    counts[cell]++;
                }
            }
        }

        return counts;
    }

    /**
     * Get all occurrences of a character in the grid
     * @param character 
     * @returns array of objects with x and y coordinates(empty array if there are no occurrences)
     */
    public getAllCharacterOccurences(character: string): { x: number, y: number }[] {
        const occurences: { x: number, y: number }[] = [];

        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                if (this.getPoint(x, y) === character) {
                    occurences.push({ x, y });
                }
            }
        }

        return occurences;
    }


    /**
     * Get the neighbors of a point
     * @param x 
     * @param y 
     * @returns object with up, down, left, and right neighbors
     */
    public getNeighbors(x: number, y: number):  NeighborPoints {
        const neighbors: NeighborPoints = {
            up: this.getPoint(x - 1, y),
            down: this.getPoint(x + 1, y),
            left: this.getPoint(x, y - 1),
            right: this.getPoint(x, y + 1),
        };

        return neighbors;
    }

    /**
     * Check if the grid contains only valid characters
     * @param characters - regular expression that contains all valid characters
     * @returns true if the grid contains only valid characters, false otherwise
     */
    public checkForInvalidCharacters(characters: RegExp): boolean {
        for (const row of this.grid) {
            for (const cell of row) {
                if (!characters.test(cell)) {
                    return false;
                }
            }
        }

        return true;
    }
    
}