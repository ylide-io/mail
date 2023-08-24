const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { aliasWebpack } = require('react-app-alias');

module.exports = function override(rawConfig) {
	const config = aliasWebpack({})(rawConfig);
	const fallback = config.resolve.fallback || {};
	Object.assign(fallback, {
		crypto: require.resolve('crypto-browserify'),
		stream: require.resolve('stream-browserify'),
		assert: require.resolve('assert'),
		http: require.resolve('stream-http'),
		https: require.resolve('https-browserify'),
		os: require.resolve('os-browserify'),
		url: require.resolve('url'),
	});
	config.resolve.fallback = fallback;
	config.plugins = (config.plugins || []).concat([
		// new BundleAnalyzerPlugin(),
		new webpack.ProvidePlugin({
			process: 'process/browser',
			Buffer: ['buffer', 'Buffer'],
		}),
	]);
	config.module.rules.push({
		test: /\.(js|mjs|jsx|ts|tsx)$/,
		use: ['source-map-loader'],
		enforce: 'pre',
	});
	config.module.rules.push({
		test: /\.(css|scss|sass)$/,
		use: [
			{
				loader: 'sass-loader',
				options: {
					additionalData: "@import 'mixins.scss';",
					sassOptions: {
						includePaths: ['src/styles'],
					},
				},
			},
		],
	});
	// config.target.target = 'es2022';
	return config;
};
