import { Grid, type NeighborPoints } from "./grid";

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
     *    - On letters (A-Z) try to continue in the same direction first, then try to turn
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

        if (this.hasInvalidUpwardConnection(neighbors)) {
            neighbors.up = '';
            neighborsCount--;
        }

        if (this.hasInvalidDownwardConnection(neighbors)) {
            neighbors.down = '';
            neighborsCount--;
        }

        if (this.hasInvalidLeftwardConnection(neighbors)) {
            neighbors.left = '';
            neighborsCount--;
        }

        if (this.hasInvalidRightwardConnection(neighbors)) {
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

        const nextMove = this.getNextTurnMove({ row, col }, neighbors, lastDirection);
        
        if (nextMove.lastDirection === Direction.ERROR) {
            return { 
                row, 
                col, 
                lastDirection: Direction.ERROR,
                errorMessage: 'No valid path found at turn'
            };
        }

        return nextMove;
    }

    /**
     * Determines the next move at a turn based on the current direction.
     * Turns must change direction - no straight paths allowed.
     * 
     * Valid turns:
     * ```
     * UP/DOWN to LEFT:     UP/DOWN to RIGHT:
     *    ---+              +---
     *       |              |
     *                      
     * LEFT/RIGHT to UP:    LEFT/RIGHT to DOWN:
     *    |                    
     *    +---              +---
     *                      |
     * ```
     * 
     * @param position - Current position
     * @param neighbors - Adjacent tiles
     * @param direction - Current direction of movement
     * @returns MovementResult with new position and direction
     */
    private getNextTurnMove(
        position: { row: number, col: number },
        neighbors: NeighborPoints,
        direction: Direction
    ): MovementResult {
        const { row, col } = position;
        
        switch (direction) {
            case Direction.UP:
            case Direction.DOWN:
                // Must turn left or right
                if (neighbors.left) {
                    return { row, col: col - 1, lastDirection: Direction.LEFT };
                }
                if (neighbors.right) {
                    return { row, col: col + 1, lastDirection: Direction.RIGHT };
                }
                break;

            case Direction.LEFT:
            case Direction.RIGHT:
                // Must turn up or down
                if (neighbors.up) {
                    return { row: row - 1, col, lastDirection: Direction.UP };
                }
                if (neighbors.down) {
                    return { row: row + 1, col, lastDirection: Direction.DOWN };
                }
                break;

            default:
                return { 
                    row, 
                    col, 
                    lastDirection: Direction.ERROR,
                    errorMessage: 'Invalid direction for turn'
                };
        }

        return { 
            row, 
            col, 
            lastDirection: Direction.ERROR
        };
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
        return this.getNextRoadMove({ row, col }, neighbors, lastDirection);
    }

    /**
     * Determines the next move on a road tile.
     * Roads must continue in the same direction - no turning allowed.
     * 
     * @param position - Current position
     * @param neighbors - Adjacent tiles
     * @param direction - Current direction of movement
     * @returns MovementResult with new position and direction, or error if can't continue
     */
    private getNextRoadMove(
        position: { row: number, col: number },
        neighbors: NeighborPoints,
        direction: Direction
    ): MovementResult {
        const { row, col } = position;

        switch (direction) {
            case Direction.UP:
                if (!neighbors.up) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue upward: path ends unexpectedly'
                    };
                }
                return { row: row - 1, col, lastDirection: direction };

            case Direction.DOWN:
                if (!neighbors.down) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue downward: path ends unexpectedly'
                    };
                }
                return { row: row + 1, col, lastDirection: direction };

            case Direction.LEFT:
                if (!neighbors.left) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue left: path ends unexpectedly'
                    };
                }
                return { row, col: col - 1, lastDirection: direction };

            case Direction.RIGHT:
                if (!neighbors.right) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue right: path ends unexpectedly'
                    };
                }
                return { row, col: col + 1, lastDirection: direction };

            default:
                return { 
                    row, 
                    col, 
                    lastDirection: Direction.ERROR,
                    errorMessage: 'Invalid direction for road'
                };
        }
    }

    /**
     * Handles movement through a letter tile. Letters are special because:
     * 1. They can be traversed in any direction (unlike roads)
     * 2. They must respect connecting road types
     * 3. They are collected when traversed
     * 4. They can act as turns
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
        const position = { row, col };
        const nextMove = this.getNextLetterMove(position, neighbors, lastDirection);

        if (nextMove.lastDirection === Direction.ERROR) {
            return {
                ...position,
                lastDirection: Direction.ERROR,
                errorMessage: 'No valid path found at letter'
            };
        }

        return nextMove;
    }

    /**
     * Determines the next move from a letter tile by:
     * 1. First trying to continue in the current direction
     * 2. Then trying to turn if continuing is not possible
     */
    private getNextLetterMove(
        position: { row: number, col: number },
        neighbors: NeighborPoints,
        lastDirection: Direction
    ): MovementResult {
        // Try to continue in the same direction first
        const continuedMove = this.tryContinueDirection(position, neighbors, lastDirection);
        if (continuedMove.lastDirection !== Direction.ERROR) {
            return continuedMove;
        }

        // If can't continue, try to turn
        const turnedMove = this.tryTurnFromDirection(position, neighbors, lastDirection);
        if (turnedMove.lastDirection !== Direction.ERROR) {
            return turnedMove;
        }

        return {
            ...position,
            lastDirection: Direction.ERROR
        };
    }

    /**
     * Attempts to continue moving in the current direction from a letter tile
     */
    private tryContinueDirection(
        position: { row: number, col: number },
        neighbors: NeighborPoints,
        direction: Direction
    ): MovementResult {
        const { row, col } = position;

        switch (direction) {
            case Direction.UP:
                return this.canMoveVertically(neighbors.up)
                    ? { row: row - 1, col, lastDirection: direction }
                    : { row, col, lastDirection: Direction.ERROR };
            case Direction.DOWN:
                return this.canMoveVertically(neighbors.down)
                    ? { row: row + 1, col, lastDirection: direction }
                    : { row, col, lastDirection: Direction.ERROR };
            case Direction.LEFT:
                return this.canMoveHorizontally(neighbors.left)
                    ? { row, col: col - 1, lastDirection: direction }
                    : { row, col, lastDirection: Direction.ERROR };
            case Direction.RIGHT:
                return this.canMoveHorizontally(neighbors.right)
                    ? { row, col: col + 1, lastDirection: direction }
                    : { row, col, lastDirection: Direction.ERROR };
            default:
                return { row, col, lastDirection: Direction.ERROR };
        }
    }

    /**
     * Attempts to turn from the current direction at a letter tile
     */
    private tryTurnFromDirection(
        position: { row: number, col: number },
        neighbors: NeighborPoints,
        direction: Direction
    ): MovementResult {
        const { row, col } = position;

        switch (direction) {
            case Direction.UP:
            case Direction.DOWN:
                // Try turning left or right
                if (this.canMoveHorizontally(neighbors.left)) {
                    return { row, col: col - 1, lastDirection: Direction.LEFT };
                }
                if (this.canMoveHorizontally(neighbors.right)) {
                    return { row, col: col + 1, lastDirection: Direction.RIGHT };
                }
                break;
            case Direction.LEFT:
            case Direction.RIGHT:
                // Try turning up or down
                if (this.canMoveVertically(neighbors.up)) {
                    return { row: row - 1, col, lastDirection: Direction.UP };
                }
                if (this.canMoveVertically(neighbors.down)) {
                    return { row: row + 1, col, lastDirection: Direction.DOWN };
                }
                break;
        }

        return { row, col, lastDirection: Direction.ERROR };
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