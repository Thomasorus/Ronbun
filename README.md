# Ronbun 論文

Ronbun is my static site generator. It's written in nodejs, uses Kaku as a text parser, image magick for image compression and `entr` for development.

Ronbun is still in early development.

## Philosophy

The goal is to create a simple html generator entirely driven by my needs, thus why it doesn't use markdown, why there's a single content file, why navigation is simplified.

## Requirements

Ronbun requires is developed and built on a linux machine, it requires:

- NodeJS 14
- Imagemagick
- entr

## How to develop or build the website

- `./server.sh` will create a node server (go to local ip /page.html)
- `./dev.sh` will watch for file changes and compile html + process images
- `./build.sh` will compile html and process images
Don't forget to use - `chmod +x ./*.sh` to allow scripts execution.

## How it works

`builder.mjs` is the building script. It loads:

- `fs` for accessing to files
- `child process` to execute bash scripts
- `Kaku.mjs` as a text parser (can be changed by another like a markdown parser)
- `time.mjs` as a time parser and graph builder

Look at the `generateAll()` function to get a sense of the build process.

## Folders

- `assets` contain css files and html partials used for the build.
- `data` contains the data files.
- `src` contains de building files.
- `media` contains the image, audio and video files that are to be process or copied during build.
- `old` contains older versions of the builder written in js and python, as well as content has to be transferred into the `content.kaku` file.
- `dist` is the built website.
