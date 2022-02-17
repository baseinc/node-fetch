#!/usr/bin/env node
import util from "util";
import fs from 'fs';
import glob from "glob";
import babel from "@babel/core";
import { dirname } from "path";

const globAsync = util.promisify(glob);

const files = await globAsync("src/**/*.js");
console.log(files);
const outDir = 'lib';

for (let file of files) {
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
	const outFile = file.replace('src', outDir);
	fs.mkdirSync(dirname(outFile), { recursive: true });
	fs.writeFileSync(outFile, ast.code);
}
