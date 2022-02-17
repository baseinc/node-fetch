#!/usr/bin/env node
import util from "util";
import fs from 'fs';
import glob from "glob";
import babel from "@babel/core";
import { basename, dirname } from "path";

const globAsync = util.promisify(glob);

const pkgDir = 'vendor/data-uri-to-buffer';

const files = await globAsync(`${pkgDir}/dist/*`);
console.log(files);
const outDir = 'lib';
const outPath = `${pkgDir}/lib`;
fs.mkdirSync(outPath, { recursive: true });


for (let file of files) {
	const outFile = file.replace('dist', outDir);

	if (file.endsWith('.js')) {
		const ast = babel.transformFileSync(file, {
			plugins: [
				[
					"@babel/plugin-transform-modules-commonjs",
					{
						importInterop: "node",
					},
				],
			],
		});
		fs.writeFileSync(outFile, ast.code);
	} else {
		fs.copyFileSync(file, outFile);
	}
}
