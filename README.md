# Ronbun 論文

Ronbun is my static site generator. It's written in nodejs, uses Kaku as a text parser, image magick for image compression and `entr` for development.

Ronbun is still in early development.

## How it works

- `./dev.sh` will watch for file changes and recompile html
- `./build.sh` will compile html and process images
Don't forget to use - `chmod +x ./*.sh` to allow scripts execution.
