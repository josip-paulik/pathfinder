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
    isSuccessful: boolean;
    customData?: any;
    errorDetails?: {
        row?: number;
        col?: number;
        errorMessage: string;
    };
}

export type TypedProcessResult<T> = {
    isSuccessful: boolean;
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

export type MovementResult = {
    row: number;
    col: number;
    lastDirection: Direction;
    errorMessage?: string;
};

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
    private readonly REQUIRED_START_NEIGHBORS = 1;
    private readonly REQUIRED_TURN_NEIGHBORS = 2;
    private readonly INVALID_HORIZONTAL_CONNECTION = this.VERTICAL_ROAD;
    private readonly INVALID_VERTICAL_CONNECTION = this.HORIZONTAL_ROAD;
    private startPoint?: { row: number, col: number };
    private endPoint?: { row: number, col: number };

    constructor(
        gridParam: string[][],
    ) {
        this.grid = new Grid(gridParam);
    }

    /**
     * Walks the path from start to end following these rules:
     * 1. Start at '@' character
     * 2. Follow valid connections:
     *    - On roads, continue in the same direction
     *    - Turns (+) must have exactly 2 valid connections and cannot be straight paths
     *    - Letters (A-Z) can be traversed in any direction but must first try to maintain the current direction
     * 3. Collect letters along the path (each letter only once)
     * 4. End at 'x' character
     * 
     * Example valid path:
     * ```
     *    @---A---+
     *            |
     *            |
     *            x
     * ```
     * 
     * Example invalid path (turn is actually straight):
     * ```
     *    @---A---+---B
     *            |
     *            |
     *            x
     * ```
     * 
     * @returns ProcessResult with visited coordinates and collected letters if successful
     */
    public findPath(): TypedProcessResult<PathResult> {
        const setupResult = this.setup();
        if (!setupResult.isSuccessful) {
            return setupResult;
        }
        
        const walkPathResult = this.walkPath();
        
        return walkPathResult;
    }

    /**
     * Sets everything needed for finding the path on grid.
     * @returns true if the grid is valid, false otherwise
     */
    private setup(): ProcessResult {
        const {characterProcesses, regExpProcesses} = this.setupProcesses();

        const result = this.grid.runGridProcessing(characterProcesses, regExpProcesses, this.VALID_GRID_CHARACTERS);

        if (!result.isSuccessful) {
            return result;
        }

        if (!this.startPoint || !this.endPoint) {
            const errorMessage = this.startPoint ? 'End point not found' : this.endPoint ? 'Start point not found' : 'Start and end point not found';
            return {
                isSuccessful: false,
                errorDetails: {
                    errorMessage: errorMessage
                }
            };
        }

        return result;
    }

    /**
     * Sets up processes that need to be ran during
     * setup process for pathfinder.
     * @returns processes for characters and regular expressions
     */
    private setupProcesses(): {characterProcesses: Map<string, CharacterProcess>, regExpProcesses: Map<RegExp, CharacterProcess>} {
        const characterProcesses = new Map<string, CharacterProcess>();
        characterProcesses.set(this.START_CHARACTER, (row, col) => {
            if (this.startPoint) {
                return { isSuccessful: false, errorDetails: { errorMessage: `There are more than one start points.` } };
            }
            this.startPoint = { row, col };
            return this.isStartPointValid({ row, col });
        });
        characterProcesses.set(this.END_CHARACTER, (row, col) => {
            this.endPoint = { row, col };
            return { isSuccessful: true };
        });

        const regExpProcesses = new Map<RegExp, CharacterProcess>();
        return {characterProcesses, regExpProcesses};
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
        
        const cantGoUp = neighbors.up && neighbors.up === this.HORIZONTAL_ROAD;
        const cantGoDown = neighbors.down && neighbors.down === this.HORIZONTAL_ROAD;
        const cantGoLeft = neighbors.left && neighbors.left === this.VERTICAL_ROAD;
        const cantGoRight = neighbors.right && neighbors.right === this.VERTICAL_ROAD;

        if (cantGoUp) {
            neighbors.up = '';
            neighborsCount--;
        }

        if (cantGoDown) {
            neighbors.down = '';
            neighborsCount--;
        }

        if (cantGoLeft) {
            neighbors.left = '';
            neighborsCount--;
        }

        if (cantGoRight) {
            neighbors.right = '';
            neighborsCount--;
        }

        if (neighborsCount !== 1) {
            return { 
                isSuccessful: false, 
                errorDetails: { 
                    row: startPoint.row, 
                    col: startPoint.col, 
                    errorMessage: `Start point (${startPoint.row}, ${startPoint.col}) has ${neighborsCount} neighbors, but it must have exactly 1.` 
                } 
            };
        }

        return { isSuccessful: true };
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
            
            if (newValues.lastDirection === Direction.ERROR) {
                return {
                    isSuccessful: false,
                    customData: {
                        visitedCoordinates,
                        collectedLetters: this.getCollectedLetters(visitedCoordinates)
                    },
                    errorDetails: {
                        row: newValues.row,
                        col: newValues.col,
                        errorMessage: newValues.errorMessage || 'Invalid path'
                    }
                };
            }

            row = newValues.row;
            col = newValues.col;
            lastDirection = newValues.lastDirection;
        }

        const collectedLetters = this.getCollectedLetters(visitedCoordinates);

        return { 
            isSuccessful: true,
            customData: {
                visitedCoordinates,
                collectedLetters
            }
        };
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
    ): MovementResult {
        const currentCharacter = this.grid.getPoint(row, col);
        const neighbors = this.grid.getNeighbors(row, col);
        
        switch (currentCharacter) {
            case this.START_CHARACTER:
                return this.handleStartCharacter(row, col, neighbors);
            case this.CROSSROAD:
                return this.handleTurn(row, col, neighbors, lastDirection);
            case this.HORIZONTAL_ROAD:
            case this.VERTICAL_ROAD:
                return this.handleRoad(row, col, lastDirection);
            case this.END_CHARACTER:
                return { row, col, lastDirection: Direction.FINISH };
            default:
                return this.handleLetter(row, col, neighbors, lastDirection);
        }
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
    ): MovementResult {
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
     * Check if the turn is valid by verifying:
     * 1. It must have exactly 2 valid connecting paths
     * 2. Cannot be a straight path (must actually turn)
     * 3. Must have compatible road types (vertical roads can't connect horizontally)
     * 
     * Examples:
     * 
     * Valid turn (L-shape):
     * ```
     *    ---+
     *       |
     *       |
     * ```
     * 
     * Invalid turn (straight path):
     * ```
     *    ---+---
     * ```
     * 
     * Invalid turn (T-junction):
     * ```
     *    ---+---
     *       |
     * ```
     * 
     * @param turn - The coordinates of the turn to check
     * @returns ProcessResult indicating if the turn is valid
     */
    private checkTurn(turn: { row: number, col: number }): ProcessResult {
        const neighbors = this.grid.getNeighbors(turn.row, turn.col);
        
        // Count initial neighbors before validation
        let neighborsCount = Object.values(neighbors).filter(Boolean).length;

        // Validate connection compatibility for each direction
        if (this.hasInvalidUpwardConnection(neighbors)) neighborsCount--;
        if (this.hasInvalidDownwardConnection(neighbors)) neighborsCount--;
        if (this.hasInvalidLeftwardConnection(neighbors)) neighborsCount--;
        if (this.hasInvalidRightwardConnection(neighbors)) neighborsCount--;

        if (neighborsCount !== this.REQUIRED_TURN_NEIGHBORS) {
            return {
                isSuccessful: false,
                errorDetails: {
                    row: turn.row,
                    col: turn.col,
                    errorMessage: 'Turn must have exactly 2 roads coming into it'
                }
            };
        }

        // Check if it's a fake turn (straight path)
        const isVerticalStraightPath = this.isVerticalStraightPath(neighbors);
        const isHorizontalStraightPath = this.isHorizontalStraightPath(neighbors);

        if (isVerticalStraightPath || isHorizontalStraightPath) {
            return {
                isSuccessful: false,
                errorDetails: {
                    row: turn.row,
                    col: turn.col,
                    errorMessage: 'Turn must not be a straight path or a fork'
                }
            };
        }

        return { isSuccessful: true };
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
    ): MovementResult {
        const turnValidity = this.checkTurn({ row, col });
        if (!turnValidity.isSuccessful) {
            return { 
                row, 
                col, 
                lastDirection: Direction.ERROR,
                errorMessage: turnValidity.errorDetails?.errorMessage || 'Invalid turn'
            };
        }

        const lastRow = row;
        const lastCol = col;
        
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

        if (row === lastRow && col === lastCol) {
            return { 
                row, 
                col, 
                lastDirection: Direction.ERROR,
                errorMessage: 'No valid path found at turn'
            };
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
    ): MovementResult {
        const neighbors = this.grid.getNeighbors(row, col);
        switch (lastDirection) {
            case Direction.UP:
                if (!neighbors.up) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue upward: path ends unexpectedly'
                    };
                }
                row--;
                break;
            case Direction.DOWN:
                if (!neighbors.down) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue downward: path ends unexpectedly'
                    };
                }
                row++;
                break;
            case Direction.LEFT:
                if (!neighbors.left) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue left: path ends unexpectedly'
                    };
                }
                col--;
                break;
            case Direction.RIGHT:
                if (!neighbors.right) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue right: path ends unexpectedly'
                    };
                }
                col++;
                break;
            default:
                return { 
                    row, 
                    col, 
                    lastDirection: Direction.ERROR,
                    errorMessage: 'Invalid direction for road'
                };
        }
        return { row, col, lastDirection };
    }

    /**
     * Handles movement through a letter tile. Letters are special because:
     * 1. They can be traversed in any direction (unlike roads)
     * 2. They must respect connecting road types
     * 3. They are collected when traversed
     * 4. They can act as turns
     * 
     * Examples:
     * 
     * Valid letter traversal (acts as connection):
     * ```
     *    ---A---
     * ```
     * 
     * Valid letter traversal (acts as turn):
     * ```
     *    ---A
     *       |
     * ```
     * 
     * Invalid letter traversal (incompatible road type):
     * ```
     *    ---A
     *       -
     * ```
     * 
     * @param row - Current row position
     * @param col - Current column position
     * @param neighbors - Adjacent tiles
     * @param lastDirection - Direction we came from
     * @returns MovementResult with new position and direction
     */
    private handleLetter(
        row: number,
        col: number,
        neighbors: NeighborPoints,
        lastDirection: Direction,
    ): MovementResult {
        const lastRow = row;
        const lastCol = col;

        // Try to continue in same direction first, then try turning
        switch (lastDirection) {
            case Direction.UP:
                if (this.canMoveVertically(neighbors.up)) {
                    row--;
                }
                else if (this.canMoveHorizontally(neighbors.left)) {
                    lastDirection = Direction.LEFT;
                    col--;
                }
                else if (this.canMoveHorizontally(neighbors.right)) {
                    lastDirection = Direction.RIGHT;
                    col++;
                }
                break;
            case Direction.DOWN:
                if (this.canMoveVertically(neighbors.down)) {
                    row++;
                }
                else if (this.canMoveHorizontally(neighbors.left)) {
                    lastDirection = Direction.LEFT;
                    col--;
                }
                else if (this.canMoveHorizontally(neighbors.right)) {
                    lastDirection = Direction.RIGHT;
                    col++;
                }
                break;
            case Direction.LEFT:
                if (this.canMoveHorizontally(neighbors.left)) {
                    col--;
                }
                else if (this.canMoveVertically(neighbors.up)) {
                    lastDirection = Direction.UP;
                    row--;
                }
                else if (this.canMoveVertically(neighbors.down)) {
                    lastDirection = Direction.DOWN;
                    row++;
                }
                break;
            case Direction.RIGHT:
                if (this.canMoveHorizontally(neighbors.right)) {
                    col++;
                }
                else if (this.canMoveVertically(neighbors.up)) {
                    lastDirection = Direction.UP;
                    row--;
                }
                else if (this.canMoveVertically(neighbors.down)) {
                    lastDirection = Direction.DOWN;
                    row++;
                }
                break;
            default:
                return { 
                    row, 
                    col, 
                    lastDirection: Direction.ERROR,
                    errorMessage: 'Invalid direction for letter'
                };
        }

        const isStuck = row === lastRow && col === lastCol;
        if (isStuck) {
            return { 
                row, 
                col, 
                lastDirection: Direction.ERROR,
                errorMessage: 'No valid path found at letter'
            };
        }

        return { row, col, lastDirection };
    }

    // Helper methods for readability
    private hasInvalidUpwardConnection(neighbors: NeighborPoints): boolean {
        return Boolean(neighbors.up && neighbors.up === this.INVALID_VERTICAL_CONNECTION);
    }

    private hasInvalidDownwardConnection(neighbors: NeighborPoints): boolean {
        return Boolean(neighbors.down && neighbors.down === this.INVALID_VERTICAL_CONNECTION);
    }

    private hasInvalidLeftwardConnection(neighbors: NeighborPoints): boolean {
        return Boolean(neighbors.left && neighbors.left === this.INVALID_HORIZONTAL_CONNECTION);
    }

    private hasInvalidRightwardConnection(neighbors: NeighborPoints): boolean {
        return Boolean(neighbors.right && neighbors.right === this.INVALID_HORIZONTAL_CONNECTION);
    }

    private isVerticalStraightPath(neighbors: NeighborPoints): boolean {
        return Boolean(neighbors.up && neighbors.down && !neighbors.left && !neighbors.right);
    }

    private isHorizontalStraightPath(neighbors: NeighborPoints): boolean {
        return Boolean(!neighbors.up && !neighbors.down && neighbors.left && neighbors.right);
    }

    private canMoveVertically(neighbor: string): boolean {
        return Boolean(neighbor && neighbor !== this.INVALID_VERTICAL_CONNECTION);
    }

    private canMoveHorizontally(neighbor: string): boolean {
        return Boolean(neighbor && neighbor !== this.INVALID_HORIZONTAL_CONNECTION);
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
                        console.log('invalid character', character, result?.errorDetails);
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