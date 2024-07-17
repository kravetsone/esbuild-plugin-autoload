import fs from "node:fs/promises";
import path from "node:path";
import { type BunPlugin, Glob } from "bun";

export interface AutoloadOptions {
	pattern?: string;
	directory?: string;
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
			? options?.pattern ?? DEFAULT_PATTERN
			: DEFAULT_PATTERN;
	const directory =
		typeof options === "string"
			? options
			: options?.directory ?? DEFAULT_DIRECTORY;

	return {
		name: "autoload",
		setup(build) {
			build.onLoad(
				{
					filter:
						/(.*)(@gramio|GRAMIO)\/autoload(\/|\\)dist(\/|\\)index\.(js|mjs|cjs)/i,
				},
				async (args) => {
					let content = String(await fs.readFile(args.path));

					const glob = new Glob(pattern);

					const files = await Array.fromAsync(
						glob.scan({
							cwd: directory,
						}),
					);

					content = content.replace(
						"autoload(options) {",
						/* tsss */ `
						autoload(options) {
                        const fileSources = {
                            ${files
															.map(
																(file) => /* ts */ `
                                "${file}": await import("${path.resolve(directory, file).replace(/\\/gi, "\\\\")}"),
                                `,
															)
															.join("\n")}
                        }
                    `,
					);

					content = content.replace(
						/const file = (.*);/i,
						"const file = fileSources[path];",
					);
					content = content
						.replace("var fdir = require('fdir');", "")
						.replace('import { fdir } from "fdir";', "");
					content = content.replace(
						/const paths = (.*);/s,
						/* ts */ `const paths = [${files.map((file) => `"${file}"`).join(", ")}];`,
					);
					console.log(content);
					return { contents: content };
				},
			);

			build.onLoad(
				{ filter: /(.*)elysia-autoload(\/|\\)dist(\/|\\)index\.(js|mjs|cjs)/i },
				async (args) => {
					let content = String(await fs.readFile(args.path));

					const glob = new Glob(pattern);

					const files = await Array.fromAsync(
						glob.scan({
							cwd: directory,
						}),
					);

					content = content.replace(
						/new Bun\.glob\((.*)\)/i,
						/* ts */ `{
                        async *scan() {
                            ${files.map((file) => `yield "${file}";`).join("\n")}
                        }
                    }`,
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
                                "${file}": await import("${path.resolve(directory, file).replace(/\\/gi, "\\\\")}"),
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
					
					console.log(content);
					return { contents: content };
				},
			);
		},
	} satisfies BunPlugin;
}

export default autoload;
