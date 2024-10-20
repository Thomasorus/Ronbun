import { DateTime } from "luxon";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import lightningCSS from "@11tyrocks/eleventy-plugin-lightningcss";
import htmlmin from "html-minifier-terser";

export default async function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "assets/fonts/subsetted": "fonts" });
  eleventyConfig.addPassthroughCopy({ "assets/index.js": "index.js" });
  eleventyConfig.addPassthroughCopy({ "assets/*.svg": "assets/" });
  eleventyConfig.addPassthroughCopy({ "assets/*.jpeg": "assets/" });
  eleventyConfig.addPassthroughCopy({ "assets/*.png": "assets/" });
  eleventyConfig.addPassthroughCopy({ "img/": "img/" });

  eleventyConfig.addFilter("genDates", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
  });

  eleventyConfig.addFilter("dateToRfc3339", dateToRfc3339);

  eleventyConfig.addPlugin(lightningCSS);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    extensions: "html",
    formats: ["avif", "webp", "jpg"],
    widths: [700],
    urlPath: "/img/",
    defaultAttributes: {
      loading: "lazy",
      decoding: "async",
      sizes: "700px",
    },
  });

  eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
    if (outputPath.endsWith(".html")) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        continueOnParseError: true,
        removeAttributeQuotes: false,
        minifyCSS: true,
      });
    }

    return content;
  });
}


function dateToRfc3339(dateObj) {
  let s = dateObj.toISOString();

  // remove milliseconds
  let split = s.split(".");
  split.pop();

  return split.join("") + "Z";
}