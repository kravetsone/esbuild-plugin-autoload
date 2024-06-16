import autoload from "../../src";

await Bun.build({
	entrypoints: ["./index.ts"],
	outdir: "out",
	target: "bun",
	plugins: [
		autoload({
			directory: "./commands",
		}),
	],
}).then(console.log);
