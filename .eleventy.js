const { parser } = require("./utils/kaku.js");
const CleanCSS = require("clean-css");
const { minify } = require("terser");
const Image = require("@11ty/eleventy-img");
const htmlMinTransform = require("./src/transforms/html-min-transform.js");

module.exports = function (eleventyConfig) {
	eleventyConfig.addDataExtension("kaku", (contents) => {
		const list = contents.split("====").map((x) => {
			let name = x.match(/NAME:((?:\\[\s\S]|[^\\])+?)\n/);
			let host = x.match(/HOST:((?:\\[\s\S]|[^\\])+?)\n/);
			let bref = x.match(/BREF:((?:\\[\s\S]|[^\\])+?)\n/);
			let priv = x.match(/PRIV:((?:\\[\s\S]|[^\\])+?)\n/);
			let menu = x.match(/MENU:((?:\\[\s\S]|[^\\])+?)\n/);
			let body = x.match(/BODY:((?:\\[\s\S]|[^\\])+?)$/);

			x = {
				name: name[1].trim(),
				id: name[1].trim().toLowerCase().replace(/ /g, "_"),
				slug: name[1].trim().toLowerCase().replace(/ /g, "-"),
				host: host[1].trim(),
				hostId: host[1].trim().toLowerCase().replace(/ /g, "_"),
				hostslug: host[1].trim().toLowerCase().replace(/ /g, "-"),
				bref: bref[1].trim(),
				priv: priv[1].trim(),
				menu: menu[1].trim(),
				body: parser(body[1].trim()),
			};
			return x;
		});

		const tree = toTree(list);
		const withCategories = setMainCategories(tree, null);
		const flattened = flatten(withCategories);
		return flattened;
	});

	eleventyConfig.addFilter("cssmin", function (code) {
		return new CleanCSS({}).minify(code).styles;
	});

	eleventyConfig.addNunjucksAsyncFilter(
		"jsmin",
		async function (code, callback) {
			try {
				const minified = await minify(code);
				callback(null, minified.code);
			} catch (err) {
				console.error("Terser error: ", err);
				// Fail gracefully.
				callback(null, code);
			}
		}
	);


	eleventyConfig.addTransform("htmlmin", htmlMinTransform);
	eleventyConfig.addPassthroughCopy("src/assets");


	(async () => {
		let url = "./src/_data/media"
		let stats = await Image(url, {
		widths: [300]
		});
	
		console.log( stats );
	})();

	return {
		templateFormats: ["md", "njk", "html", "liquid"],
		htmlTemplateEngine: "njk",
		passthroughFileCopy: true,
		dir: {
			input: "src",
			// better not use "public" as the name of the output folder (see above...)
			output: "_site",
			includes: "_includes",
			data: "_data",
		},
	};
};

function setMainCategories(arr, category) {
	for (var i = 0; i < arr.length; i++) {
		const el = arr[i];

		if (el.hostslug === "") {
			category = el.slug;
			el.category = el.slug;
		} else if (el.hostslug === "home") {
			category = el.slug;
			el.category = el.slug;
		} else {
			el.category = category;
		}
		if (el.children.length > 0) {
			setMainCategories(el.children, category);
		}
	}
	return arr;
}

function toTree(list) {
	var map = {},
		node,
		roots = [],
		i;

	for (i = 0; i < list.length; i += 1) {
		map[list[i].id] = i; // initialize the map
		list[i].children = []; // initialize the children
	}

	for (i = 0; i < list.length; i += 1) {
		node = list[i];
		if (node.name === "Home") {
			node.hostId = "";
		}
		if (node.hostId !== "") {
			list[map[node.hostId]].children.push(node);
		} else {
			roots.push(node);
		}
	}
	return roots;
}

const flatten = (pages) => {
	let children = [];

	return pages
		.map((m) => {
			if (m.children && m.children.length) {
				children = [...children, ...m.children];
			}
			return m;
		})
		.concat(children.length ? flatten(children) : children);
};
