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

async function createEntries(index, navigation, data, imgList) {
  console.log("Creating entries...");
  let filePattern = /(.*\/)+(.*\.md)/;

  data.forEach(p => {
    let match = p.match(filePattern);
    if (!match || match.length < 1 || match[1] === "/") return;

    //Cleaning strings and define subject + parent

    let subject = match[2].replace(/\//g, "").replace(".md", "");
    let parents = match[1]
      .replace("content/", "")
      .slice(0, -1)
      .split("/");
    let parent = parents[parents.length - 1];

    if (parent === "" || parent === subject) {
      parent = "home";
    } else if (parent === "home") {
      parent = null;
    }

    //Get content
    let textContent = fs.readFileSync(p, "utf8");
    let noTitleContent = textContent.replace(/.*#.*\n\n/m, "");

    //Set Title
    var title = "Maze";
    var tempTitle = textContent.match(".*#*.\n");
    if (tempTitle) {
      let cleanedTitle = tempTitle[0].substr(2).replace(/\n/g, "");
      title = cleanedTitle;
    }

    //Parsing markdown and converting to html
    let parsed = reader.parse(noTitleContent);
    let result = writer.render(parsed);
    let cleanedText = result.replace(/\n/g, "");

    index.content[subject] = index.content[subject] || {};
    index.content[subject].parent = parent || {};
    index.content[subject].text = cleanedText || {};
    index.content[subject].title = title || {};

    // navigation.menu[parent] = navigation.menu[parent] || {};
    // navigation.menu[subject].parents = parents || {};

    //Define image name and url
    imgList.forEach(obj => {
      var testImg = obj.match(subject);
      if (testImg) {
        index.content[subject].img = obj || {};
      }
    });
  });
}

function generateDB(index, navigation) {
  let menusContent = JSON.stringify(navigation);
  fs.writeFileSync(
    "./navigation.json",
    menusContent.replace(/\\\"/g, "'"),
    err => {
      if (err) {
        console.log(err);
        throw err;
      }
    }
  );

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

function generatePages(index) {
  let jsonContent = JSON.stringify(index);
}

async function generateAll() {
  let index = { content: {} };
  let navigation = { menu: {} };
  const imgList = await listFiles("./media");
  const data = await listFiles("./content");
  await createEntries(index, navigation, data, imgList);
  generateDB(index, navigation);
}

generateAll();
