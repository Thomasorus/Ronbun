#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const MarkdownIt = require('./markdown-it.min.js');

const md = new MarkdownIt({
  typographer: false,
});

// https://gist.github.com/lovasoa/8691344#gistcomment-2631947
function walk(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (error, files) => {
      if (error) {
        return reject(error);
      }
      Promise.all(
        files.map(
          file =>
            new Promise((resolve, reject) => {
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
            })
        )
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

// Listing all files
async function listFiles(folderPath) {
  const data = await walk(folderPath);
  console.log(`Explored ${folderPath} and found ${data.length} entries.`);
  return data;
}

async function createEntries(index, data, imgList) {
  console.log('Creating entries...');
  const filePattern = /(.*\/)+(.*\.md)/;

  data.forEach(p => {
    // Checking for the right file pattern
    const match = p.match(filePattern);
    if (!match || match.length < 1 || match[1] === '/') return;

    // Cleaning strings and defining subject + parent
    const subject = match[2].replace(/\//g, '').replace('.md', '');
    const parents = match[1]
      .replace('content/', '')
      .slice(0, -1)
      .split('/');
    let parent = parents[parents.length - 1];

    if (parent === '' || parent === subject) {
      parent = 'index';
    } else if (parent === 'index') {
      parent = null;
    }

    // Get content
    const textContent = fs.readFileSync(p, 'utf8');

    // Set Title
    let title = 'Maze';
    const tempTitle = textContent.match('.*#*.\n');
    if (tempTitle) {
      const cleanedTitle = tempTitle[0].substr(2).replace(/\n/g, '');
      title = cleanedTitle;
    }

    // Parsing markdown and converting to html
    const result = md.render(textContent);
    const cleanedText = result.replace(/\n/g, '');

    index.content[subject] = index.content[subject] || {};
    index.content[subject].parent = parent || {};
    index.content[subject].text = 'cleanedText' || {};
    index.content[subject].title = title || {};

    // Define image name and url
    imgList.forEach(obj => {
      const testImg = obj.match(subject);
      if (testImg) {
        index.content[subject].img = obj || {};
      }
    });
  });
}

function templatingPage(title, body, parent, siblings, mainMenu) {
  const pageTitle = title || '';
  const pageBody = body || '';
  // const pageMenus = menus || '';
  const pageParent = parent || '';
  const pageMenuSiblings = siblings || '';
  // const pageHeader = header || '';
  // const pageFooter = footer || '';
  const template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <link rel="stylesheet" href="./style.css" />
    <title>${pageTitle}</title>
  </head>
  <body>
    <header></header>
    <main>
      <div>${mainMenu}</div>
      <article>
        ${pageBody}
      </article>
      <aside>
        <nav>
          ${pageMenuSiblings}
        </nav>
      </aside>
    </main>
  </body>
</html>
  `;
  return template;
}

function createMenus(content, key, parent) {
  let items = '';
  Object.keys(content).forEach(function(i) {
    if (content[i].parent === parent && i !== parent) {
      const link = `
        <li>
        <a class="${i === key ? `active` : ''}" href="${i}.html">
        ${content[i].title}
        </a>
      </li>`;
      items += link;
    }
  });
  const mainMenu = '<h3>Select a subject</h3>';
  const siblingsMenu = `
    <h3>This page is part of 
      ${parent.replace(/-/g, ' ')}
    </h3>
  `;
  const introMenu = parent === key ? mainMenu : siblingsMenu;
  const menus = `
      ${introMenu}
      <ul>${items}</ul>
    `;
  return menus;
}

async function generateHtml(index) {
  const { content } = index;

  for (const key of Object.keys(content)) {
    const obj = content[key];
    const siblings = createMenus(content, key, obj.parent);
    const mainMenu = createMenus(content, 'index', 'index');

    const body = templatingPage(
      obj.title,
      obj.text,
      obj.parent,
      siblings,
      mainMenu
    );

    fs.writeFileSync(`./dist/${key}.html`, body, err => {
      if (err) {
        console.log(err);
        throw err;
      }
    });
  }
}

async function getCss(cssPath, cssDestination) {
  fs.copyFile(cssPath, cssDestination, err => {
    if (err) throw err;
  });
}

async function generateAll() {
  rimraf.sync('./dist');
  fs.mkdirSync('./dist');
  const index = { content: {} };
  const imgList = await listFiles('./media');
  const data = await listFiles('./content');
  await createEntries(index, data, imgList);
  await generateHtml(index);
  await getCss('./style.css', './dist/style.css');

  // Todo : move all files into dist/media and compress them
}

generateAll();
