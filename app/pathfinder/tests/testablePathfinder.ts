import type { NeighborPoints } from '../grid';
import { Pathfinder } from '../pathfinder';
import type { Direction, MovementResult } from '../pathfinder';

export class TestablePathfinder extends Pathfinder {
    public exposedHandleStartCharacter(row: number, col: number): MovementResult {
        return this.handleStartCharacter(row, col);
    }

    public exposedGetStartingMove(row: number, col: number): MovementResult {
        return this.getStartingMove(row, col);
    }

    public exposedHandleTurn(row: number, col: number, lastDirection: Direction): MovementResult {
        return this.handleTurn(row, col, lastDirection);
    }

    public exposedCheckTurn(row: number, col: number) {
        return this.checkTurn(row, col);
    }

    public exposedGetNextTurnMove(row: number, col: number, lastDirection: Direction): MovementResult {
        return this.getNextTurnMove(row, col, lastDirection);
    }

    public exposedHandleRoad(row: number, col: number, lastDirection: Direction): MovementResult {
        return this.handleRoad(row, col, lastDirection);
    }

    public exposedGetNextRoadMove(row: number, col: number, lastDirection: Direction): MovementResult {
        return this.getNextRoadMove(row, col, lastDirection);
    }

    public exposedHandleLetter(row: number, col: number, lastDirection: Direction): MovementResult {
        return this.handleLetter(row, col, lastDirection);
    }

    public exposedGetNextLetterMove(row: number, col: number, lastDirection: Direction): MovementResult {
        return this.getNextLetterMove(row, col, lastDirection);
    }

    public exposedTryContinueDirection(row: number, col: number, lastDirection: Direction): MovementResult {
        return this.tryContinueDirection(row, col, lastDirection);
    }

    public exposedTryTurnFromDirection(row: number, col: number, lastDirection: Direction): MovementResult {
        return this.tryTurnFromDirection(row, col, lastDirection);
    }

    public exposedCanMoveLeft(row: number, col: number): boolean {
        return this.canMoveLeft(row, col);
    }

    public exposedCanMoveUp(row: number, col: number): boolean {
        return this.canMoveUp(row, col);
    }

    public exposedCanMoveDown(row: number, col: number): boolean {
        return this.canMoveDown(row, col);
    }

    public exposedCanMoveRight(row: number, col: number): boolean {
        return this.canMoveRight(row, col);
    }

    public exposedIsPointOnIntersection(row: number, col: number): boolean {
        return this.isPointOnIntersection(row, col);
    }

} 