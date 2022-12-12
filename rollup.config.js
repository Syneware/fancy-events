import terser from '@rollup/plugin-terser';
import pluginTypescript from "@rollup/plugin-typescript";
import fs from "fs";

const banner = `/*!
 * Fancy Events
 * https://github.com/Syneware/fancy-events
 *
 * Copyright (c) 2022 Syneware
 * Licensed under the MIT license. https://raw.githubusercontent.com/Syneware/fancy-events/master/LICENSE
 */`;

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default [
    {
        input: "src/index.ts",
        output: [
            {
                name: "EventEmitter",
                file: pkg.main,
                format: "umd",
                banner,
            },
            {
                name: "EventEmitter",
                file: pkg.main.replace(".js", ".min.js"),
                format: "iife",
                banner,
                plugins: [terser()],
            },
        ],
        plugins: [
            pluginTypescript({target: "ES2020"}),
        ],
    },
];
