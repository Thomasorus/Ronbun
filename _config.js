import lume from "lume/mod.ts";
import imagick from "lume/plugins/imagick.ts";
import lightningcss, { version } from "lume/plugins/lightningcss.ts";
import minify_html from "lume/plugins/minify_html.ts";
import sitemap from "lume/plugins/sitemap.ts";
import slugify_urls from "lume/plugins/slugify_urls.ts";
import source_maps from "lume/plugins/source_maps.ts";
import inline from "lume/plugins/inline.ts";
import postcss from "lume/plugins/postcss.ts";
import terser from "lume/plugins/terser.ts";
import date from "lume/plugins/date.ts";

import {contentLoader} from "./loaders/contentLoader.mjs";

const site = lume();

site.copy("/assets/index.js", "index.js");
site.copy("/assets/fonts/subsetted", '/fonts');

const fileResponse = await fetch("https://thomasorus.com/feed.xml");
if (fileResponse.body) {
  const file = await Deno.open("./_data/live_feed.xml", { write: true, create: true });
  await fileResponse.body.pipeTo(file.writable);
}

site.data("allContent", await contentLoader());

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
site.use(sitemap());
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

