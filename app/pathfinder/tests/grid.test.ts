import { describe, test, expect } from "vitest";
import { Grid } from '../grid';

describe('Grid', () => {
    describe('getPoint', () => {
        const grid = new Grid([
            ['A', 'B', 'C'],
            ['D', ' ', 'E'],
            ['F', 'G', 'H']
        ]);

        test('returns character at valid position', () => {
            expect(grid.getPoint(0, 0)).toBe('A');
            expect(grid.getPoint(2, 2)).toBe('H');
        });

        test('returns empty string for space character', () => {
            expect(grid.getPoint(1, 1)).toBe('');
        });

        test('returns empty string for negative indices', () => {
            expect(grid.getPoint(-1, 0)).toBe('');
            expect(grid.getPoint(0, -1)).toBe('');
            expect(grid.getPoint(-1, -1)).toBe('');
        });

        test('returns empty string for out of bounds indices', () => {
            expect(grid.getPoint(3, 0)).toBe('');
            expect(grid.getPoint(0, 3)).toBe('');
            expect(grid.getPoint(3, 3)).toBe('');
        });
    });

    describe('getNeighbors', () => {
        const grid = new Grid([
            ['A', 'B', 'C'],
            ['D', 'E', 'F'],
            ['G', 'H', 'I']
        ]);

        test('returns all neighbors for center position', () => {
            const neighbors = grid.getNeighbors(1, 1);
            expect(neighbors).toEqual({
                up: 'B',
                down: 'H',
                left: 'D',
                right: 'F'
            });
        });

        test('returns empty strings for edge position neighbors', () => {
            const topLeft = grid.getNeighbors(0, 0);
            expect(topLeft).toEqual({
                up: '',
                down: 'D',
                left: '',
                right: 'B'
            });

            const bottomRight = grid.getNeighbors(2, 2);
            expect(bottomRight).toEqual({
                up: 'F',
                down: '',
                left: 'H',
                right: ''
            });
        });
    });

    describe('runGridProcessing', () => {
        const grid = new Grid([
            ['@', '-', 'A'],
            ['|', '+', 'x'],
            ['B', '-', 'C']
        ]);

        test('processes valid characters successfully', () => {
            const characterProcesses = new Map();
            characterProcesses.set('@', () => ({ isSuccessful: true }));
            characterProcesses.set('x', () => ({ isSuccessful: true }));

            const regExpProcesses = new Map();
            const validCharacters = /[@x\+\-\|A-Z]/;

            const result = grid.runGridProcessing(characterProcesses, regExpProcesses, validCharacters);
            expect(result.isSuccessful).toBe(true);
        });

        test('returns error for invalid character', () => {
            const grid = new Grid([
                ['@', '-', 'A'],
                ['|', '?', 'x'], // Invalid character
                ['B', '-', 'C']
            ]);

            const characterProcesses = new Map();
            const regExpProcesses = new Map();
            const validCharacters = /[@x\+\-\|A-Z]/;

            const result = grid.runGridProcessing(characterProcesses, regExpProcesses, validCharacters);
            expect(result.isSuccessful).toBe(false);
            expect(result.errorDetails?.errorMessage).toContain('Invalid character found: ?');
            expect(result.errorDetails?.row).toBe(1);
            expect(result.errorDetails?.col).toBe(1);
        });

        test('returns error when character processor fails', () => {
            const errorMessage = 'Processing failed';
            const characterProcesses = new Map();
            characterProcesses.set('@', () => ({
                isSuccessful: false,
                errorDetails: { errorMessage }
            }));

            const regExpProcesses = new Map();
            const validCharacters = /[@x\+\-\|A-Z]/;

            const result = grid.runGridProcessing(characterProcesses, regExpProcesses, validCharacters);
            expect(result.isSuccessful).toBe(false);
            expect(result.errorDetails?.errorMessage).toBe(errorMessage);
        });

        test('returns error when regex processor fails', () => {
            const characterProcesses = new Map();
            const regExpProcesses = new Map();
            regExpProcesses.set(/[A-Z]/, () => ({
                isSuccessful: false,
                errorDetails: { errorMessage: 'Invalid letter' }
            }));
            const validCharacters = /[@x\+\-\|A-Z]/;

            const result = grid.runGridProcessing(characterProcesses, regExpProcesses, validCharacters);
            expect(result.isSuccessful).toBe(false);
            expect(result.errorDetails?.errorMessage).toContain('Validation failed for:');
        });

        test('skips empty spaces', () => {
            const grid = new Grid([
                ['@', ' ', 'A'],
                [' ', ' ', ' '],
                ['B', ' ', 'x']
            ]);

            const characterProcesses = new Map();
            characterProcesses.set('@', () => ({ isSuccessful: true }));
            characterProcesses.set('x', () => ({ isSuccessful: true }));

            const regExpProcesses = new Map();
            const validCharacters = /[@x\+\-\|A-Z]/;

            const result = grid.runGridProcessing(characterProcesses, regExpProcesses, validCharacters);
            expect(result.isSuccessful).toBe(true);
        });
    });
}); 