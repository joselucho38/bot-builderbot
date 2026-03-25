import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {}), /node_modules/]

export default {
    input: 'src/app.ts',
    output: {
        file: 'dist/app.js',
        format: 'esm',
        sourcemap: true,
    },
    external,
    plugins: [
        resolve({
            exportConditions: ['node'],
            preferBuiltins: true,
        }),
        commonjs(),
        json(),
        typescript(),
    ],
}
