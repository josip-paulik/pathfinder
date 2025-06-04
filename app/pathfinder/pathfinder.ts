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
    protected readonly grid: Grid;
    protected readonly HORIZONTAL_ROAD: string = '-';
    protected readonly VERTICAL_ROAD: string = '|';
    protected readonly CROSSROAD: string = '+';
    protected readonly UPPERCASE_ALPHABET: RegExp = /[A-Z]/;
    protected readonly START_CHARACTER: string = '@';
    protected readonly END_CHARACTER: string = 'x';
    protected readonly VALID_GRID_CHARACTERS: RegExp = /[A-Z@x\+\-\|\s]/;
    protected readonly REQUIRED_START_NEIGHBORS = 1;
    protected readonly REQUIRED_TURN_NEIGHBORS = 2;
    protected startPoint?: { row: number, col: number };
    protected endPoint?: { row: number, col: number };

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

        // checks if there is only one start point and that it is valid
        characterProcesses.set(this.START_CHARACTER, (row, col) => {
            if (this.startPoint) {
                return { isSuccessful: false, errorDetails: { errorMessage: `There are more than one start points.` } };
            }
            this.startPoint = { row, col };
            return this.isStartPointValid(row, col);
        });

        // sets the end point, so we now there is at least one
        characterProcesses.set(this.END_CHARACTER, (row, col) => {
            this.endPoint = { row, col };
            return { isSuccessful: true };
        });

        // altough we don't need any regular expressions for this task,
        // I want to keep the if any processing is needed later
        const regExpProcesses = new Map<RegExp, CharacterProcess>();
        return {characterProcesses, regExpProcesses};
    }

    /**
     * Check if the start point is valid.
     * Start point must have exactly one neighbor.
     * @param startPoint 
     * @returns true if the start point is valid, false otherwise
     */
    private isStartPointValid(row: number, col: number): ProcessResult {
        const neighbors = this.grid.getNeighbors(row, col);
        let neighborsCount = Object.values(neighbors).filter(Boolean).length;

        // check for neighbors we can't move to
        if (neighbors.up && !this.canMoveUp(row, col)) {
            neighbors.up = '';
            neighborsCount--;
        }

        if (neighbors.down && !this.canMoveDown(row, col)) {
            neighbors.down = '';
            neighborsCount--;
        }

        if (neighbors.left && !this.canMoveLeft(row, col)) {
            neighbors.left = '';
            neighborsCount--;
        }

        if (neighbors.right && !this.canMoveRight(row, col)) {
            neighbors.right = '';
            neighborsCount--;
        }

        if (neighborsCount !== this.REQUIRED_START_NEIGHBORS) {
            return { 
                isSuccessful: false, 
                errorDetails: { 
                    row, 
                    col, 
                    errorMessage: `Start point (${row}, ${col}) has ${neighborsCount} neighbors, but it must have exactly ${this.REQUIRED_START_NEIGHBORS}.` 
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
        
        switch (currentCharacter) {
            case this.START_CHARACTER:
                return this.handleStartCharacter(row, col);
            case this.CROSSROAD:
                return this.handleTurn(row, col, lastDirection);
            case this.HORIZONTAL_ROAD:
            case this.VERTICAL_ROAD:
                return this.handleRoad(row, col, lastDirection);
            case this.END_CHARACTER:
                return { row, col, lastDirection: Direction.FINISH };
            default:
                return this.handleLetter(row, col, lastDirection);
        }
    }

    /**
     * Handles the start character.
     * @param row - row of the start character
     * @param col - column of the start character
     * @returns new values for row, col and last direction
     */
    protected handleStartCharacter(
        row: number,
        col: number,
    ): MovementResult {
        return this.getStartingMove(row, col);
    }

    /**
     * Gets the starting move for the start character.
     * @param row - row of the start character
     * @param col - column of the start character
     * @returns new values for row, col and last direction if a move is possible
     */
    protected getStartingMove(row: number, col: number): MovementResult {
        let lastDirection: Direction = Direction.START;
        if (this.canMoveUp(row, col)) {
            lastDirection = Direction.UP;
            row--;
        } else if (this.canMoveDown(row, col)) {
            lastDirection = Direction.DOWN;
            row++;
        } else if (this.canMoveLeft(row, col)) {
            lastDirection = Direction.LEFT;
            col--;
        } else if (this.canMoveRight(row, col)) {
            lastDirection = Direction.RIGHT;
            col++;
        }

        if (lastDirection === Direction.START) {
            return {
                row,
                col,
                lastDirection: Direction.ERROR,
                errorMessage: 'No valid path found at start'
            };
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
    protected handleTurn(
        row: number,
        col: number,
        lastDirection: Direction,
    ): MovementResult {
        const turnValidity = this.checkTurn(row, col);
        if (!turnValidity.isSuccessful) {
            return { 
                row, 
                col, 
                lastDirection: Direction.ERROR,
                errorMessage: turnValidity.errorDetails?.errorMessage || 'Invalid turn'
            };
        }

        const nextMove = this.getNextTurnMove(row, col, lastDirection);
        
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
    protected checkTurn(row: number, col: number): ProcessResult {
        const neighbors = this.grid.getNeighbors(row, col);
        
        // Count initial neighbors before validation
        let neighborsCount = Object.values(neighbors).filter(Boolean).length;

        // Eliminate fake neighbors
        if (neighbors.up && !this.canMoveUp(row, col)) neighborsCount--;
        if (neighbors.down && !this.canMoveDown(row, col)) neighborsCount--;
        if (neighbors.left && !this.canMoveLeft(row, col)) neighborsCount--;
        if (neighbors.right && !this.canMoveRight(row, col)) neighborsCount--;

        if (neighborsCount !== this.REQUIRED_TURN_NEIGHBORS) {
            return {
                isSuccessful: false,
                errorDetails: {
                    row,
                    col,
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
                    row,
                    col,
                    errorMessage: 'Turn must not be a straight path'
                }
            };
        }

        return { isSuccessful: true };
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
    protected getNextTurnMove(
        row: number,
        col: number,
        direction: Direction
    ): MovementResult {
        
        switch (direction) {
            case Direction.UP:
            case Direction.DOWN:
                // Must turn left or right
                if (this.canMoveLeft(row, col)) {
                    return { row, col: col - 1, lastDirection: Direction.LEFT };
                }
                if (this.canMoveRight(row, col)) {
                    return { row, col: col + 1, lastDirection: Direction.RIGHT };
                }
                break;

            case Direction.LEFT:
            case Direction.RIGHT:
                // Must turn up or down
                if (this.canMoveUp(row, col)) {
                    return { row: row - 1, col, lastDirection: Direction.UP };
                }
                if (this.canMoveDown(row, col)) {
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
    protected handleRoad(
        row: number,
        col: number,
        lastDirection: Direction
    ): MovementResult {
        return this.getNextRoadMove(row, col, lastDirection);
    }

    /**
     * Determines the next move on a road tile.
     * Roads must continue in the same direction - no turning allowed.
     * 
     * @param position - Current position
     * @param neighbors - Adjacent tiles
     * @param lastDirection - Current direction of movement
     * @returns MovementResult with new position and direction, or error if can't continue
     */
    protected getNextRoadMove(
        row: number,
        col: number,
        lastDirection: Direction
    ): MovementResult {
        switch (lastDirection) {
            case Direction.UP:
                if (!this.canMoveUp(row, col)) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue upward: path ends unexpectedly'
                    };
                }
                return { row: row - 1, col, lastDirection: lastDirection };

            case Direction.DOWN:
                if (!this.canMoveDown(row, col)) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue downward: path ends unexpectedly'
                    };
                }
                return { row: row + 1, col, lastDirection: lastDirection };

            case Direction.LEFT:
                if (!this.canMoveLeft(row, col)) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue left: path ends unexpectedly'
                    };
                }
                return { row, col: col - 1, lastDirection: lastDirection };

            case Direction.RIGHT:
                if (!this.canMoveRight(row, col)) {
                    return { 
                        row, 
                        col, 
                        lastDirection: Direction.ERROR,
                        errorMessage: 'Cannot continue right: path ends unexpectedly'
                    };
                }
                return { row, col: col + 1, lastDirection: lastDirection };

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
    protected handleLetter(
        row: number,
        col: number,
        lastDirection: Direction,
    ): MovementResult {
        const nextMove = this.getNextLetterMove(row, col, lastDirection);

        if (nextMove.lastDirection === Direction.ERROR) {
            return {
                row,
                col,
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
    protected getNextLetterMove(
        row: number,
        col: number,
        lastDirection: Direction
    ): MovementResult {
        // Try to continue in the same direction first
        const continuedMove = this.tryContinueDirection(row, col, lastDirection);
        if (continuedMove.lastDirection !== Direction.ERROR) {
            return continuedMove;
        }

        // If can't continue, try to turn
        const turnedMove = this.tryTurnFromDirection(row, col, lastDirection);
        if (turnedMove.lastDirection !== Direction.ERROR) {
            return turnedMove;
        }

        return {
            row,
            col,
            lastDirection: Direction.ERROR
        };
    }

    /**
     * Attempts to continue moving in the current direction from a letter tile
     * @param row - row of the letter
     * @param col - column of the letter
     * @param lastDirection - direction to continue in
     * @returns MovementResult with new position and direction
     */
    protected tryContinueDirection(
        row: number,
        col: number,
        lastDirection: Direction
    ): MovementResult {
        switch (lastDirection) {
            case Direction.UP:
                if (this.canMoveUp(row, col)) {
                    return { row: row - 1, col, lastDirection: lastDirection };
                }
                break;
            case Direction.DOWN:
                if (this.canMoveDown(row, col)) {
                    return { row: row + 1, col, lastDirection: lastDirection };
                }
                break;
            case Direction.LEFT:
                if (this.canMoveLeft(row, col)) {
                    return { row, col: col - 1, lastDirection: lastDirection };
                }
                break;
            case Direction.RIGHT:
                if (this.canMoveRight(row, col)) {
                    return { row, col: col + 1, lastDirection: lastDirection };
                }
                break;
            default:
                return { row, col, lastDirection: Direction.ERROR };
        }

        return { row, col, lastDirection: Direction.ERROR };
    }

    /**
     * Attempts to turn from the current direction at a letter tile
     * @param row - row of the letter
     * @param col - column of the letter
     * @param lastDirection - current direction
     * @returns MovementResult with new position and direction
     */
    protected tryTurnFromDirection(
        row: number,
        col: number,
        lastDirection: Direction
    ): MovementResult {
        switch (lastDirection) {
            case Direction.UP:
            case Direction.DOWN:

                // Try turning left or right
                if (this.canMoveLeft(row, col)) {
                    return { row, col: col - 1, lastDirection: Direction.LEFT };
                }
                if (this.canMoveRight(row, col)) {
                    return { row, col: col + 1, lastDirection: Direction.RIGHT };
                }
                break;
            case Direction.LEFT:
            case Direction.RIGHT:
                // Try turning up or down
                if (this.canMoveUp(row, col)) {
                    return { row: row - 1, col, lastDirection: Direction.UP };
                }
                if (this.canMoveDown(row, col)) {
                    return { row: row + 1, col, lastDirection: Direction.DOWN };
                }
                break;
        }

        return { row, col, lastDirection: Direction.ERROR };
    }

    /**
     * Checks if it is possible to move right.
     * If the point is on an intersection, it is possible to move right, even if the neighbor is a vertical road.
     * i.e.
     * ```
     *    | 
     * --A|-- -> it is possibe to move right
     *    |
     * * where the A letter represents the point we are on
     * ```
     * 
     * @param row - row of the point
     * @param col - column of the point
     * @returns true if it is possible to move right, false otherwise
     */
    protected canMoveRight(row: number, col: number): boolean {
        const rightNeighbor = this.grid.getPoint(row, col + 1);
        if (!rightNeighbor) {
            return false;
        }

        const canMoveRight = rightNeighbor !== this.VERTICAL_ROAD || this.isPointOnIntersection(row, col + 1);
        return canMoveRight;
    }

    /**
     * Checks if it is possible to move up.
     * If the point is on an intersection, it is possible to move left, even if the neighbor is a vertical road.
     * i.e.
     * ```
     *    | 
     * ---|A-- -> it is possibe to move left
     *    |
     * * where the A letter represents the point we are on
     * ```
     * 
     * @param row - row of the point
     * @param col - column of the point
     * @returns true if it is possible to move left, false otherwise
     */
    protected canMoveLeft(row: number, col: number): boolean {
        const leftNeighbor = this.grid.getPoint(row, col - 1);
        if (!leftNeighbor) {
            return false;
        }

        const canMoveLeft = leftNeighbor !== this.VERTICAL_ROAD || this.isPointOnIntersection(row, col - 1);
        return canMoveLeft;
    }

    /**
     * Checks if it is possible to move up.
     * If the point is on an intersection, it is possible to move up, even if the neighbor is a horizontal road.
     * i.e.
     * ```
     *    | 
     * ------- -> it is possibe to move up
     *    | -> we are here
     * ```
     * 
     * @param row - row of the point
     * @param col - column of the point
     * @returns true if it is possible to move up, false otherwise
     */
    protected canMoveUp(row: number, col: number): boolean {
        const upNeighbor = this.grid.getPoint(row - 1, col);
        if (!upNeighbor) {
            return false;
        }
     
        const canMoveUp = upNeighbor !== this.HORIZONTAL_ROAD || this.isPointOnIntersection(row - 1, col);
        return canMoveUp;
    }

    /**
     * Checks if it is possible to move down.
     * If the point is on an intersection, it is possible to move down, even if the neighbor is a horizontal road road.
     * i.e.
     * ```
     *    | -> we are here
     * ------- -> it is possibe to move down
     *    |
     * ```
     * 
     * @param row - row of the point
     * @param col - column of the point
     * @returns true if it is possible to move down, false otherwise
     */
    protected canMoveDown(row: number, col: number): boolean {
        const downNeighbor = this.grid.getPoint(row + 1, col);
        if (!downNeighbor) {
            return false;
        }

        const canMoveDown = downNeighbor !== this.HORIZONTAL_ROAD || this.isPointOnIntersection(row + 1, col);
        return canMoveDown;
    }

    /**
     * Checks if a point is on an intersection.
     * @param row - row of the point
     * @param col - column of the point
     * @returns true if the point is on an intersection, false otherwise
     */
    protected isPointOnIntersection(row: number, col: number): boolean {
        const neighbors = this.grid.getNeighbors(row, col);
        let numNeighbors = Object.values(neighbors).filter(Boolean).length;

        // eliminate fake neighbors
        if (neighbors.up && neighbors.up === this.HORIZONTAL_ROAD) {
            numNeighbors--;
        }
        if (neighbors.down && neighbors.down === this.HORIZONTAL_ROAD) {
            numNeighbors--;
        }
        if (neighbors.left && neighbors.left === this.VERTICAL_ROAD) {
            numNeighbors--;
        }
        if (neighbors.right && neighbors.right === this.VERTICAL_ROAD) {
            numNeighbors--;
        }

        return numNeighbors === 4;
    }

    /**
     * Get all collected letters from visited coordinates in exact order.
     * Letters are collected only once per coordinate.
     * @param visitedCoordinates - visited coordinates
     * @returns collected letters
     */
    private getCollectedLetters(visitedCoordinates: { row: number, col: number, character: string }[]): string {
        const uniqueLetters = visitedCoordinates.reduce((letters: {row: number, col: number, character: string}[], current) => {
            const isLetter = this.UPPERCASE_ALPHABET.test(current.character);
            const isNotDuplicate = !letters.some(x => x.row === current.row && x.col === current.col);
            if (isLetter && isNotDuplicate) {
                letters.push(current);
            }
            return letters;
        }, []);

        return uniqueLetters.map(x => x.character).join('');
    }

    // Helper methods for readability

    protected isVerticalStraightPath(neighbors: NeighborPoints): boolean {
        return Boolean(neighbors.up && neighbors.down && !neighbors.left && !neighbors.right);
    }

    protected isHorizontalStraightPath(neighbors: NeighborPoints): boolean {
        return Boolean(!neighbors.up && !neighbors.down && neighbors.left && neighbors.right);
    }
}