import { useState, useEffect } from "react";
import { Pathfinder } from "~/pathfinder/pathfinder";

export default function Home() {
  const [gridInput, setGridInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedGrid, setParsedGrid] = useState<string[][]>([]);
  const [visitedPath, setVisitedPath] = useState<{row: number, col: number, character: string}[]>([]);
  const [animationStep, setAnimationStep] = useState(0);

  // Reset animation when new result comes in
  useEffect(() => {
    setAnimationStep(0);
  }, [result]);

  // Animate path traversal
  useEffect(() => {
    if (visitedPath.length === 0 || animationStep >= visitedPath.length) return;

    const timer = setTimeout(() => {
      setAnimationStep(prev => prev + 1);
    }, 300); // Adjust speed of animation here

    return () => clearTimeout(timer);
  }, [animationStep, visitedPath]);

  const handleSubmit = () => {
    try {
      // Parse the grid input
      const grid = gridInput
        .split("\n")
        .map(line => line.split(""));

      setParsedGrid(grid);
      
      console.log(grid);
      const pathfinder = new Pathfinder(grid);
      const path = pathfinder.findPath();
      setVisitedPath(path.visitedCoordinates);
      setResult(`${path.visitedCoordinates.map(x => x.character).join('')}\n${path.uniqueLetters.map(x => x.character).join('')}`);
      setError(null);
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
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Enter your grid (one row per line):
        </label>
        <textarea
          className="w-full h-48 p-2 border rounded-md font-mono"
          value={gridInput}
          onChange={(e) => setGridInput(e.target.value)}
          placeholder="Example:
@---+
    |
    x"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Find Path
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
          <pre>{result}</pre>
        </div>
      )}

      {parsedGrid.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Path Visualization</h2>
          <div className="grid-visualization font-mono bg-gray-100 p-4 rounded-md">
            {parsedGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => {
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
                        ${isVisited ? 'bg-blue-200' : ''}
                        ${isCurrentStep ? 'bg-blue-500 text-white' : ''}
                        transition-colors duration-300
                      `}
                    >
                      {cell || ' '}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
