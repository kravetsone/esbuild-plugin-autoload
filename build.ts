import { $ } from "bun";

await Bun.build({
	entrypoints: ["./src/index.ts"],
    target: "bun",
	outdir: "./dist",
}).then(console.log);

await $`tsc --emitDeclarationOnly`;
