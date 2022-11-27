const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const getPublicUrlOrPath = require('react-dev-utils/getPublicUrlOrPath');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const {WebpackManifestPlugin } = require('webpack-manifest-plugin');
const appDirectory = fs.realpathSync(process.cwd());
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const babelRuntimeEntry = require.resolve('babel-preset-react-app');
const babelRuntimeEntryHelpers = require.resolve(
    '@babel/runtime/helpers/esm/assertThisInitialized',
    { paths: [babelRuntimeEntry] }
);
const babelRuntimeRegenerator = require.resolve('@babel/runtime/regenerator', {
    paths: [babelRuntimeEntry],
});

const BUILD_PATH = path.resolve(path.resolve(__dirname), 'build')

const moduleFileExtensions = ['web.mjs', 'mjs', 'web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', 'json', 'web.jsx', 'jsx',];
const resolveModule = (resolveFn, filePath) => {
    const extension = moduleFileExtensions.find(extension =>
        fs.existsSync(resolveFn(`${filePath}.${extension}`))
    );

    if (extension) {
        return resolveFn(`${filePath}.${extension}`);
    }

    return resolveFn(`${filePath}.js`);
};

module.exports = webpackEnv => {
    const mode = webpackEnv.WEBPACK_SERVE ? 'development' : 'production';
    
    const isEnvDevelopment = mode === 'development'
    const isEnvProduction = mode === 'production'

    const publicUrlOrPath = getPublicUrlOrPath(isEnvDevelopment, require(resolveApp('package.json')).homepage, process.env.PUBLIC_URL);


    const getStyleLoaders = (cssOptions, preProcessor) => {
        const loaders = [
            require.resolve('style-loader'),
            {
                loader: MiniCssExtractPlugin.loader,
                options: publicUrlOrPath.startsWith('.')
                    ? { publicPath: '../../' }
                    : {},
            },
            {
                loader: require.resolve('css-loader'),
                options: cssOptions,
            },
            {
                loader: require.resolve('postcss-loader'),
                options: {
                    postcssOptions: {
                        ident: 'postcss',
                        config: false,
                        plugins: [
                            'postcss-flexbugs-fixes',
                            [
                                'postcss-preset-env',
                                {
                                    autoprefixer: {
                                        flexbox: 'no-2009',
                                    },
                                    stage: 3,
                                },
                            ],
                            'postcss-normalize',
                        ],
                    },
                    sourceMap: false,
                },
            },
        ].filter(Boolean);
        if (preProcessor) {
            loaders.push(
                {
                    loader: require.resolve('resolve-url-loader'),
                    options: {
                        sourceMap: false,
                        root: resolveApp('src'),
                    },
                },
                {
                    loader: require.resolve(preProcessor),
                    options: {
                        sourceMap: true,
                    },
                }
            );
        }
        return loaders;
    };
    
    return {
        name: require(resolveApp('package.json')).name,
        mode: mode,
        entry: resolveModule(resolveApp, 'src/index'),
        output: {
            path: isEnvDevelopment ? path.resolve(__dirname, 'dist') : path.resolve(__dirname, 'build'),
            filename: isEnvDevelopment ? 'js/bundle.js' : 'js/bundle.[chunkhash].js',
            publicPath: '/dist/',
        },
        module: {
            rules: [
                {
                    oneOf: [
                        {
                            test: /\.(js|mjs|jsx|ts|tsx)$/,
                            include: [path.resolve(__dirname, "src")],
                            loader: "babel-loader",
                            options: {
                                presets: ["@babel/preset-env", ["@babel/preset-react", { "runtime": "automatic" }]],
                                plugins: [
                                    "@babel/plugin-proposal-class-properties",
                                    "react-hot-loader/babel",
                                ],
                            },
                        },
                        {
                            test: /\.(jpg|jpeg|gif|png|svg|ico)?$/,
                            options: {
                                name: 'src/assets/[name].[ext]',
                            },
                            loader: 'file-loader',
                        },
                        {
                            test: cssRegex,
                            exclude: cssModuleRegex,
                            use: getStyleLoaders({
                                importLoaders: 1,
                                sourceMap: false,
                                modules: {
                                    mode: 'icss',
                                },
                            }),
                            sideEffects: true,
                        },
                        {
                            test: cssModuleRegex,
                            use: getStyleLoaders({
                                importLoaders: 1,
                                sourceMap: false,
                                modules: {
                                    mode: 'local',
                                    getLocalIdent: getCSSModuleLocalIdent,
                                },
                            }),
                        },
                        {
                            test: sassRegex,
                            exclude: sassModuleRegex,
                            use: getStyleLoaders(
                                {
                                    importLoaders: 3,
                                    sourceMap: false,
                                    modules: {
                                        mode: 'icss',
                                    },
                                },
                                'sass-loader'
                            ),
                            sideEffects: true,
                        },
                        {
                            test: sassModuleRegex,
                            use: getStyleLoaders(
                                {
                                    importLoaders: 3,
                                    sourceMap: false,
                                    modules: {
                                        mode: 'local',
                                        getLocalIdent: getCSSModuleLocalIdent,
                                    },
                                },
                                'sass-loader'
                            ),
                        },
                        {
                            exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
                            type: 'asset/resource',
                        }
                    ]
                },
            ],
        },
        resolve: {
            modules: ["node_modules", path.resolve(__dirname, "src")],
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.scss'],
            plugins: [
                new ModuleScopePlugin(resolveApp('src'), [
                    resolveApp('package.json'),
                    babelRuntimeEntry,
                    babelRuntimeEntryHelpers,
                    babelRuntimeRegenerator,
                ]),
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({ template: path.resolve(path.resolve(__dirname), 'public', 'index.html') }),
            new MiniCssExtractPlugin({
                filename: '[name].css'
            }),
            new webpack.ProvidePlugin({
                process: 'process',
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
            new WebpackManifestPlugin({
                fileName: 'manifest.json',
                basePath: '/'
            }),
        ],
        cache: {
            type: isEnvDevelopment ? 'memory' : 'filesystem',
        },
        optimization: {
            splitChunks: {
              chunks: 'async',
              minSize: 20000,
              minRemainingSize: 0,
              minChunks: 1,
              maxAsyncRequests: 30,
              maxInitialRequests: 30,
              enforceSizeThreshold: 50000,
              cacheGroups: {
                commons: {
                  test: /[\\/]node_modules[\\/]/,
                  name: 'vendors',
                  chunks: 'all'
                }
              },
            },
          },
        devServer: {
            port: 3000,
            historyApiFallback: true,
            compress: true,
        }
    }
}