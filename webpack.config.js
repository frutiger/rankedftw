var webpack = require("webpack");
var path = require("path");
const merge = require('webpack-merge');


var commonSettings = {
    entry: {
        index: "./site/js/all.js",
    },
    output: {
        path: path.join(__dirname, "site/static"),
        filename: "site.js"
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
    devtool: 'source-map',
};

if (process.env.PROD_JS) {
    console.info("production mode");

    const TerserPlugin = require('terser-webpack-plugin');
    
    module.exports = merge(commonSettings, {
        mode: "production",
        devtool: "source-map",
        optimization: {
            minimize: true,
            minimizer: [new TerserPlugin({
                sourceMap: true,
            })],
        },
        plugins: [
            new webpack.LoaderOptionsPlugin({
                minimize: true,
            })
        ],
    });
}
else {
    console.info("development mode");
    
    module.exports = merge(commonSettings, {
        mode: "development",
        devtool: "inline-source-map",
        plugins: [
        ],
    });
}
