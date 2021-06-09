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
        console.log(`Copying new asset ${file.name}`)
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
          console.log(`Updating ${file.name.trim()}`)
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