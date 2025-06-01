import { Pathfinder } from "./pathfinder";
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const readExample = (path: string) => {
    return readFileSync(join(__dirname, '../examples', path), 'utf-8')
        .split('\n')
        .map(line => line.split(''));
};

describe('Pathfinder', () => {
    describe('Valid paths', () => {
        it('should find basic path and collect ACB', () => {
            const grid = readExample('basic-acb.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(true);
            expect(result.customData?.collectedLetters).toBe('ACB');
            expect(result.customData?.visitedCoordinates.map(c => c.character).join('')).toBe('@---A---+|C|+---+|+-B-x');
        });

        it('should go straight through intersections and collect ABCD', () => {
            const grid = readExample('straight-abcd.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(true);
            expect(result.customData?.collectedLetters).toBe('ABCD');
            expect(result.customData?.visitedCoordinates.map(c => c.character).join('')).toBe('@|A+---B--+|+--C-+|-||+---D--+|x');
        });

        it('should collect letters on turns (ACB)', () => {
            const grid = readExample('turns-acb.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(true);
            expect(result.customData?.collectedLetters).toBe('ACB');
            expect(result.customData?.visitedCoordinates.map(c => c.character).join('')).toBe('@---A---+|||C---+|+-B-x');
        });

        it('should not collect letters twice (GOONIES)', () => {
            const grid = readExample('goonies.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(true);
            expect(result.customData?.collectedLetters).toBe('GOONIES');
            expect(result.customData?.visitedCoordinates.map(c => c.character).join('')).toBe('@-G-O-+|+-+|O||+-O-N-+|I|+-+|+-I-+|ES|x');
        });

        it('should handle compact space (BLAH)', () => {
            const grid = readExample('compact-blah.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(true);
            expect(result.customData?.collectedLetters).toBe('BLAH');
            expect(result.customData?.visitedCoordinates.map(c => c.character).join('')).toBe('@B+++B|+-L-+A+++A-+Hx');
        });

        it('should ignore stuff after end (AB)', () => {
            const grid = readExample('ignore-after-end.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(true);
            expect(result.customData?.collectedLetters).toBe('AB');
            expect(result.customData?.visitedCoordinates.map(c => c.character).join('')).toBe('@-A--+|+-B--x');
        });
    });

    describe('Invalid paths', () => {
        it('should fail with multiple start points', () => {
            const grid = readExample('invalid/multiple-starts.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(false);
            expect(result.errorDetails?.errorMessage).toContain('more than one start points');
        });

        it('should fail with missing end point', () => {
            const grid = readExample('invalid/missing-end.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(false);
            expect(result.errorDetails?.errorMessage).toBe('Start or end point not found');
        });

        it('should fail with missing start point', () => {
            const grid = readExample('invalid/missing-start.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(false);
            expect(result.errorDetails?.errorMessage).toBe('Start or end point not found');
        });

        it('should fail with fake turn', () => {
            const grid = readExample('invalid/fake-turn.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(false);
        });

        it('should fail with broken path', () => {
            const grid = readExample('invalid/broken-path.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(false);
        });

        it('should fail with fork in path', () => {
            const grid = readExample('invalid/fork.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(false);
        });

        it('should fail with multiple starting paths', () => {
            const grid = readExample('invalid/multiple-starting-paths.txt');
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.resultSuccess).toBe(false);
        });
    });
});