#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const commonmark = require("./commonmark.min.js");

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

// https://gist.github.com/lovasoa/8691344#gistcomment-2631947
function walk(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (error, files) => {
      if (error) {
        return reject(error);
      }
      Promise.all(
        files.map(file => {
          return new Promise((resolve, reject) => {
            const filepath = path.join(dir, file);
            fs.stat(filepath, (error, stats) => {
              if (error) {
                return reject(error);
              }
              if (stats.isDirectory()) {
                walk(filepath).then(resolve);
              } else if (stats.isFile()) {
                resolve(filepath);
              }
            });
          });
        })
      ).then(foldersContents => {
        resolve(
          foldersContents.reduce(
            (all, folderContents) => all.concat(folderContents),
            []
          )
        );
      });
    });
  });
}

function generateAll() {
  walk("./content").then(data => {
    let index = { content: {} };

    let pattern = /(.*\/)+(.*\.md)/;
    console.log(`You have ${data.length} pages`);
    data.forEach(p => {
      let match = p.match(pattern);
      if (!match || match.length < 1 || match[1] === "/") return;

      let subject = match[2].replace(/\//g, "").replace(".md", "");
      let parent = match[1].replace("content", "").replace(/\//g, "");
      parent === "" ? (parent = "root") : (parent = parent);
      let textContent = fs.readFileSync(p, "utf8");
      let parsed = reader.parse(textContent);
      let result = writer.render(parsed);
      let cleanedText = result.replace(/\n/g, "");

      console.log(
        "The subject is: " + subject + " and his parent is " + parent
      );

      index.content[subject] = index.content[subject] || {};
      index.content[subject].parent = parent || {};
      index.content[subject].text = cleanedText || {};
    });

    let jsonContent = JSON.stringify(index);
    fs.writeFileSync(
      "./database.js",
      "DATA.content =`" + jsonContent.replace(/\\\"/g, "'") + "`",
      err => {
        if (err) {
          console.log(err);
          throw err;
        }
      }
    );
  });
}

generateAll();
