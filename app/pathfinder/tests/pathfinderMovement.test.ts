import { Direction } from '../pathfinder';
import { TestablePathfinder } from './testablePathfinder';
import { describe, test, expect } from 'vitest';

type TestablePathfinderMethod = keyof TestablePathfinder;

interface StartTestCase {
    name: string;
    grid: string[][];
    startRow: number;
    startCol: number;
    expected: any;
}

interface TestCase {
    name: string;
    grid: string[][];
    row: number;
    col: number;
    direction: Direction;
    method: TestablePathfinderMethod;
    expected: any;
}

interface MovementTestCase {
    name: string;
    grid: string[][];
    row: number;
    col: number;
    expected: boolean;
}

interface IntersectionTestCase {
    name: string;
    grid: string[][];
    row: number;
    col: number;
    expected: boolean;
}

describe('Pathfinder Movement Tests', () => {
    describe('handleStartCharacter and getStartingMove', () => {
        test.each<StartTestCase>([
            {
                name: 'should handle start character with path going up',
                grid: [
                    ['|'],
                    ['@'],
                ],
                startRow: 1,
                startCol: 0,
                expected: {
                    row: 0,
                    col: 0,
                    lastDirection: Direction.UP
                }
            },
            {
                name: 'should handle start character with path going down',
                grid: [
                    ['@'],
                    ['|'],
                ],
                startRow: 0,
                startCol: 0,
                expected: {
                    row: 1,
                    col: 0,
                    lastDirection: Direction.DOWN
                }
            },
            {
                name: 'should handle start character with path going left',
                grid: [
                    ['-', '@'],
                ],
                startRow: 0,
                startCol: 1,
                expected: {
                    row: 0,
                    col: 0,
                    lastDirection: Direction.LEFT
                }
            },
            {
                name: 'should handle start character with path going right',
                grid: [
                    ['@', '-'],
                ],
                startRow: 0,
                startCol: 0,
                expected: {
                    row: 0,
                    col: 1,
                    lastDirection: Direction.RIGHT
                }
            },
            {
                name: 'should return error when no valid path from start',
                grid: [
                    ['@'],
                ],
                startRow: 0,
                startCol: 0,
                expected: {
                    row: 0,
                    col: 0,
                    lastDirection: Direction.ERROR,
                    errorMessage: 'No valid path found at start'
                }
            }
        ])('$name', ({ grid, startRow, startCol, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = pathfinder.exposedHandleStartCharacter(startRow, startCol);
            expect(result).toEqual(expected);
        });
    });

    describe('handleTurn and checkTurn', () => {
        test.each<TestCase>([
            {
                name: 'should validate L-shaped turn from down to right',
                grid: [
                    ['|'],
                    ['+', '-'],
                ],
                row: 1,
                col: 0,
                direction: Direction.DOWN,
                method: 'exposedHandleTurn',
                expected: {
                    row: 1,
                    col: 1,
                    lastDirection: Direction.RIGHT
                }
            },
            {
                name: 'should validate L-shaped turn from right to up',
                grid: [
                    ['|'],
                    ['+', '-'],
                ],
                row: 1,
                col: 0,
                direction: Direction.RIGHT,
                method: 'exposedHandleTurn',
                expected: {
                    row: 0,
                    col: 0,
                    lastDirection: Direction.UP
                }
            },
            {
                name: 'should reject straight path through turn',
                grid: [
                    ['-', '+', '-'],
                ],
                row: 0,
                col: 1,
                direction: Direction.RIGHT,
                method: 'exposedCheckTurn',
                expected: {
                    isSuccessful: false,
                    errorDetails: {
                        row: 0,
                        col: 1,
                        errorMessage: 'Turn must not be a straight path'
                    }
                }
            },
            {
                name: 'should reject turn with more than 2 connections',
                grid: [
                    ['-', '+', '-'],
                    [' ', '|',],
                ],
                row: 0,
                col: 1,
                direction: Direction.RIGHT,
                method: 'exposedCheckTurn',
                expected: {
                    isSuccessful: false,
                    errorDetails: {
                        row: 0,
                        col: 1,
                        errorMessage: 'Turn must have exactly 2 roads coming into it'
                    }
                }
            }
        ])('$name', ({ grid, row, col, direction, method, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = (pathfinder[method] as Function)(row, col, direction);
            expect(result).toEqual(expected);
        });
    });

    describe('handleRoad and getNextRoadMove', () => {
        test.each<TestCase>([
            {
                name: 'should continue on horizontal road going right',
                grid: [
                    ['-', '-'],
                ],
                row: 0,
                col: 0,
                direction: Direction.RIGHT,
                method: 'exposedHandleRoad',
                expected: {
                    row: 0,
                    col: 1,
                    lastDirection: Direction.RIGHT
                }
            },
            {
                name: 'should continue on vertical road going down',
                grid: [
                    ['|'],
                    ['|'],
                ],
                row: 0,
                col: 0,
                direction: Direction.DOWN,
                method: 'exposedHandleRoad',
                expected: {
                    row: 1,
                    col: 0,
                    lastDirection: Direction.DOWN
                }
            },
            {
                name: 'should error when road ends unexpectedly',
                grid: [
                    ['-'],
                ],
                row: 0,
                col: 0,
                direction: Direction.RIGHT,
                method: 'exposedHandleRoad',
                expected: {
                    row: 0,
                    col: 0,
                    lastDirection: Direction.ERROR,
                    errorMessage: 'Cannot continue right: path ends unexpectedly'
                }
            }
        ])('$name', ({ grid, row, col, direction, method, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = pathfinder[method](row, col, direction);
            expect(result).toEqual(expected);
        });
    });

    describe('handleLetter and related methods', () => {
        test.each([
            {
                name: 'should continue in same direction through letter if possible',
                grid: [
                    ['-', 'A', '-'],
                ],
                row: 0,
                col: 1,
                direction: Direction.RIGHT,
                method: 'exposedHandleLetter' as TestablePathfinderMethod,
                expected: {
                    row: 0,
                    col: 2,
                    lastDirection: Direction.RIGHT
                }
            },
            {
                name: 'should error when no valid path from letter',
                grid: [
                    ['A'],
                ],
                row: 0,
                col: 0,
                direction: Direction.RIGHT,
                method: 'exposedHandleLetter' as TestablePathfinderMethod,
                expected: {
                    row: 0,
                    col: 0,
                    lastDirection: Direction.ERROR,
                    errorMessage: 'No valid path found at letter'
                }
            },
            {
                name: 'tryTurnFromDirection should find valid turn direction',
                grid: [
                    ['-', 'A'],
                    [' ', '|'],
                ],
                row: 0,
                col: 1,
                direction: Direction.RIGHT,
                method: 'exposedTryTurnFromDirection' as TestablePathfinderMethod,
                expected: {
                    row: 1,
                    col: 1,
                    lastDirection: Direction.DOWN
                }
            },
            {
                name: 'tryContinueDirection should find valid continuance in direction',
                grid: [
                    [' ', '|'],
                    [' ', 'A'],
                    ['-', '-', '-'],
                    [' ', 'B'],
                ],
                row: 1,
                col: 1,
                direction: Direction.DOWN,
                method: 'tryContinueDirection' as TestablePathfinderMethod,
                expected: {
                    row: 2,
                    col: 1,
                    lastDirection: Direction.DOWN
                }
            },
            {
                name: 'tryTurnFromDirection should find valid turn',
                grid: [
                    ['-', 'A',],
                    ['-', '-', '-'],
                    [' ', '|',],
                ],
                row: 0,
                col: 1,
                direction: Direction.RIGHT,
                method: 'tryTurnFromDirection' as TestablePathfinderMethod,
                expected: {
                    row: 1,
                    col: 1,
                    lastDirection: Direction.DOWN
                }
            }
        ])('$name', ({ grid, row, col, direction, method, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = pathfinder[method](row, col, direction);
            expect(result).toEqual(expected);
        });
    });

    describe('canMoveRight', () => {
        test.each<MovementTestCase>([
            {
                name: 'should allow moving right on horizontal road',
                grid: [
                    ['-', '-'],
                ],
                row: 0,
                col: 0,
                expected: true
            },
            {
                name: 'should allow moving right to a letter',
                grid: [
                    ['-', 'A'],
                ],
                row: 0,
                col: 0,
                expected: true
            },
            {
                name: 'should not allow moving right to vertical road',
                grid: [
                    ['-', '|'],
                ],
                row: 0,
                col: 0,
                expected: false
            },
            {
                name: 'should allow moving right to vertical road if it is an intersection',
                grid: [
                    [' ', '|', ' '],
                    ['-', '|', '-'],
                    [' ', '|', ' '],
                ],
                row: 1,
                col: 0,
                expected: true
            },
            {
                name: 'should not allow moving right off grid',
                grid: [
                    ['-'],
                ],
                row: 0,
                col: 0,
                expected: false
            }
        ])('$name', ({ grid, row, col, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = pathfinder.exposedCanMoveRight(row, col);
            expect(result).toBe(expected);
        });
    });

    describe('canMoveLeft', () => {
        test.each<MovementTestCase>([
            {
                name: 'should allow moving left on horizontal road',
                grid: [
                    ['-', '-'],
                ],
                row: 0,
                col: 1,
                expected: true
            },
            {
                name: 'should allow moving left to a letter',
                grid: [
                    ['A', '-'],
                ],
                row: 0,
                col: 1,
                expected: true
            },
            {
                name: 'should not allow moving left to vertical road',
                grid: [
                    ['|', '-'],
                ],
                row: 0,
                col: 1,
                expected: false
            },
            {
                name: 'should allow moving left to vertical road if it is an intersection',
                grid: [
                    [' ', '|', ' '],
                    ['-', '|', '-'],
                    [' ', '|', ' '],
                ],
                row: 1,
                col: 2,
                expected: true
            },
            {
                name: 'should not allow moving left off grid',
                grid: [
                    ['-'],
                ],
                row: 0,
                col: 0,
                expected: false
            }
        ])('$name', ({ grid, row, col, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = pathfinder.exposedCanMoveLeft(row, col);
            expect(result).toBe(expected);
        });
    });

    describe('canMoveUp', () => {
        test.each<MovementTestCase>([
            {
                name: 'should allow moving up on vertical road',
                grid: [
                    ['|'],
                    ['|'],
                ],
                row: 1,
                col: 0,
                expected: true
            },
            {
                name: 'should allow moving up to a letter',
                grid: [
                    ['A'],
                    ['|'],
                ],
                row: 1,
                col: 0,
                expected: true
            },
            {
                name: 'should not allow moving up to horizontal road',
                grid: [
                    ['-'],
                    ['|'],
                ],
                row: 1,
                col: 0,
                expected: false
            },
            {
                name: 'should allow moving up to horizontal road if it is an intersection',
                grid: [
                    [' ', '|', ' '],
                    ['-', '-', '-'],
                    [' ', '|', ' '],
                ],
                row: 2,
                col: 1,
                expected: true
            },
            {
                name: 'should not allow moving up off grid',
                grid: [
                    ['|'],
                ],
                row: 0,
                col: 0,
                expected: false
            }
        ])('$name', ({ grid, row, col, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = pathfinder.exposedCanMoveUp(row, col);
            expect(result).toBe(expected);
        });
    });

    describe('canMoveDown', () => {
        test.each<MovementTestCase>([
            {
                name: 'should allow moving down on vertical road',
                grid: [
                    ['|'],
                    ['|'],
                ],
                row: 0,
                col: 0,
                expected: true
            },
            {
                name: 'should allow moving down to a letter',
                grid: [
                    ['|'],
                    ['A'],
                ],
                row: 0,
                col: 0,
                expected: true
            },
            {
                name: 'should not allow moving down to horizontal road',
                grid: [
                    ['|'],
                    ['-'],
                ],
                row: 0,
                col: 0,
                expected: false
            },
            {
                name: 'should allow moving down to horizontal road if it is an intersection',
                grid: [
                    [' ', '|', ' '],
                    ['-', '-', '-'],
                    [' ', '|', ' '],
                ],
                row: 0,
                col: 1,
                expected: true
            },
            {
                name: 'should not allow moving down off grid',
                grid: [
                    ['|'],
                ],
                row: 0,
                col: 0,
                expected: false
            }
        ])('$name', ({ grid, row, col, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = pathfinder.exposedCanMoveDown(row, col);
            expect(result).toBe(expected);
        });
    });

    describe('isPointOnIntersection', () => {
        test.each<IntersectionTestCase>([
            {
                name: 'should identify point with 4 valid connections as intersection',
                grid: [
                    [' ', '|', ' '],
                    ['-', 'A', '-'],
                    [' ', '|', ' '],
                ],
                row: 1,
                col: 1,
                expected: true
            },
            {
                name: 'should not identify point with 3 connections as intersection',
                grid: [
                    [' ', '|', ' '],
                    ['-', '|', '|'],
                    [' ', '|', ' '],
                ],
                row: 1,
                col: 1,
                expected: false
            },
            {
                name: 'should not identify point with incompatible roads as intersection',
                grid: [
                    [' ', '-', ' '],
                    ['-', '|', '-'],
                    [' ', '|', ' '],
                ],
                row: 1,
                col: 1,
                expected: false
            }
        ])('$name', ({ grid, row, col, expected }) => {
            const pathfinder = new TestablePathfinder(grid);
            const result = pathfinder.exposedIsPointOnIntersection(row, col);
            expect(result).toBe(expected);
        });
    });
}); 