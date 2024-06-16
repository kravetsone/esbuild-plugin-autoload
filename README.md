# esbuild-plugin-autoload

This [esbuild](https://esbuild.github.io/)/[Bun](https://bun.sh/docs/bundler) bundler plugin helps to use libraries for `autoload` endpoints, command and etc. At the build stage, it obtains what needs to be `import`-ed and includes it in the final file

> [!WARNING]
> For now, it runs only by [Bun](https://bun.sh/) runtime

# [Bun build](https://bun.sh/docs/bundler) usage

```ts
// @filename: build.ts
import { autoload } from "esbuild-plugin-autoload"; // default import also supported

await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir: "out",
    plugins: [autoload()],
}).then(console.log);
```

Then, build it with `bun build.ts` and run with `bun out/index.ts`

### Bun compile usage

You can bundle and then compile it into a [single executable binary file](https://bun.sh/docs/bundler/executables)

```ts
import { autoload } from "esbuild-plugin-autoload"; // default import also supported

await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir: "out",
    plugins: [autoload()],
}).then(console.log);

await Bun.$`bun build --compile out/index.js`;
```

> [!WARNING]
> You cannot use it in `bun build --compile` mode without extra step ([Feature issue](https://github.com/oven-sh/bun/issues/11895))

## Options

| Key        | Type   | Default                            | Description                                                         |
| ---------- | ------ | ---------------------------------- | ------------------------------------------------------------------- |
| pattern?   | string | "\*\*\/\*.{ts,tsx,js,jsx,mjs,cjs}" | [Glob patterns](<https://en.wikipedia.org/wiki/Glob_(programming)>) |
| directory? | string | "./src/routes"                     | The folder where something that will be autoloaded are located      |

### [esbuild](https://esbuild.github.io/) usage

```ts
// @filename: build.ts
import { autoload } from "esbuild-plugin-autoload"; // default import also supported
import esbuild from "esbuild";

await esbuild
    .build({
        entrypoints: ["src/index.ts"],
        outdir: "out",
        bundle: true,
        plugins: [autoload()],
    })
    .then(console.log);
```

Then, build it with `bun build.ts` and run with `bun out/index.ts`

### Supported `autoload`-ers

Sadly, this plugin can only work with supported libraries.

-   [`elysia-autoload`](https://github.com/kravetsone/elysia-autoload)
