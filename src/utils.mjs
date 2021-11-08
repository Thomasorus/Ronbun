import * as fs from 'fs'
import {
  execSync
} from 'child_process'


export function mkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`+ Creating ${dir} directory`)
    fs.mkdirSync(dir)
  }
}

export function createFile(path, file) {
  fs.writeFileSync(path, file, err => {
    if (err) {
      console.log(err)
      throw err
    }
  })
}

export function readFile(path) {
  const file = fs.readFileSync(path, 'utf8')
  return file
}


export async function compareStrings(oldPage, item, reg) {
  const regex = RegExp(reg)
  const content = regex.exec(oldPage)
  console.log(regex)
  // const hasChanged = content[1].replace(/\n/g, "").trim() === item.replace(/\n/g, "").trim() ? true : false

  return content
}

export async function toIsoDate(date) {
  const splitDate = date.split(' ')
  const hour = splitDate[1].split(':')
  const fixedHour = hour.map(function (h) {
    if (h.length === 1) {
      return '0' + h
    } else {
      return h
    }
  })

  const splitDay = splitDate[0].split('/')
  const fixedDay = splitDay.map(function (d) {
    if (d.length === 1) {
      return '0' + d
    } else {
      return d
    }
  })
  const day = `${fixedDay[2]}-${fixedDay[1]}-${fixedDay[0]}`
  const isoDate = `${day}T${fixedHour.join(':')}Z`
  const formatedDate = new Date(isoDate)
  return formatedDate
}


export async function moveAssets(sourceDir, destinationDir) {
  const dir = await fs.promises.opendir(sourceDir)
  for await (const file of dir) {
    if (!fs.existsSync(`${destinationDir}/${file.name}`)) {
      console.log(`+ Copying new asset ${file.name}`)
      fs.copyFile(`${sourceDir}/${file.name}`, `${destinationDir}/${file.name}`, err => {
        if (err) {
          throw err
        }
      })
    } else {
      const destSize = fs.statSync(`${destinationDir}/${file.name}`).size.toString().trim()
      const sourceSize = fs.statSync(`${sourceDir}/${file.name}`).size.toString().trim()
      // const gitSize = await execSync(`git ls-tree -r  -l HEAD ${sourceDir}/${file.name}`).toString().replace(`${sourceDir}/${file.name}`.substring(2), '').substring(52).trim()

      if (sourceSize !== destSize) {
        console.log(`+ Updating ${file.name.trim()}`)
        fs.copyFile(`${sourceDir}/${file.name}`, `${destinationDir}/${file.name}`, err => {
          if (err) {
            throw err
          }
        })
      }
    }
  }
}

export async function gitDate(folder, file) {
  if (fs.existsSync(`${folder}/${file}`)) {
    const gitDate = await execSync(`cd ${folder} && git log -1 --format="%ci" './${file}'`).toString().trim()
    const date = new Date(gitDate);
    return date
  } else {
    return new Date()
  }
}

export function createRecursiveList(tree) {
  let html = '<ul>'
  tree.forEach(function (el) {
    if (el.slug && el.priv === "false") {
      let list = createRecursiveItem(el)
      html += list
    }
  })
  html += '</ul>'
  return html
}

function createRecursiveItem(elem) {
  let html = "<li>"
  html += `<a href="${elem.slug}.html">${elem.name}</a>`
  if (elem.children.length > 0) {
    html += createRecursiveList(elem.children)
  }
  html += '</li>'
  return html
}

export async function setMainCategories(arr, category) {
  for (var i = 0; i < arr.length; i++) {
    const el = arr[i]

    if (el.hostslug === "") {
      category = el.slug
      el.category = el.slug
    } else if (el.hostslug === "home") {
      category = el.slug
      el.category = el.slug
    } else {
      el.category = category
    }
    if (el.children.length > 0) {
      await setMainCategories(el.children, category)
    }
  }
  return arr
}

export async function parseXml(xmlTerm, xmlText) {
  const fullTerm = RegExp(`<${xmlTerm}>((.|\n)*?)<\/${xmlTerm}>`, 'g');
  const match = fullTerm.exec(xmlText)
  return match[1]
}


export function typeOf(obj) {
  if (obj === null) {
    return 'null';
  }
  if (obj !== Object(obj)) {
    return typeof obj;
  }
  var result = {}.toString
    .call(obj)
    .slice(8, -1)
    .toLowerCase();

  // strip function adornments (e.g. "AsyncFunction")
  return result.indexOf('function') > -1 ? 'function' : result;
}


export async function toTree(list) {
  var map = {},
    node, roots = [],
    i;

  for (i = 0; i < list.length; i += 1) {
    map[list[i].id] = i; // initialize the map
    list[i].children = []; // initialize the children
  }

  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    // console.log(node)
    if (node.hostId !== "") {
      list[map[node.hostId]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function createTimeSection(el) {
  let content = `
          <section role="complementary">
            <details>
              <summary class="time-row">
                  <span class="time-row__title">Statistics for: ${el.name} (click to see more)</span>
                  <span class="time-row__second"> Time spent
                  <span aria-hidden="true">→</span>
                      <time>${el.total} hours</time>
                  </span>
              </summary>
              <dl class="time-row-more">
                  <dt>
                      Time spent
                      <span aria-hidden="true">→</span>
                  </dt>
                  <dd>${el.total} hours total</dd>
                  <dt>
                      Started
                      <span aria-hidden="true">→</span>
                  </dt>
                  <dd>Week ${el.first}</dd>
                  <dt>
                      Last update
                      <span aria-hidden="true">→</span>
                  </dt>
                  <dd>Week ${el.last}</dd>
              </dl>
              <table>
                <caption>All times entries for this page</caption>
                <thead>
                    <tr>
                        <th scope="col">Year</th> 
                        <th scope="col">Week</th>
                        <th scope="col">Hours</th> 
                    </tr>
                </thead>
              <tbody>`
  el.entries.forEach(ent => {
    content += `<tr scope="row"><td>${ent.year}</td><td>${ent.week}</td><td>${ent.hours}</td></tr>`
  })
  content += `</tbody></table></details></section>`
  return content
}