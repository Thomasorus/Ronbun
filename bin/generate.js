#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
var rimraf = require("rimraf");
const MarkdownIt = require("./markdown-it.min.js");
const md = new MarkdownIt({
  typographer: false
});

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
    let result = md.render(textContent);
    let cleanedText = result.replace(/\n/g, "");

    index.content[subject] = index.content[subject] || {};
    index.content[subject].parent = parent || {};
    index.content[subject].text = cleanedText || {};
    index.content[subject].title = title || {};
    // index.content[subject].url = url || {};

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

async function generateHtml(index) {
  const content = index.content;
  let template = fs.readFileSync("./partials/main.html", "utf8");

  for (const key of Object.keys(content)) {
    let obj = content[key];
    let menus = createMenu(content, key);
    const body = await templatingPage(template, obj.title, obj.text, menus);

    fs.writeFileSync(`./dist/${key}.html`, body, err => {
      if (err) {
        console.log(err);
        throw err;
      }
    });
  }
}

async function templatingPage(template, title, body, menus) {
  console.log(title);
  const head = "{{HEADTITLE}}";
  template.replace(head, title);
  template.replace("{{NAV}}", menus);
  template.replace("{{BODY}}", body);
  return template;
}

//Create menu from pages
function createMenu(content, key) {
  let listItems = "";
  for (const i of Object.keys(content)) {
    let link = `
    <li><a class="${
      i === key ? `active` : ""
    }" href="/${i}.html">${i}</a></li>`;
    listItems += link;
  }
  const menus = "<ul>" + listItems + "</ul>";
  return menus;
}

function generatePages(index) {}

async function generateAll() {
  rimraf.sync("./dist");
  fs.mkdirSync("./dist");
  let index = { content: {} };
  let navigation = { menu: {} };
  const imgList = await listFiles("./media");
  const data = await listFiles("./content");
  await createEntries(index, navigation, data, imgList);
  await generateHtml(index);
  // generateDB(index, navigation);
}

generateAll();
