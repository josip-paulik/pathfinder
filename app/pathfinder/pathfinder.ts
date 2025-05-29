export class Pathfinder {
    private readonly grid: Grid;
    private readonly HORIZONTAL_ROAD: string = '-';
    private readonly VERTICAL_ROAD: string = '|';
    private readonly CROSSROAD: string = '+';
    private readonly UPPERCASE_ALPHABET: RegExp = /[A-Z]/;
    private readonly START_CHARACTER: string = '@';
    private readonly END_CHARACTER: string = 'x';
    private readonly VALID_GRID_CHARACTERS: RegExp = /[A-Z@x\+\-\|\s]/;
    private startPoint?: { row: number, col: number };
    private endPoint?: { row: number, col: number };

    constructor(
        private readonly gridParam: string[][],
    ) {
        this.grid = new Grid(gridParam);
    }

    public findPath() {
        if (!this.checkGridValidity()) {
            throw new Error('Invalid grid');
        }

        const { visitedCoordinates, uniqueLetters } = this.walkPath();

        return { visitedCoordinates, uniqueLetters };

    }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

    private checkGridValidity(): boolean {
        const validityChecks = new Map<string, (row: number, col: number) => boolean>();

        // set rules for each character

        validityChecks.set(this.START_CHARACTER, (row, col) => {
            console.log('start point', row, col);
            if (this.startPoint) {
                return false;
            }
            this.startPoint = { row, col };
            return this.checkStartPoint({ row, col });
        });
        validityChecks.set(this.END_CHARACTER, (row, col) => {
            console.log('end point', row, col);
            if (this.endPoint) {
                return false;
            }
            this.endPoint = { row, col };
            return true;
        });
        validityChecks.set(this.CROSSROAD, (row, col) => {
            console.log('crossroad', row, col);
            return this.checkCrossroad({ row, col });
        });
        validityChecks.set(this.HORIZONTAL_ROAD, (row, col) => {
            console.log('horizontal road', row, col);
            return this.checkHorizontalRoad({ row, col });
        });
        validityChecks.set(this.VERTICAL_ROAD, (row, col) => {
            console.log('vertical road', row, col);
            return this.checkVerticalRoad({ row, col });
        });

        const regExpValidityChecks = new Map<RegExp, (row: number, col: number) => boolean>();
        regExpValidityChecks.set(this.UPPERCASE_ALPHABET, (row, col) => {
            console.log('uppercase letter', row, col);
            return this.checkUppercaseLetter({ row, col });
        });


        const validity = this.grid.runValidityChecks(validityChecks, regExpValidityChecks, this.VALID_GRID_CHARACTERS);
        if (!validity) {
            throw new Error('Invalid grid');
        }

        if (!this.startPoint || !this.endPoint) {
            throw new Error('Start or end point not found');
        }

        return true;
    }

    /**
     * Check if the start point is valid.
     * Start point must have exactly one neighbor.
     * @param startPoint 
     * @returns true if the start point is valid, false otherwise
     */
    private checkStartPoint(startPoint: { row: number, col: number }): boolean {
        const neighbors = this.grid.getNeighbors(startPoint.row, startPoint.col);
        const neighborsCount = Object.values(neighbors).filter(Boolean).length;
        console.log('neighborsCount for start point', neighborsCount, neighbors);
        if (neighborsCount !== 1) {
            return false;
        }

        return true;
    }

    /**
     * Check if the crossroad is valid.
     * Crossroad must have exactly 2 roads coming into it.
     * And it must not be a fake turn.
     * @param crossroad 
     * @returns true if the crossroad is valid, false otherwise
     */
    private checkCrossroad(crossroad: { row: number, col: number }): boolean {
        const neighbors = this.grid.getNeighbors(crossroad.row, crossroad.col);
        
        console.log('neighbors for crossroad', neighbors);
        // intersection must have exactly 2 roads coming into it
        const neighborsCount = Object.values(neighbors).filter(Boolean).length;
        if (neighborsCount !== 2) {
            return false;
        }

        // check for fake turns - turns that are continun on straight roads
        if (neighbors.up && neighbors.down && !neighbors.left && !neighbors.right) {
            return false;
        }

        if (!neighbors.up && !neighbors.down && neighbors.left && neighbors.right) {
            return false;
        }

        return true;
    }

    /**
     * Check if the horizontal road is valid.
     * Horizontal road must have at least two neighbors.
     * @param horizontalRoad 
     * @returns true if the horizontal road is valid, false otherwise
     */
    private checkHorizontalRoad(horizontalRoad: { row: number, col: number }): boolean {
        const neighbors = this.grid.getNeighbors(horizontalRoad.row, horizontalRoad.col);
        if (Object.values(neighbors).filter(Boolean).length < 2) {
            return false;
        }
        return true;
    }

    /**
     * Check if the vertical road is valid.
     * Vertical road must have at least two neighbors.
     * @param verticalRoad 
     * @returns true if the vertical road is valid, false otherwise
     */
    private checkVerticalRoad(verticalRoad: { row: number, col: number }): boolean {
        const neighbors = this.grid.getNeighbors(verticalRoad.row, verticalRoad.col);
        if (Object.values(neighbors).filter(Boolean).length < 2) {
            return false;
        }
        return true;
    }


    /**
     * Check if the uppercase letter is valid.
     * Uppercase letter must have at least two neighbors.
     * @param uppercaseLetter 
     * @returns true if the uppercase letter is valid, false otherwise
     */
    private checkUppercaseLetter(uppercaseLetter: { row: number, col: number }): boolean {
        const neighbors = this.grid.getNeighbors(uppercaseLetter.row, uppercaseLetter.col);
        if (Object.values(neighbors).filter(Boolean).length < 2) {
            return false;
        }
        return true;
    }

    private walkPath() {
        var lastDirection: 'up' | 'down' | 'left' | 'right' | null = null;
        const visitedCoordinates: { row: number, col: number, character: string }[] = [];
        for (let {row, col} = this.startPoint as {row: number, col: number}; this.grid.getPoint(row, col) !== this.END_CHARACTER;) {
            const currentCharacter = this.grid.getPoint(row, col);
            const neighbors = this.grid.getNeighbors(row, col);
            visitedCoordinates.push({ row, col, character: currentCharacter });

            switch (currentCharacter) {
                case this.START_CHARACTER:
                    if (neighbors.up) {
                        lastDirection = 'up';
                        row--;
                    } else if (neighbors.down) {
                        lastDirection = 'down';
                        row++;
                    } else if (neighbors.left) {
                        lastDirection = 'left';
                        col--;
                    } else if (neighbors.right) {
                        lastDirection = 'right';
                        col++;
                    }
                    break;
                case this.CROSSROAD:
                    switch (lastDirection) {
                        // we checked for fake turns in validity checks
                        case 'up':
                        case 'down':
                            if (neighbors.left) {
                                lastDirection = 'left';
                                col--;
                            } else if (neighbors.right) {
                                lastDirection = 'right';
                                col++;
                            }
                            break;
                        case 'left':
                        case 'right':
                            if (neighbors.up) {
                                lastDirection = 'up';
                                row--;
                            } else if (neighbors.down) {
                                lastDirection = 'down';
                                row++;
                            }
                            break;
                        default:
                            throw new Error('Invalid direction');
                    }
                    break;
                case this.END_CHARACTER:
                    break;
                default:
                    if (lastDirection === 'up') {
                        row--;
                    } else if (lastDirection === 'down') {
                        row++;
                    } else if (lastDirection === 'left') {
                        col--;
                    } else if (lastDirection === 'right') {
                        col++;
                    }
                    break;
            }
        }

        // get all unique letters in visited coordinates in exact order
        const uniqueLetters = visitedCoordinates.reduce((acc: {row: number, col: number, character: string}[], curr) => {
            if (this.UPPERCASE_ALPHABET.test(curr.character) && !acc.some(x => x.row === curr.row && x.col === curr.col)) {
                acc.push(curr);
            }
            return acc;
        }, [])

        return { visitedCoordinates, uniqueLetters };
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
export class Grid {
    constructor(private readonly grid: string[][]) {}

    /**
     * Get the character at a given point
     * @param row 
     * @param col 
     * @returns character at the point or empty string if the point is out of bounds
     */
    public getPoint(row: number, col: number) {
        if (row < 0 || col < 0) {
            return '';
        }

        // grid is jagged matrix, so no need to return error
        // because some rows may be shorter than others
        if (row >= this.grid.length || col >= this.grid[row].length) {
            return '';
        }

        return this.grid[row][col] === ' ' ? '' : this.grid[row][col];
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
     * @returns array of objects with x and col coordinates(empty array if there are no occurrences)
     */
    public getAllCharacterOccurences(character: string): { row: number, col: number }[] {
        const occurences: { row: number, col: number }[] = [];

        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                if (this.getPoint(row, col) === character) {
                    occurences.push({ row, col });
                }
            }
        }

        return occurences;
    }


    /**
     * Get the neighbors of a point
     * @param row 
     * @param col 
     * @returns object with up, down, left, and right neighbors
     */
    public getNeighbors(row: number, col: number):  NeighborPoints {
        const neighbors: NeighborPoints = {
            up: this.getPoint(row - 1, col),
            down: this.getPoint(row + 1, col),
            left: this.getPoint(row, col - 1),
            right: this.getPoint(row, col + 1),
        };

        return neighbors;
    }

    public runValidityChecks(
        validityChecks: Map<string, (row: number, col: number) => boolean>,
        regExpValidityChecks: Map<RegExp, (row: number, col: number) => boolean>,
        validCharacters: RegExp,
    ): boolean {
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                const character = this.grid[row][col];
                
                if (!validCharacters.test(character)) {
                    console.log('invalid character', character);
                    return false;
                }

                if (validityChecks.has(character)) {
                    const isValid = validityChecks.get(character)?.(row, col);
                    if (!isValid) {
                        console.log('invalid character', character);
                        return false;
                    }
                    continue;
                }

                for (const regExp of regExpValidityChecks.keys()) {
                    if (regExp.test(character)) {
                        const isValid = regExpValidityChecks.get(regExp)?.(row, col);
                        if (!isValid) {
                            console.log('invalid character', character);
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }
    
}