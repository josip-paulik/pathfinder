export enum Direction {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right',
    START = 'start',
    FINISH = 'finish',
    ERROR = 'error'
}

export type ProcessResult = {
    resultSuccess: boolean;
    customData?: any;
    errorDetails?: {
        row?: number;
        col?: number;
        errorMessage: string;
    };
}

export type TypedProcessResult<T> = {
    resultSuccess: boolean;
    customData?: T;
    errorDetails?: {
        row?: number;
        col?: number;
        errorMessage: string;
    };
}

export type PathResult = {
    visitedCoordinates: { row: number, col: number, character: string }[];
    collectedLetters: string;
}

export type CharacterProcess = (row: number, col: number) => ProcessResult;

/**
 * This class is responsible for finding the path on grid.
 */
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
        gridParam: string[][],
    ) {
        this.grid = new Grid(gridParam);
    }

    public findPath(): TypedProcessResult<PathResult> {
        const setupResult = this.setup();
        if (!setupResult.resultSuccess) {
            return setupResult;
        }
        
        const walkPathResult = this.walkPath();
        
        return walkPathResult;
    }

    /**
     * Sets up processes that need to be ran during
     * setup process for pathfinder.
     * @returns processes for characters and regular expressions
     */
    private setupProcesses() {
        const characterProcesses = new Map<string, CharacterProcess>();
        characterProcesses.set(this.START_CHARACTER, (row, col) => {
            if (this.startPoint) {
                return { resultSuccess: false, errorMessage: `There are more than one start points (${this.startPoint.row}, ${this.startPoint.col}) and (${row}, ${col})` };
            }
            this.startPoint = { row, col };
            return this.isStartPointValid({ row, col });
        });
        characterProcesses.set(this.END_CHARACTER, (row, col) => {
            this.endPoint = { row, col };
            return { resultSuccess: true };
        });
        characterProcesses.set(this.CROSSROAD, (row, col) => {
            return { resultSuccess: this.checkCrossroad({ row, col }) };
        });

        const regExpProcesses = new Map<RegExp, CharacterProcess>();
        //regExpValidityChecks.set(this.UPPERCASE_ALPHABET, (row, col) => {
        //    console.log('uppercase letter', row, col);
        //    return this.checkUppercaseLetter({ row, col });
        //});

        return {characterProcesses, regExpProcesses};
    }

    /**
     * Sets everything needed for finding the path on grid.
     * @returns true if the grid is valid, false otherwise
     */
    private setup(): ProcessResult {
        const {characterProcesses, regExpProcesses} = this.setupProcesses();

        const result = this.grid.runGridProcessing(characterProcesses, regExpProcesses, this.VALID_GRID_CHARACTERS);

        if (!this.startPoint || !this.endPoint) {
            return {
                resultSuccess: false,
                errorDetails: {
                    errorMessage: 'Start or end point not found'
                }
            };
        }

        return result;
    }

    /**
     * Check if the start point is valid.
     * Start point must have exactly one neighbor.
     * @param startPoint 
     * @returns true if the start point is valid, false otherwise
     */
    private isStartPointValid(startPoint: { row: number, col: number }): ProcessResult {
        const neighbors = this.grid.getNeighbors(startPoint.row, startPoint.col);
        let neighborsCount = Object.values(neighbors).filter(Boolean).length;
        
        // here we eliminate roads we cannot turn into
        // i.e.
        // |@|
        //  | 
        // vertical roads to the left and right of @ are not the roads we can turn into
        if (neighbors.up && neighbors.up === this.HORIZONTAL_ROAD) {
            neighbors.up = '';
            neighborsCount--;
        }

        if (neighbors.down && neighbors.down === this.HORIZONTAL_ROAD) {
            neighbors.down = '';
            neighborsCount--;
        }

        if (neighbors.left && neighbors.left === this.VERTICAL_ROAD) {
            neighbors.left = '';
            neighborsCount--;
        }

        if (neighbors.right && neighbors.right === this.VERTICAL_ROAD) {
            neighbors.right = '';
            neighborsCount--;
        }

        if (neighborsCount !== 1) {
            return { 
                resultSuccess: false, 
                errorDetails: { 
                    row: startPoint.row, 
                    col: startPoint.col, 
                    errorMessage: `Start point (${startPoint.row}, ${startPoint.col}) has ${neighborsCount} neighbors, but it must have exactly 1.` 
                } 
            };
        }

        return { resultSuccess: true };
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
        let neighborsCount = Object.values(neighbors).filter(Boolean).length;

        // here we eliminate roads we cannot turn into
        // i.e.
        // |+|
        //  | 
        // vertical roads to the left and right of + are not the roads we can turn into
        if (neighbors.up === this.HORIZONTAL_ROAD) {
            neighbors.up = '';
            neighborsCount--;
        }

        if (neighbors.down === this.HORIZONTAL_ROAD) {
            neighbors.down = '';
            neighborsCount--;
        }

        if (neighbors.left === this.VERTICAL_ROAD) {
            neighbors.left = '';
            neighborsCount--;
        }
        
        if (neighbors.right === this.VERTICAL_ROAD) {
            neighbors.right = '';
            neighborsCount--;
        }

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

        return true;
    }

    /**
     * Handles the start character.
     * @param row - row of the start character
     * @param col - column of the start character
     * @param neighbors - neighbors of the start character
     * @returns new values for row, col and last direction
     */
    private handleStartCharacter(
        row: number,
        col: number,
        neighbors: NeighborPoints
    ): { row: number, col: number, lastDirection: Direction } {
        let lastDirection: Direction = Direction.START;
        if (neighbors.up) {
            lastDirection = Direction.UP;
            row--;
        } else if (neighbors.down) {
            lastDirection = Direction.DOWN;
            row++;
        } else if (neighbors.left) {
            lastDirection = Direction.LEFT;
            col--;
        } else if (neighbors.right) {
            lastDirection = Direction.RIGHT;
            col++;
        }
        return { row, col, lastDirection };
    }

    /**
     * Handles the crossroad.
     * @param row - row of the crossroad
     * @param col - column of the crossroad
     * @param neighbors - neighbors of the crossroad
     * @param lastDirection - last direction
     * @returns new values for row, col and last direction
     */
    private handleTurn(
        row: number,
        col: number,
        neighbors: NeighborPoints,
        lastDirection: Direction,
    ): { row: number, col: number, lastDirection: Direction } {
        console.log('handleTurn', row, col, neighbors, lastDirection);
        const lastRow = row;
        const lastCol = col;
        // here we can safetly assume that turn is valid
        // and we only need to check into which direction we can turn
        switch (lastDirection) {
            case Direction.UP:
            case Direction.DOWN:
                if (neighbors.left) {
                    lastDirection = Direction.LEFT;
                    col--;
                } else if (neighbors.right) {
                    lastDirection = Direction.RIGHT;
                    col++;
                }
                break;
            case Direction.LEFT:
            case Direction.RIGHT:
                if (neighbors.up) {
                    lastDirection = Direction.UP;
                    row--;
                } else if (neighbors.down) {
                    lastDirection = Direction.DOWN;
                    row++;
                }
                break;
            default:
                throw new Error('Invalid direction');
        }

        // in case we can't turn anywhere, we are stuck
        if (row === lastRow && col === lastCol) {
            return { row, col, lastDirection: Direction.ERROR };
        }

        return { row, col, lastDirection };
    }

    /**
     * Handles the road. Tries to move in the last direction,
     * if that is not possible, returns error direction.
     * @param row - row of the road
     * @param col - column of the road
     * @param lastDirection - last direction
     * @returns new values for row, col and last direction
     */
    private handleRoad(
        row: number,
        col: number,
        lastDirection: Direction
    ): { row: number, col: number, lastDirection: Direction } {
        const neighbors = this.grid.getNeighbors(row, col);
        switch (lastDirection) {
            case Direction.UP:
                if (!neighbors.up) {
                    return { row, col, lastDirection: Direction.ERROR };
                }
                row--;
                break;
            case Direction.DOWN:
                if (!neighbors.down) {
                    return { row, col, lastDirection: Direction.ERROR };
                }
                row++;
                break;
            case Direction.LEFT:
                if (!neighbors.left) {
                    return { row, col, lastDirection: Direction.ERROR };
                }
                col--;
                break;
            case Direction.RIGHT:
                if (!neighbors.right) {
                    return { row, col, lastDirection: Direction.ERROR };
                }
                col++;
                break;
            default:
                return { row, col, lastDirection: Direction.ERROR };
        }
        return { row, col, lastDirection };
    }

    /**
     * Handles the letter. Tries to move in the last direction,
     * if that is not possible, it tries to turn.
     * @param row - row of the letter
     * @param col - column of the letter
     * @param neighbors - neighbors of the letter
     * @param lastDirection - last direction
     * @returns new values for row, col and last direction
     */
    private handleLetter(
        row: number,
        col: number,
        neighbors: NeighborPoints,
        lastDirection: Direction,
    ): { row: number, col: number, lastDirection: Direction } {
        const lastRow = row;
        const lastCol = col;
        switch (lastDirection) {
            case Direction.UP:
                if (neighbors.up && neighbors.up !== this.HORIZONTAL_ROAD) {
                    row--;
                }
                else if (neighbors.left && neighbors.left !== this.VERTICAL_ROAD) {
                    lastDirection = Direction.LEFT;
                    col--;
                }
                else if (neighbors.right && neighbors.right !== this.VERTICAL_ROAD) {
                    lastDirection = Direction.RIGHT;
                    col++;
                }
                break;
            case Direction.DOWN:
                if (neighbors.down && neighbors.down !== this.HORIZONTAL_ROAD) {
                    row++;
                }
                else if (neighbors.left && neighbors.left !== this.VERTICAL_ROAD) {
                    lastDirection = Direction.LEFT;
                    col--;
                }
                else if (neighbors.right && neighbors.right !== this.VERTICAL_ROAD) {
                    lastDirection = Direction.RIGHT;
                    col++;
                }
                break;
            case Direction.LEFT:
                if (neighbors.left && neighbors.left !== this.VERTICAL_ROAD) {
                    col--;
                }
                else if (neighbors.up && neighbors.up !== this.HORIZONTAL_ROAD) {
                    lastDirection = Direction.UP;
                    row--;
                }
                else if (neighbors.down && neighbors.down !== this.HORIZONTAL_ROAD) {
                    lastDirection = Direction.DOWN;
                    row++;
                }
                break;
            case Direction.RIGHT:
                if (neighbors.right && neighbors.right !== this.VERTICAL_ROAD) {
                    col++;
                }
                else if (neighbors.up && neighbors.up !== this.HORIZONTAL_ROAD) {
                    lastDirection = Direction.UP;
                    row--;
                }
                else if (neighbors.down && neighbors.down !== this.HORIZONTAL_ROAD) {
                    lastDirection = Direction.DOWN;
                    row++;
                }
                break;
            default:
                return { row, col, lastDirection: Direction.ERROR };
        }

        // in case we can't move anywhere, we are stuck
        if (row === lastRow && col === lastCol) {
            return { row, col, lastDirection: Direction.ERROR };
        }

        return { row, col, lastDirection };
    }

    /**
     * Based on current coordinates, and last direction,
     * determine where to go next.
     * @param row - current row
     * @param col - current column
     * @param lastDirection - last direction
     * @returns new values for row, col and last direction
     */
    private move(
        row: number,
        col: number,
        lastDirection: Direction
    ): { row: number, col: number, lastDirection: Direction } {
        const currentCharacter = this.grid.getPoint(row, col);
        const neighbors = this.grid.getNeighbors(row, col);
        
        switch (currentCharacter) {
            case this.START_CHARACTER:
                return this.handleStartCharacter(row, col, neighbors);
            case this.CROSSROAD:
                return this.handleTurn(row, col, neighbors, lastDirection);
            case this.END_CHARACTER:
                return { row, col, lastDirection: Direction.FINISH };
            case this.HORIZONTAL_ROAD:
            case this.VERTICAL_ROAD:
                return this.handleRoad(row, col, lastDirection);
            default:
                return this.handleLetter(row, col, neighbors, lastDirection);
        }
    }

    /**
     * Walks the path from start to end.
     * @returns visited coordinates and collected letters
     */
    private walkPath(): TypedProcessResult<PathResult> {
        var lastDirection: Direction = Direction.START;
        const visitedCoordinates: { row: number, col: number, character: string }[] = [];

        for (let {row, col} = this.startPoint as {row: number, col: number}; lastDirection !== Direction.FINISH;) {
            const currentCharacter = this.grid.getPoint(row, col);

            visitedCoordinates.push({ row, col, character: currentCharacter });

            const newValues = this.move(row, col, lastDirection);
            row = newValues.row;
            col = newValues.col;
            lastDirection = newValues.lastDirection;
            
            if (lastDirection === Direction.ERROR) {
                return {
                    resultSuccess: false,
                    customData: {
                        visitedCoordinates,
                        collectedLetters: this.getCollectedLetters(visitedCoordinates)
                    },
                    errorDetails: {
                        row: row,
                        col: col,
                        errorMessage: 'Invalid path'
                    }
                };
            }
        }

        const collectedLetters = this.getCollectedLetters(visitedCoordinates);

        return { 
            resultSuccess: true,
            customData: {
                visitedCoordinates,
                collectedLetters
            }
        };
    }

    /**
     * Get all collected letters from visited coordinates in exact order.
     * Letters are collected only once per coordinate.
     * @param visitedCoordinates - visited coordinates
     * @returns collected letters
     */
    private getCollectedLetters(visitedCoordinates: { row: number, col: number, character: string }[]): string {
        const uniqueLetters = visitedCoordinates.reduce((letters: {row: number, col: number, character: string}[], current) => {
            if (this.UPPERCASE_ALPHABET.test(current.character) && !letters.some(x => x.row === current.row && x.col === current.col)) {
                letters.push(current);
            }
            return letters;
        }, []);

        return uniqueLetters.map(x => x.character).join('');
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

    /**
     * Run grid processing.
     * @param characterProcesses - character processes, map of character to a function that processes the character.
     * Function takes row and column and returns true if processing should proceed, false otherwise
     * @param regExpProcesses - regular expression processes,
     * map of regular expression to a function that processes the character.
     * Function takes row and column and returns true if processing should proceed, false otherwise
     * @param validCharacters - valid characters, regular expression that matches valid characters
     * @returns result of processing
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
                    console.log('invalid character', character);
                    return { 
                        resultSuccess: false, 
                        errorDetails: { 
                            row, 
                            col, 
                            errorMessage: `Invalid character: ${character}` 
                        } 
                    };
                }

                if (characterProcesses.has(character)) {
                    const result = characterProcesses.get(character)?.(row, col);
                    if (!result?.resultSuccess) {
                        console.log('invalid character', character, result?.errorDetails);
                        return { 
                            resultSuccess: false, 
                            errorDetails: result?.errorDetails 
                        };
                    }
                    continue;
                }

                for (const regExp of regExpProcesses.keys()) {
                    if (regExp.test(character)) {
                        const result = regExpProcesses.get(regExp)?.(row, col);
                        if (!result?.resultSuccess) {
                            return { 
                                resultSuccess: false, 
                                errorDetails: { 
                                    row, 
                                    col, 
                                    errorMessage: `Invalid character: ${character}` 
                                } 
                            };
                        }
                    }
                }
            }
        }

        return { resultSuccess: true };
    }
    
}