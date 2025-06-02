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

export const INVALID_EXAMPLES: GridExample[] = [
    {
        name: "Multiple start points",
        grid: `@--A-@-+
       |
 x-B-+ C
     | |
     +-+`
    },
    {
        name: "Missing end point",
        grid: `@--A---+
       |
 B-+   C
   |   |
   +---+`
    },
    {
        name: "Missing start point",
        grid: `---A---+
       |
x-B-+  C
    |  |
    +--+`
    },
    {
        name: "Fake turn",
        grid: `@-A-+-B-x`
    },
    {
        name: "Broken path",
        grid: `@--A-+
     |

     B-x`
    },
    {
        name: "Fork in path",
        grid: `       x-B
         |
  @--A---+
         |
    x+   C
     |   |
     +---+`
    },
    {
        name: "Multiple starting paths",
        grid: `x-B-@-A-x`
    },
    {
        name: "Invalid character",
        grid: `@--A--?--+
         |
     +---B
     |
     x`
    }
]; 