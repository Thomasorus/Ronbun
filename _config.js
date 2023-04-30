import lume from "lume/mod.ts";
import imagick from "lume/plugins/imagick.ts";
import lightningcss, { version } from "lume/plugins/lightningcss.ts";
import minify_html from "lume/plugins/minify_html.ts";
import slugify_urls from "lume/plugins/slugify_urls.ts";
import source_maps from "lume/plugins/source_maps.ts";
import inline from "lume/plugins/inline.ts";
import postcss from "lume/plugins/postcss.ts";
import terser from "lume/plugins/terser.ts";
import date from "lume/plugins/date.ts";

import { unescapeHtml } from "https://deno.land/x/escape/mod.ts";
import {contentLoader} from "./loaders/contentLoader.mjs";

const site = lume({ emptyDest: false });

site.copy("/assets/index.js", "index.js");
site.copy("/assets/rss.js", "rss.js");
site.copy("/assets/fonts/subsetted", '/fonts');

const fileResponse = await fetch("https://thomasorus.com/feed.xml");
if (fileResponse.ok) {
  const textData = await fileResponse.text();
  const unescape = unescapeHtml(textData);
  await Deno.writeTextFile("./_data/live_feed.xml", unescape);  //
}

site.data("allContent", await contentLoader());
site.data("buildDate", Date.now());

site.addEventListener("beforeUpdate", async (event) => {
  site.data("allContent", await contentLoader());
  site.data("buildDate", Date.now());
});

site.use(inline());
site.use(terser({
  options: {
    module: false,
  },
}));
site.use(date());
site.use(imagick());
site.use(minify_html());
site.use(slugify_urls());
site.use(source_maps());
site.use(postcss());
site.use(lightningcss({
  extensions: [".css"],
  options: {
    minify: true,
    targets: {
      firefox: version(50),
    }
  }
}));

export default site;

