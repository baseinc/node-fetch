#!/usr/bin/env node
import util from "util";
import fs from 'fs';
import path from 'path';
import glob from "glob";
import babel from "@babel/core";
import { basename, dirname } from "path";

const globAsync = util.promisify(glob);

const pkgDir = 'vendor/fetch-blob';

const files = await globAsync(`${pkgDir}/*.{js,d.ts,cjs}`);
console.log(files);
const outDir = 'lib';
const outPath = `${pkgDir}/lib`;
fs.mkdirSync(outPath, { recursive: true });


for (let file of files) {
	const outFile = path.join(outPath, basename(file));

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
