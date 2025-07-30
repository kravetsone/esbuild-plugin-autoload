import fs from "node:fs";
import path from "node:path";
import type { BunPlugin } from "bun";

export const IS_BUN = typeof Bun !== "undefined";

if (!IS_BUN && !fs.globSync) throw new Error("Node@>=22 or Bun is required");

export function globSync(globPattern: string, globOptions: { cwd?: string }) {
	return IS_BUN
		? Array.from(new Bun.Glob(globPattern).scanSync(globOptions))
		: fs.globSync(globPattern, globOptions);
}

export interface AutoloadOptions {
	pattern?: string;
	directory?: string;
	debug?: boolean;
}

const fsUsageMock = /* ts */ `{
    default: {
        existsSync() {
            return true;
        },
        statSync() {
            return {
                isDirectory() {
                    return true;
                }
            }
        }
    }
}`;

const DEFAULT_PATTERN = "**/*.{ts,tsx,js,jsx,mjs,cjs}";
const DEFAULT_DIRECTORY = "./example/routes";

export function autoload(options?: AutoloadOptions): BunPlugin;
export function autoload(options?: string): BunPlugin;
export function autoload(options?: AutoloadOptions | string) {
	const pattern =
		typeof options === "object"
			? (options?.pattern ?? DEFAULT_PATTERN)
			: DEFAULT_PATTERN;
	const directory =
		typeof options === "string"
			? options
			: (options?.directory ?? DEFAULT_DIRECTORY);
	const debug = typeof options === "object" ? options?.debug ?? false : false;

	return {
		name: "autoload",
		setup(build) {
			build.onLoad(
				{
					filter:
						/(.*)(@gramio|GRAMIO)[/\\]autoload[/\\]dist[/\\]index\.(js|mjs|cjs)$/i,
				},
				async (args) => {
					let content = String(await fs.promises.readFile(args.path));

					const files = globSync(pattern, { cwd: directory });

					content = content.replace(
						"autoload(options) {",
						/* tsss */ `
						autoload(options) {
                        const fileSources = {
                            ${files
															.map(
																(file) => /* ts */ `
                                "${file}": await import("${path
																	.resolve(directory, file)
																	.replace(/\\/gi, "\\\\")}"),
                                `,
															)
															.join("\n")}
                        }
                    `,
					);

					content = content.replace(
						/const file = (.*);/i,
						"const file = fileSources[filePath];",
					);
					content = content
						.replace("var fdir = require('fdir');", "")
						.replace('import { fdir } from "fdir";', "");
					content = content.replace(
						/const paths = ([\s\S]*?);/m,
						/* ts */ `const paths = [${files
							.map((file) => `"${file}"`)
							.join(", ")}];`,
					);

					if (debug) console.log(content);

					return { contents: content };
				},
			);

			build.onLoad(
				{
					filter: /(.*)elysia-autoload(\/|\\)dist(\/|\\)index\.(js|mjs|cjs)/i,
				},
				async (args) => {
					let content = String(await fs.promises.readFile(args.path));

					const files = globSync(pattern, { cwd: directory });

					content = content.replace(
						"const files = globSync(globPattern, globOptions);",
						/* ts */ `const files = [${files
							.map((file) => `"${file}"`)
							.join(",")}];`,
					);

					content = content.replace(
						`import fs from 'node:fs';`,
						`var { default: fs} = ${fsUsageMock}`,
					);

					content = content.replace(
						"autoload(options = {}) {",
						/* tsss */ `autoload(options = {}) {
                        const fileSources = {
                            ${files
															.map(
																(file) => /* ts */ `
                                "${file}": await import("${path
																	.resolve(directory, file)
																	.replace(/\\/gi, "\\\\")}"),
                                `,
															)
															.join("\n")}
                        }
                    `,
					);

					content = content.replace(
						/const file = (.*);/i,
						"const file = fileSources[filePath];",
					);
					
					if (debug) console.log(content);

					return { contents: content };
				},
			);
		},
	} satisfies BunPlugin;
}

export default autoload;
