import * as fs from 'fs'
import {execSync} from 'child_process'


export function mkDir (dir) {
  if (fs.existsSync(dir)) {
    console.log(` Skipping ${dir} directory`)
  } else {
    console.log(`+ Creating ${dir} directory`)
    fs.mkdirSync(dir)
  }
}

export function createFile (path, file) {
  fs.writeFileSync(path, file, err => {
    if (err) {
      console.log(err)
      throw err
    }
  })
}

export function readFile (path) {
  const file = fs.readFileSync(path, 'utf8')
  return file
}


export async function compareStrings (oldPage, item, reg) {
  const regex = RegExp(reg)
  const content = regex.exec(oldPage)
  console.log(regex)
  // const hasChanged = content[1].replace(/\n/g, "").trim() === item.replace(/\n/g, "").trim() ? true : false

  return content
}

export async function toIsoDate (date) {
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
      if(!fs.existsSync(`${destinationDir}/${file.name}`)) {
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

        if(sourceSize !== destSize) {
          console.log(`+ Updating ${file.name.trim()}`)
          fs.copyFile(`${sourceDir}/${file.name}`, `${destinationDir}/${file.name}`, err => {
            if (err) {
              throw err
            }
          })
        } else {
          console.log(` Skipping ${file.name}`)
        }
      }
    }
}

export async function gitDate(folder, file) {
  if(fs.existsSync(`${folder}/${file}`)) {
    const gitDate = await execSync(`cd ${folder} && git log -1 --format="%ci" './${file}'`).toString().trim()
    const date = new Date(gitDate);
    return date
  } else {
      return new Date()
  }

}

export async function toTree(arr) {
  var tree = [],
      mappedArr = {},
      arrElem,
      mappedElem;

  // First map the nodes of the array to an object -> create a hash table.
  for(var i = 0, len = arr.length; i < len; i++) {
    arrElem = arr[i];
    if(arrElem.timeSlug === "auger") {
      console.log(arrElem)
    }
    if(arrElem.isPrivate !== "true") {
      //Give key from titleSlug or timeSlug
      if(arrElem.titleSlug !== undefined) {
        mappedArr[arrElem.titleSlug] = arrElem
        mappedArr[arrElem.titleSlug]['children'] = [];
      } else {
        mappedArr[arrElem.timeSlug] = arrElem
        mappedArr[arrElem.timeSlug]['children'] = [];
      }
    }
  }

  for (var id in mappedArr) {
    if (mappedArr.hasOwnProperty(id)) {
      mappedElem = mappedArr[id];
      // If the element is not at the root level, add it to its parent array of children.
      if (mappedElem.categorySlug) {
        mappedArr[mappedElem['categorySlug']]['children'].push(mappedElem);
      }
      // If the element is at the root level, add it to first level elements array.
      else {
        tree.push(mappedElem);
      }
    }
  }
  return tree
}

export function createRecursiveList(tree) {
    let html = '<ul role="sitemap">'
    tree.forEach(function(el) {
      let list = createRecursiveItem(el)
      html += list
    })
    html += '</ul>'
    return html
}
                
function createRecursiveItem(elem) {
    let html = "<li>"
    html += `<a href="${elem.titleSlug}.html">${elem.title}</a>`
    if (elem.children.length > 0) {
      html += createRecursiveList(elem.children)
    }
    html += '</li>'
    return html
}

export async function setMainCategories(arr, category) {
  for (var i = 0; i < arr.length; i++) {
    const el = arr[i]

    if(el.categorySlug === undefined) {
      category = el.titleSlug
      el.mainCategory = el.titleSlug
    } else {
      el.mainCategory = category
    }
    if(el.children.length > 0) {
      await setMainCategories(el.children, category)
    }
  }
  return arr
}