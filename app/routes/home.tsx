import { useState, useEffect } from "react";
import { Pathfinder } from "~/pathfinder/pathfinder";
import { VALID_EXAMPLES, INVALID_EXAMPLES } from "~/constants/examples";

export default function Home() {
  const [gridInput, setGridInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCoordinates, setErrorCoordinates] = useState<{row: number, col: number} | null>(null);
  const [parsedGrid, setParsedGrid] = useState<string[][]>([]);
  const [visitedPath, setVisitedPath] = useState<{row: number, col: number, character: string}[]>([]);
  const [animationStep, setAnimationStep] = useState(0);

  // Reset animation when new result comes in
  useEffect(() => {
    setAnimationStep(0);
  }, [result, visitedPath]);

  // Animate path traversal
  useEffect(() => {
    if (visitedPath.length === 0 || animationStep >= visitedPath.length) return;

    const timer = setTimeout(() => {
      setAnimationStep(prev => prev + 1);
    }, 500); // Adjust speed of animation here

    return () => clearTimeout(timer);
  }, [animationStep, visitedPath]);

  const handleSubmit = () => {
    try {
      // Parse the grid input
      const grid = gridInput
        .split("\n")
        .map(line => line.split(""));

      setParsedGrid(grid);
      
      const pathfinder = new Pathfinder(grid);
      const path = pathfinder.findPath();
      const allCharactersVisited = path.customData?.visitedCoordinates.map(x => x.character).join('');
      setVisitedPath(path.customData?.visitedCoordinates || []);
      setResult(path.isSuccessful ? `${allCharactersVisited}\n${path.customData?.collectedLetters}` : null);
      setError(path.errorDetails?.errorMessage || null);
      const errorCoordinates = path.errorDetails ? {row: path.errorDetails.row!, col: path.errorDetails.col!} : null;
      setErrorCoordinates(errorCoordinates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResult(null);
      setParsedGrid([]);
      setVisitedPath([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pathfinder</h1>
      
      {/* Valid examples */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Valid Examples</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {VALID_EXAMPLES.map((example, index) => (
            <button
              key={index}
              onClick={() => setGridInput(example.grid)}
              className="p-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 rounded transition-colors"
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>

      {/* Invalid examples */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Invalid Examples</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {INVALID_EXAMPLES.map((example, index) => (
            <button
              key={index}
              onClick={() => setGridInput(example.grid)}
              className="p-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 rounded transition-colors"
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input grid */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Enter your grid (one row per line):
        </label>
        <textarea
          className="w-full h-48 p-2 border rounded-md font-mono dark:bg-gray-800 dark:border-gray-700"
          value={gridInput}
          onChange={(e) => setGridInput(e.target.value)}
          placeholder="Example:
@---+
    |
    x"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Find Path
      </button>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-md">
          <pre>{result}</pre>
        </div>
      )}

      {/* Path visualization */}
      {parsedGrid.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Path Visualization</h2>
          <div className="grid-visualization font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            {parsedGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row?.length > 0 ?
                  row.map((cell, colIndex) => {
                    const isVisited = visitedPath
                      .slice(0, animationStep + 1)
                      .some(coord => coord.row === rowIndex && coord.col === colIndex);
                    const isCurrentStep = visitedPath[animationStep]?.row === rowIndex && 
                                        visitedPath[animationStep]?.col === colIndex;
                    
                    return (
                      <div 
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          w-8 h-8 flex items-center justify-center
                          ${errorCoordinates?.row === rowIndex && errorCoordinates?.col === colIndex ? 'bg-red-200' : ''}
                          ${isVisited ? 'bg-blue-200' : ''}
                          ${isCurrentStep ? 'bg-blue-500 text-white' : ''}
                          transition-colors duration-300
                        `}
                      >
                        {cell || ' '}
                      </div>
                    );
                  }) : <div key={`${rowIndex}`} className="w-full h-8" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
