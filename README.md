# Pathfinder Challenge Solution

This is my solution to the Software Sauna [Code Challenge](https://github.com/softwaresauna/code-challenge). The solution is implemented as a React application with TypeScript, providing both a visual interface and comprehensive test coverage. For testing, Vitest was the chosen framework because of ease of setup.

## Project Structure

Key files for review:

```
app/
├── pathfinder/
│   ├── pathfinder.ts     # Core pathfinding logic
│   |── grid.ts # Handling grid operations
|   └-─ tests
|         ├── grid.test.ts # Grid related tests for its operations
|         ├── pathfinder.test.ts # Integration tests for invalid and valid paths
|         └── pathfinderMovement.test.ts # Unit tests testing micro movements on the grid
├── routes/
│   └── home.tsx         # React UI implementation
└── examples/            # Grid examples used in tests
```

### Core Implementation Files

- `app/pathfinder/pathfinder.ts`: Contains the main `Pathfinder` class that implements the path-finding algorithm. The class handles:
  - Grid validation
  - Path traversal
  - Letter collection
  - Error handling with detailed messages

- `app/pathfinder/tests/pathfinder.test.ts`: Comprehensive test suite covering:
  - All valid examples from the challenge (ACB, ABCD, GOONIES, etc.)
  - Invalid cases (multiple starts, missing end, broken paths, etc.)
  - Edge cases and error conditions
  - 
- `app/pathfinder/tests/pathfinderMovement.test.ts`: Comprehensive test suite covering:
  - All possible cases for each character and how the movement should be handled on each character
  - Edge cases and error conditions
 
- `app/pathfinder/grid.ts`: Contains the main `Grid` class that handles various grid operations. The class handles:
  - Get points from various coordinates(handle coordinates outside of the grid)
  - Get neighbours from given coordinates
  - Run grid processing so that the programs which use Grid, don't even have direct influence on grid

- `app/pathfinder/grid.test.ts`: Comprehensive test suite covering:
  - Getting points from various coordinates
  - Getting neighbors of points from various coordinates
  - Running processing on grid

- `app/routes/home.tsx`: React component providing:
  - Visual grid input interface
  - Example grid buttons
  - Animated path visualization
  - Error display
  - Dark mode support

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) to view the application

## Running Tests

Run all tests:
```bash
npm test
```


## Implementation Details

The solution follows these key principles:

1. **Validation First**: The pathfinder validates the entire grid before attempting traversal:
   - Checks for valid characters
   - Verifies start/end points

2. **Clear Error Reporting**: When invalid paths are detected, the error messages include:
   - Specific error type
   - Row/column coordinates
   - Detailed description

3. **Efficient Path Finding**: The algorithm:
   - Follows paths using direction tracking
   - Collects uppercase letters
   - Handles intersections and turns
   - Stops at the first valid endpoint

4. **Comprehensive Testing**: The test suite covers:
   - Uses Vitest
   - All example cases from the challenge
   - Edge cases and error conditions
   - Invalid grid configurations

## Visual Interface

The web interface provides:
1. A textarea for grid input
2. Pre-loaded example grids from the challenge
3. Visual path animation
4. Clear error messages
5. Dark mode support

## Additional Notes

- The implementation strictly follows the challenge rules regarding valid characters and path rules
- Error handling is comprehensive and user-friendly
- The visual interface makes it easy to test different grid configurations
- The code is written in TypeScript with full type safety
