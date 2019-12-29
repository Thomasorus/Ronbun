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

async function listFiles(folderPath) {
  const data = await walk(folderPath);
  console.log(
    "Explored " + folderPath + " and found " + data.length + " entries."
  );
  return data;
}

async function createEntries(index, data, imgList) {
  console.log("Creating entries...");
  let pattern = /(.*\/)+(.*\.md)/;
  data.forEach(p => {
    let match = p.match(pattern);
    if (!match || match.length < 1 || match[1] === "/") return;

    //Cleaning strings and define subject + parent
    let subject = match[2].replace(/\//g, "").replace(".md", "");
    let parent = match[1].replace("content", "").replace(/\//g, "");
    if (parent === "") {
      parent = "root";
    } else {
      parent = parent;
    }

    //Get content
    let textContent = fs.readFileSync(p, "utf8");

    //Set Title
    var title = "Maze";
    var tempTitle = textContent.match(".*#*.\n");
    console.log(tempTitle);
    if (tempTitle) {
      let cleanedTitle = tempTitle[0].substr(2).replace(/\n/g, "");
      console.log(cleanedTitle);

      title = cleanedTitle;
    }

    //Parsing markdown and converting to html
    let parsed = reader.parse(textContent);
    let result = writer.render(parsed);
    let cleanedText = result.replace(/\n/g, "");

    index.content[subject] = index.content[subject] || {};
    index.content[subject].parent = parent || {};
    index.content[subject].text = cleanedText || {};
    index.content[subject].title = title || {};

    //Define image name and url
    imgList.forEach(obj => {
      var testImg = obj.match(subject);
      if (testImg) {
        index.content[subject].img = obj || {};
      } else {
        index.content[subject].img = "media/cover.jpg" || {};
      }
    });
    console.log(
      "Created " +
        subject +
        " with parent  " +
        index.content[subject].parent +
        " and image " +
        index.content[subject].img
    );
  });
}

function generateDB(index) {
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
}

async function generateAll() {
  let index = { content: {} };
  const imgList = await listFiles("./media");
  const data = await listFiles("./content");
  await createEntries(index, data, imgList);
  generateDB(index);
}

generateAll();
