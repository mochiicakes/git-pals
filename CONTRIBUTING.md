# Contributing to git-pals

Thanks for helping! For bigger changes, please open an issue first.

## Run it locally

You need Node.js 20 or newer.

```sh
npm install
npm test          # tests
npm run preview   # renders every look into preview/index.html
```

## Where things are

| File            | What it does                              |
| --------------- | ----------------------------------------- |
| `src/main.ts`   | The Action: inputs → stats → SVG → commit |
| `src/github.ts` | Reads activity and works out the numbers  |
| `src/pet.ts`    | Picks the stage and mood                  |
| `src/render.ts` | Draws the `git-pal.exe` window            |
| `src/pixels.ts` | Small image helpers                       |
| `assets/`       | The pixel art (PNG)                       |

## Changing the art

1. Edit the PNGs in `assets/`. Sprites are strips of 64 × 64 frames; windows and backgrounds are 80 × 80.
2. Run `npm run assets` to bundle them into `src/assets.ts`.
3. Run `npm test -- -u` and look at the updated images in `test/__snapshots__/`.

## Before opening a pull request

- `npm run all` passes.
- Commit the rebuilt `dist/` if you changed `src/`.
- Never use a real token in tests.
