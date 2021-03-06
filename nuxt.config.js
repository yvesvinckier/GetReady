const configFile = require('./config.json');

let config;
if (process.env.NODE_ENV == 'production' || process.env.DEPLOY_ENV === 'GH_PAGES') {
	config = configFile.prod;
} else {
	config = configFile.prev;
}

const path = require('path');
let FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const webpack = require('webpack');

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const routerBase = process.env.DEPLOY_ENV === 'GH_PAGES' ? '/taack/' : '/';

module.exports = {
	router: {
		base: routerBase,
		extendRoutes(routes, resolve) {
			routes.push({
				name: 'intro',
				path: '/intro',
				component: resolve(__dirname, 'pages/index.vue')
			});
			routes.push({
				name: 'page',
				path: '/:slug',
				component: resolve(__dirname, 'pages/index.vue')
			});
		}
	},
	generate: {
		routes: [
			'/s-organiser',
			'/visualiser',
			's-organiser'
		]
	},
	/*
	** Headers of the page
	*/
	env: {
		URL: config.url,
		PATH: config.path,
		__PROD__: process.env.NODE_ENV == 'production'
	},
	head: {
		title: 'Reach your goal!',
		meta: [
			{ charset: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ name: 'robots', content: process.env.NODE_ENV == 'production' ? 'index, follow' : 'noindex, nofollow' },
			{ hid: 'description', name: 'description', content: 'Description' },
			{ name: 'theme-color', content: '#f9f4ef' },
			{ name: 'twitter:card', content: 'summary' },
			{ name: 'twitter:site', content: config.url },
			{ name: 'og:url', content: config.url },
			{ hid: 'og:title', name: 'og:title', content: 'Reach your goal!' },
			{ name: 'og:image', content: config.url + '/background.jpg' },
			{ hid: 'og:description', name: 'og:description', content: 'Description' }
		],
		link: [
			{ rel: 'mask-icon', color: '#f9f4ef', href: '/safari-pinned-tab.svg' },
			{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Open+Sans:300,400,700,600,600i,300i' }
		]
	},
	css: [
		'~assets/scss/variables.scss',
		'~assets/scss/main.scss',
		'~assets/scss/fonts.scss',
		'normalize.css'
	],
	modules: [
		['@nuxtjs/google-analytics', { ua: config.analytics }],
		'@nuxtjs/sitemap'
	],
	plugins: [
		'~/plugins/i18n.js',
		{ src: '~/plugins/Hammer.js', ssr: false }
	],
	/*
	** Customize the progress-bar color
	*/
	loading: { color: '#000000' },
	/*
	** Build configuration
	*/
	build: {
		/*
		** Run ESLINT on save
		*/
		extend(config, ctx) {
			config.resolve.alias['~core'] = path.resolve(__dirname, 'core/');

			if (ctx.isClient) {
				config.module.rules.push({
					enforce: 'pre',
					test: /\.(js|vue)$/,
					loader: 'eslint-loader',
					exclude: /(node_modules)/
				});
			}
		},
		plugins: [
			new FaviconsWebpackPlugin('static/favicon.png'),
			new webpack.ProvidePlugin({
				'THREE': 'three'
			})
		],
		vendor: [
			'gsap/TweenMax',
			'gsap/ScrollToPlugin',
			'marked',
			'three',
			'three/examples/js/renderers/CSS3DRenderer',
			'three/examples/js/loaders/OBJLoader',
			'vue2-hammer',
			'lining.js/src/lining.js',
			'lottie-web'
		]
	}
};
