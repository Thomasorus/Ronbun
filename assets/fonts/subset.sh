#!/bin/bash
# This script subsets fonts from the source folder to the subsetted folder, by scanning the _site folder pages.
# The scan takes a lot of time and this this process cannot be implemented in the classic build process.

cd ../../
glyphs=$(glyphhanger _site/*.html --onlyVisible)
cd assets/fonts
for file in source/*; do
    glyphhanger --whitelist=$glyphs --subset=$file --formats=woff2 --output=subsetted
done