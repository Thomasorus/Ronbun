#!/bin/sh
#  Copyright 2013 Daniel Blair
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

#You must supply atleast 1 arguement to the script
#this arguement MUST be the CSS or JS file to minify
if test $# -lt 1; then echo Usage $0 CSS-or-JS-file; exit 1; fi

#If the arguement is given with -raw in the file name than it will be removed and saved as the file name with out the raw.
outfile=`echo $1 | sed -e "s|-raw.\(.*\)$|.\1|"`
if test "$1" = "$outfile"; then outfile=/dev/stdout;
else echo Minimising $1 and outputting to $outfile;
fi;

#This command removes comments from CSS and Javascript files using sed.
#Read the supplied README.txt for additional information
cat $1 | sed -e "s|/\*\(\\\\\)\?\*/|/~\1~/|g" -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|\([^:/]\)//.*$|\1|" -e "s|^//.*$||" | tr '\n' ' ' | sed -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|/\~\(\\\\\)\?\~/|/*\1*/|g" -e "s|\s\+| |g" -e "s| \([{;:,]\)|\1|g" -e "s|\([{;:,]\) |\1|g" > $outfile
echo
