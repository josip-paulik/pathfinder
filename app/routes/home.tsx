import { useState } from "react";
import { Pathfinder } from "~/pathfinder/pathfinder";

export default function Home() {
  const [gridInput, setGridInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    try {
      // Parse the grid input
      const grid = gridInput
        .split("\n")
        .map(line => line.split(""));

      // Find start and end characters (assuming they are A and B)
      console.log(grid);
      const pathfinder = new Pathfinder(grid);
      const path = pathfinder.findPath();
      setResult(`${path.visitedCoordinates.map(x => x.character).join('')}\n${path.uniqueLetters.map(x => x.character).join('')}`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResult(null);
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
    </div>
  );
}
