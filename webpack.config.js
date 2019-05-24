const path = require('path');
const webpack = require('webpack');

const SRC_DIR = path.resolve(__dirname, 'src/client');
const DIST_DIR = path.resolve(__dirname, 'dist/client');

const config = {
    entry: path.join(SRC_DIR, '/index.tsx'),
    output: {
        path: DIST_DIR,
        filename: 'bundle.js',
        publicPath: '/dist/client'
    },
    devtool: 'inline-source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.jsx', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules)/,
                loader: 'awesome-typescript-loader'
            },
            {
                enforce: 'pre',
                test: /\.js?$/,
                exclude: /(node_modules)/,
                loader: 'source-map-loader'
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devServer: {
        contentBase: path.join(DIST_DIR, '/index.html'),
        publicPath: '/dist/client',
        compress: true,
        port: 8080,
        open: true,
        proxy: {
            '/api': {
                target: 'https://localhost:443',
                secure: false
            }
        }
    }
};
module.exports = config;
