import * as fs from 'fs'

export function mkDir (dir) {
  if (fs.existsSync(dir)) {
    console.log(`The ${dir} directory exists!`)
  } else {
    console.log(`The ${dir} directory was not found. Creating...`)
    fs.mkdirSync(dir)
    console.log('Done')
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

export async function copyAsset (buildAssetsDir, srcAssetsDir, file) {
  if (fs.existsSync(`${buildAssetsDir}/${file}`)) {
    const oldFile = await getFileSize(`${buildAssetsDir}/${file}`)
    const newFile = await getFileSize(`${srcAssetsDir}/${file}`)
    if (oldFile !== newFile) {
      console.log(`Changes for ${file}`)
      fs.copyFile(`${srcAssetsDir}/${file}`, `${buildAssetsDir}/${file}`, err => {
        if (err) {
          throw err
        }
      })
      return true
    } else {
      console.log(`No change for ${file}`)
      return false
    }
  } else {
    console.log(`Copy of ${file}`)
    fs.copyFile(`${srcAssetsDir}/${file}`, `${buildAssetsDir}/${file}`, err => {
      if (err) {
        throw err
      }
    })
    return true
  }
}

// Returns the file size
export async function getFileSize (file) {
  const stats = fs.statSync(file)
  return stats.size
}

// Splits a text file into an array of objects based on a string
export async function splitContent (textContent, splitter) {
  const splitContent = textContent.split(splitter)
  return splitContent
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
