# Ronbun 論文

Ronbun (paper) is my static site generator. It's built with nodejs and uses [Kaku](https://thomasorus.com/kaku.html) as a markup language and [imagemagick](https://imagemagick.org/index.php) on the server to process images. It also process time tracking and presents it as graphics.

Ronbun uses a single file as a source of content and a text file for time recordings. It parses files and generates HTML using a template. Ronbun and the Kaku parser try as much as possible to provide light and accessible pages by using standard HTML techniques.

Ronbun was created as a self discovery project following my [philosophy](https://thomasorus.com/tools.html) about personal projects.

## License

Ronbun 論文 is a free to use by individuals and organizations that do not operate by capitalist principles. For more information see the [license](LICENSE.md) file.

## Requirements

Ronbun requires is developed and built on a linux machine, it requires:

- NodeJS 14
- Imagemagick

## How to install

```
git clone repo folder
cd folder
git submodule init
git submodule update --recursive --remote
```

## How to develop or build the website

- `./dev.sh` will watch for file changes and compile html, xml and process images.
- `./build.sh` will compile html, xml and process images.
- `./server` creates a local server if you want to locally visit the website.

Don't forget to use - `chmod +x ./*.sh` to allow scripts execution.

## How it works

- `config.mjs` contains the local paths used by the generator (images, data).
- `builder.mjs` is the main building script. It builds the data from the files using the other scripts and creates the html and xml files.
- `utils.mjs` contains utility functions used by the builder.
- `Kaku.mjs` is the text parser (it can be changed by another like a markdown parser)/
- `time.mjs` is the time parser and graph builder.

Look at the `generateAll()` function to get a sense of the build process.

## Folders

- `assets` contain css files and html partials used for the build.
- `data` contains the data and media files. They are private and located in a submodule.
- `src` contains de building files.
- `www` contains the current built version of the site. It's located in a submodule.
