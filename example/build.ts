import autoload from "../src";

await Bun.build({
	entrypoints: ["index.ts"],
	outdir: "out",
	plugins: [
		autoload({
			pattern: "**/*.{ts,tsx,js,jsx,mjs,cjs}",
			directory: "/routes",
		}),
	],
}).then(console.log);
