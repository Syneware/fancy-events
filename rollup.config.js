import {terser} from "rollup-plugin-terser";
import pluginTypescript from "@rollup/plugin-typescript";
import pluginCommonjs from "@rollup/plugin-commonjs";
import pluginNodeResolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json";

const inputFileName = "src/index.ts";

export default [
    {
        input: inputFileName,
        output: [
            {
                name: "EventEmitter",
                file: pkg.browser,
                format: "iife",
            },
            {
                name: "EventEmitter",
                file: pkg.browser.replace(".js", ".min.js"),
                format: "iife",
                plugins: [terser()],
            },
        ],
        plugins: [
            pluginTypescript({target: "es6"}),
            pluginCommonjs({extensions: [".js", ".ts"]}),
            pluginNodeResolve({browser: true}),
        ],
    },

    // ES
    {
        input: inputFileName,
        output: [
            {
                file: pkg.module,
                format: "es",
                exports: "named",
            },
        ],
        plugins: [
            pluginTypescript({target: 'ES2020'}),
            pluginCommonjs({extensions: [".js", ".ts"]}),
            pluginNodeResolve({browser: false}),
        ],
    },

    // CommonJS
    {
        input: inputFileName,
        output: [
            {
                file: pkg.main,
                format: "cjs",
                exports: "default",
            },
        ],
        plugins: [
            pluginTypescript({target: 'ES2020'}),
            pluginCommonjs({extensions: [".js", ".ts"]}),
            pluginNodeResolve({browser: false}),
        ],
    },
];
