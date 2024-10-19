import {DateTime} from "luxon"
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import lightningCSS from "@11tyrocks/eleventy-plugin-lightningcss";
import pluginRss from "@11ty/eleventy-plugin-rss";

export default async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "assets/fonts/subsetted": "fonts" });
  eleventyConfig.addPassthroughCopy({ "assets/index.js": "index.js" });
  eleventyConfig.addPassthroughCopy({ "assets/*.svg": "assets/" });
  eleventyConfig.addPassthroughCopy({ "assets/*.jpeg": "assets/" });
  eleventyConfig.addPassthroughCopy({ "assets/*.png": "assets/" });
  eleventyConfig.addPassthroughCopy({ "img/": "img/" });


  eleventyConfig.addFilter("date", (dateObj) => {
      return DateTime.fromISO(dateObj).toLocaleString(DateTime.DATE_MED);
  });

 	eleventyConfig.addFilter("dateToRfc3339", pluginRss.dateToRfc3339);

  eleventyConfig.addPlugin(lightningCSS);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		extensions: "html",
		formats: ["avif", "webp", "jpg"],
    widths: [700],
		defaultAttributes: {
			loading: "lazy",
			decoding: "async",
			sizes: "700px"
		},
	});

};
