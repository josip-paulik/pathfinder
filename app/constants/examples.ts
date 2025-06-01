export type GridExample = {
    name: string;
    grid: string;
};

export const VALID_EXAMPLES: GridExample[] = [
    {
        name: "Basic example",
        grid: `@---A---+
        |
x-B-+   C
    |   |
    +---+`
    },
    {
        name: "Go straight through intersections",
        grid: `@
| +-C--+
A |    |
+---B--+
  |      x
  |      |
  +---D--+`
    },
    {
        name: "Letters on turns",
        grid: `@---A---+
        |
x-B-+   |
    |   |
    +---C`
    },
    {
        name: "Do not collect twice",
        grid: `     +-O-N-+
     |     |
     |   +-I-+
 @-G-O-+ | | |
     | | +-+ E
     +-+     S
             |
             x`
    },
    {
        name: "Compact space",
        grid: ` +-L-+
 |  +A-+
@B+ ++ H
 ++    x`
    },
    {
        name: "Ignore after end",
        grid: `  @-A--+
       |
       +-B--x-C--D`
    }
]; 