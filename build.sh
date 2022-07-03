#!/bin/sh
node src/builder.mjs
src/minify.sh www/assets/index.css > www/assets/index-min.css
src/minify.sh www/assets/ronbun.css > www/assets/ronbun-min.css
gzip -k -f www/assets/index.min.css
gzip -k -f www/assets/ronbun.min.css
src/images.sh