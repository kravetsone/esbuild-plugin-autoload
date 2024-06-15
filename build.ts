import { $ } from "bun";

await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
}).then(console.log);

await $`tsc --emitDeclarationOnly`;
