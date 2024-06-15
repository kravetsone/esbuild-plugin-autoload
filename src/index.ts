import fs from "node:fs/promises";
import path from "node:path";
import { type BunPlugin, Glob } from "bun";

export interface AutoloadOptions {
	pattern?: string;
	directory?: string;
}

export default function autoload(options: AutoloadOptions) {
	const pattern = options.pattern ?? "**/*.{ts,tsx,js,jsx,mjs,cjs}";
	const directory = options.directory ?? "./example/routes";

	return {
		name: "autoload",
		setup(build) {
			build.onLoad({ filter: /-autoload\/dist\/index.js/i }, async (args) => {
				console.log(args);
				let content = String(await fs.readFile(args.path));

				const glob = new Glob(pattern);

				const files = await Array.fromAsync(
					glob.scan({
						cwd: directory,
					}),
				);
				console.log(files);
				content = content.replace(
					/new Bun\.glob\((.*)\)/i,
					/* ts */ `{
                        async *scan() {
                            ${files.map((file) => `yield "${file}"`)}
                        }
                    }`,
				);

				content = content.replace(
					`require("node:fs")`,
					/* ts */ `{
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
                    }`,
				);

				content = content.replace(
					"// autoload-plugin-begin",
					/* ts */ `
                        const fileSources = {
                            ${files.map(
															(file) => /* ts */ `
                                "${file}": await import("${path.resolve(directory, file)}"),
                                `,
														)}
                        }
                    `,
				);

				content = content.replace(
					/const file = (.*);/i,
					"const file = fileSources[filePath];",
				);

				console.log(content);
				return { contents: content };
			});
		},
	} satisfies BunPlugin;
}
