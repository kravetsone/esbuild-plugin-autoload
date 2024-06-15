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

export function autoload(options?: AutoloadOptions) {
	const pattern = options?.pattern ?? "**/*.{ts,tsx,js,jsx,mjs,cjs}";
	const directory = options?.directory ?? "./example/routes";

	return {
		name: "autoload",
		setup(build) {
			build.onLoad(
				{ filter: /(.*)-autoload(\/|\\)dist(\/|\\)index\.(js|mjs|cjs)/i },
				async (args) => {
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

					content = content.replace(`require("node:fs")`, fsUsageMock);
					content = content.replace(
						`import fs from "node:fs";`,
						`var { default: fs} = ${fsUsageMock}`,
					);

					content = content.replace(
						"const fileSources = {}",
						/* ts */ `
                        const fileSources = {
                            ${files.map(
															(file) => /* ts */ `
                                "${file}": await import("${path.resolve(directory, file).replace(/\\/gi, "\\\\")}"),
                                `,
														)}
                        }
                    `,
					);

					content = content.replace(
						/const file = (.*);/i,
						"const file = fileSources[filePath];",
					);

					return { contents: content };
				},
			);
		},
	} satisfies BunPlugin;
}

export default autoload;
