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
                  <dd>${el.first}</dd>
                  <dt>
                      Last update
                      <span aria-hidden="true">→</span>
                  </dt>
                  <dd>${el.last}</dd>
              </dl>
              ${createGraph(el.entries.reverse())}
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


function createGraph(data) {

  const yearList = data.map(x => x.year)
  const yearsDataSet = new Set(yearList);
  const years = [...yearsDataSet]
  const chartScale = 10
  const formatedData = []

  years.forEach(el => {
    let newEntry = []
    newEntry.name = el[0].name
    newEntry.year = el
    newEntry.maxHours = 0
    newEntry.years = Array(53).fill("0")
    for (let i = 0; i < data.length; i++) {
      const da = data[i];
      if (da.year === newEntry.year) {
        newEntry.name = da.name
        newEntry.years[da.week] = da.hours

        if (newEntry.maxHours < parseInt(da.hours)) {
          newEntry.maxHours = parseInt(da.hours)
        }
      }
    }
    formatedData.push(newEntry)
  })

  let body = ""
  for (let i = 0; i < formatedData.length; i++) {
    const el = formatedData[i];
    el.scaleX = el.years.length * chartScale
    el.scaleY = el.maxHours * chartScale + chartScale
    el.path = `M${chartScale},${el.scaleY} `
    el.dots = ''
    el.hor = ''
    el.x = 0
    el.y = 0
    el.numbers = `<g><svg style="font-size:10px;" height="${el.scaleY}" width="20">`
    el.years.forEach(ul => {
      el.x = el.x + chartScale
      el.y = el.scaleY - (parseInt(ul) * chartScale)
      el.path += `${el.x},${el.y} `
      let dotSize = ul != 0 ? 3 : 2
      el.dots += `<circle cx="${el.x}" cy="${el.y}" r="${dotSize}" fill="var(--text, #000)" />`
    })
    for (let i = 0; i < el.maxHours + 1; i++) {
      el.hor += `<line x1="0" y1="${i * chartScale + chartScale}" x2="${el.scaleX}" y2="${i * chartScale + chartScale}" stroke="var(--text, #000)" opacity="0.3" stroke-width="0.5px" />`
      el.numbers += `<text fill="var(--text, #000)" x="0" y="${el.scaleY -1 - i * chartScale}">${i}</text>`
    }
    el.numbers += '</svg></g>'
    el.svg = `
          <div aria-hidden="true" style="overflow-x: auto;">
              <p style="text-align:center; max-width: ${el.scaleX}px; margin-left:${el.scaleY / chartScale}px;">${el.year}</p>
              <div style="font-size:12px; text-align:center; width:10px; display:inline-block; transform:rotate(-90deg) translateX(${(el.scaleY - chartScale) / 2}px);">hours</div>
                  <svg viewbox="0 0 ${el.scaleX} ${el.scaleY + chartScale}" width="${el.scaleX}" height="${el.scaleY + chartScale}" style="border:2px solid var(--text, #000);">
                  ${el.hor}
                  <path d="${el.path}" fill="none" stroke="var(--a, #000)" stroke-width="2px"/>
                  ${el.dots}
                  ${el.numbers}
              </svg>
              <div style="width:${el.scaleX}px; text-align:center; font-size:12px; line-height: 1.1; margin-left:${el.scaleY / chartScale}px;">weeks</div>
              </div>
          </div>
          `
    body += el.svg
  }
  return body
}