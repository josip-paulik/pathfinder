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
        const validTests = [
            {
                name: 'basic path and collect ACB',
                file: 'basic-acb.txt',
                expectedLetters: 'ACB',
                expectedPath: '@---A---+|C|+---+|+-B-x'
            },
            {
                name: 'go straight through intersections and collect ABCD',
                file: 'straight-abcd.txt',
                expectedLetters: 'ABCD',
                expectedPath: '@|A+---B--+|+--C-+|-||+---D--+|x'
            },
            {
                name: 'collect letters on turns (ACB)',
                file: 'turns-acb.txt',
                expectedLetters: 'ACB',
                expectedPath: '@---A---+|||C---+|+-B-x'
            },
            {
                name: 'not collect letters twice (GOONIES)',
                file: 'goonies.txt',
                expectedLetters: 'GOONIES',
                expectedPath: '@-G-O-+|+-+|O||+-O-N-+|I|+-+|+-I-+|ES|x'
            },
            {
                name: 'handle compact space (BLAH)',
                file: 'compact-blah.txt',
                expectedLetters: 'BLAH',
                expectedPath: '@B+++B|+-L-+A+++A-+Hx'
            },
            {
                name: 'ignore stuff after end (AB)',
                file: 'ignore-after-end.txt',
                expectedLetters: 'AB',
                expectedPath: '@-A--+|+-B--x'
            }
        ];

        it.each(validTests)('should $name', ({ file, expectedLetters, expectedPath }) => {
            const grid = readExample(file);
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.isSuccessful).toBe(true);
            expect(result.customData?.collectedLetters).toBe(expectedLetters);
            expect(result.customData?.visitedCoordinates.map(c => c.character).join('')).toBe(expectedPath);
        });
    });

    describe('Invalid paths', () => {
        const invalidTests = [
            {
                name: 'fail with multiple start points',
                file: 'invalid/multiple-starts.txt',
                expectedError: 'more than one start points'
            },
            {
                name: 'fail with missing end point',
                file: 'invalid/missing-end.txt',
                expectedError: 'Start or end point not found'
            },
            {
                name: 'fail with missing start point',
                file: 'invalid/missing-start.txt',
                expectedError: 'Start or end point not found'
            },
            {
                name: 'fail with fake turn',
                file: 'invalid/fake-turn.txt'
            },
            {
                name: 'fail with broken path',
                file: 'invalid/broken-path.txt'
            },
            {
                name: 'fail with fork in path',
                file: 'invalid/fork.txt'
            },
            {
                name: 'fail with multiple starting paths',
                file: 'invalid/multiple-starting-paths.txt'
            },
            {
                name: 'fail with invalid character in path',
                file: 'invalid/invalid-character.txt',
                expectedError: 'Invalid character found'
            }
        ];

        it.each(invalidTests)('should $name', ({ file, expectedError }) => {
            const grid = readExample(file);
            const pathfinder = new Pathfinder(grid);
            const result = pathfinder.findPath();

            expect(result.isSuccessful).toBe(false);
            if (expectedError) {
                expect(result.errorDetails?.errorMessage).toContain(expectedError);
            }
        });
    });
});