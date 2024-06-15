import autoload from "./src";

await Bun.build({
	entrypoints: ["example/index.ts"],
	outdir: "out",
	plugins: [
		autoload({
			pattern: "**/*.{ts,tsx,js,jsx,mjs,cjs}",
			directory: "./example/routes",
		}),
	],
}).then(console.log);
