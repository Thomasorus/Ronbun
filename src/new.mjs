import * as fs from 'fs'
import * as utils from './utils.mjs'
import { config } from './config.mjs'
import textParser from './kaku.mjs'

class Entry {
  constructor() {
    this.key
    this.type
    this.title
    this.htmlTitle
    this.titleSlug
    this.category
    this.categoryName
    this.categorySlug
    this.bref
    this.isPrivate
    this.body
    this.parsedText
    this.startWeek
    this.startYear
    this.endWeek
    this.endYear
    this.totalTime = 0
    this.activity = []
    this.project = []
  }
}

function generate(config) {

  utils.mkDir(config.buildDir)
  utils.mkDir(config.buildAssetsDir)
  utils.mkDir(config.buildMediaDir)

  utils.moveAssets(config.srcAssetsDir, config.buildAssetsDir)

  const contentArray = utils
    .readFile(config.srcDataDir + '/' + config.contentFile)
    .split(config.contentSplitter)
  const timeArray = utils
    .readFile(config.srcDataDir + '/' + config.timeFile)
    .split('\n')

  const allEntries = []

  // Creating all pages from content file
  for (let i = 0; i < contentArray.length; i++) {
    const el = contentArray[i]
    if (el !== '') {
      const entry = new Entry()

      let name = el.match(/(?:NAME:)((?:\\[\s\S]|[^\\])+?)\n/g)
      entry.title = name[0].substr(5).trim()
      entry.key = entry.title.toLowerCase().replace(/\b \b/g, '_')
      entry.htmlTitle = entry.title + ' | Thomasorus'
      entry.titleSlug = entry.title.toLowerCase().replace(/\b \b/g, '-')

      let category = el.match(/(?:HOST:)((?:\\[\s\S]|[^\\])+?)\n/g)
      entry.category = category[0].substr(5).trim()
      entry.categoryName =
        entry.category.charAt(0).toUpperCase() + entry.category.slice(1)
      entry.categorySlug = entry.category.toLowerCase().replace(/\b \b/g, '-')

      let bref = el.match(/(?:BREF:)((?:\\[\s\S]|[^\\])+?)\n/g)
      entry.bref = bref[0].substr(5).trim()

      let isPrivate = el.match(/(?:PRIV:)((?:\\[\s\S]|[^\\])+?)\n/g)
      entry.isPrivate = isPrivate[0].substr(5).trim()

      let body = el.match(/(?:BODY:)((?:\\[\s\S]|[^\\])+?)$/g)
      entry.body = body[0].substr(5).trim()
      entry.parsedText = textParser(entry.body)

      entry.type = 'content'

      allEntries.push(entry)
    }
  }

  //Creating time pages from time file
  for (let i = 0; i < timeArray.length; i++) {
    const timeEl = timeArray[i].split(' ')
    let contentExists = false

    //Checking if time and content can be linked
    for (let u = 0; u < allEntries.length; u++) {
      const contentEl = allEntries[u]
      // Check either in content or project
      if (contentEl.key === timeEl[3].toLowerCase()) {
        if (!contentEl.startYear) {
          contentEl.startYear = timeEl[0]
          contentEl.startWeek = timeEl[1]
        }
        if (contentEl.startYear) {
          contentEl.endYear = timeEl[0]
          contentEl.endWeek = timeEl[1]
        }
        if (!contentEl.activity.includes(timeEl[2].replace(/_/g, " "))) {
          contentEl.activity.push(timeEl[2].replace(/_/g, " "))
        }
        // if (!contentEl.project.includes(timeEl[3].replace(/_/g, " "))) {
        //   contentEl.project.push(timeEl[3].replace(/_/g, " "))
        // }
        if (timeEl[4]) {
          contentEl.totalTime += Number(timeEl[4])
        }
        contentExists = true
      }
      if (contentEl.key === timeEl[2].toLowerCase()) {
        if (!contentEl.startYear) {
          contentEl.startYear = timeEl[0]
          contentEl.startWeek = timeEl[1]
        }
        if (contentEl.startYear) {
          contentEl.endYear = timeEl[0]
          contentEl.endWeek = timeEl[1]
        }
        // if (!contentEl.activity.includes(timeEl[2].replace(/_/g, " "))) {
        //   contentEl.activity.push(timeEl[2].replace(/_/g, " "))
        // }
        if (!contentEl.project.includes(timeEl[3].replace(/_/g, " "))) {
          contentEl.project.push(timeEl[3].replace(/_/g, " "))
        }
        if (timeEl[4]) {
          contentEl.totalTime += Number(timeEl[4])
        }
        contentExists = true
      }

    }

    // If time data has no page, create a new one for the project
    if(!contentExists) {
      const project = new Entry()
      project.key = timeEl[3].toLowerCase()
      if (!project.startYear) {
        project.startYear = timeEl[0]
        project.startWeek = timeEl[1]
      }
      if (project.startYear) {
        project.endYear = timeEl[0]
        project.endWeek = timeEl[1]
      }
      if (!project.activity.includes(timeEl[2])) {
        project.activity.push(timeEl[2].replace(/_/g, " "))
      }
      if (!project.project.includes(timeEl[3].replace(/_/g, " "))) {
        project.project.push(timeEl[3].replace(/_/g, " "))
        project.timeSlug = timeEl[3].toLowerCase().replace(/_/g, "-").replace(/\b \b/g, '')
      }
      if (timeEl[4]) {
        project.totalTime += Number(timeEl[4])
      }
      project.type = 'project'
      allEntries.push(project)

      const activity = new Entry()
      activity.key = timeEl[2].toLowerCase()
      if (!activity.startYear) {
        activity.startYear = timeEl[0]
        activity.startWeek = timeEl[1]
      }
      if (activity.startYear) {
        activity.endYear = timeEl[0]
        activity.endWeek = timeEl[1]
      }
      if (!activity.activity.includes(timeEl[2])) {
        activity.activity.push(timeEl[2].replace(/_/g, " "))
        activity.timeSlug = timeEl[2].toLowerCase().replace(/_/g, "-").replace(/\b \b/g, '')
      }
      if (!activity.project.includes(timeEl[3].replace(/_/g, " "))) {
        activity.project.push(timeEl[3].replace(/_/g, " "))
      }
      if (timeEl[4]) {
        activity.totalTime += Number(timeEl[4])
      }
      activity.type = 'activity'
      allEntries.push(activity)
    }
  }


  const htmlTemplate = utils.readFile(config.srcAssetsDir + "/" + config.htmlTemplate)

  for (var i = 0; i < allEntries.length; i++) {
    const el = allEntries[i]
    if (el.titleSlug !== el.categorySlug && el.category !== null) {
      el.hostNav = `<nav role="breadcrumb"><i>Back to <a href="${el.categorySlug}.html">${el.categoryName}</a></i></nav>`
    }
    if(el.totalTime > 0) {
      el.timeSection = `<p>Time spent: ${el.totalTime} hours.<br>Started week ${el.startWeek} of ${el.startYear}.<br>Last update week ${el.endWeek} of ${el.endYear}.</p>`
    }
    if(!el.titleSlug) {
      if(el.type === "project") {
        el.parsedText = `<h1>${el.project}</h1><p><p>This page presents statictics related to the ${el.project} project and was automatically generated by the time tracker.</p>`
        for(i = 0; i < el.activity) {
          
        }
      }
      if(el.type === "activity") {
        el.parsedText = `<h1>${el.activity}</h1><p><p>This page presents statictics related to the ${el.activity} activities and was automatically generated by the time tracker.</p>`
      }
    }

    let page = htmlTemplate

    page = page.replace(/pageTitle/g, `${el.title ? el.title : el.project}`)
    page = page.replace(/metaDescription/g, el.bref ? el.bref : "")
    page = page.replace(/breadCrumb/g, el.hostNav ? el.hostNav : "")
    page = page.replace(/timeSection/g, el.timeSection ? `<aside>${el.timeSection}</aside>` : "")
    page = page.replace(/pageBody/g, el.parsedText ? el.parsedText : "")

    utils.createFile(`${config.buildDir}/${el.titleSlug ? el.titleSlug : el.timeSlug}.html`, page)
  }

}
generate(config)


// NEXT 
// Stocker les activités dans les pages projets 
// Créer les pages pour les activités et y stocker les projets 
// L'instance de la classe pourra ainsi être utilisée par le time tracker
// Créer la page de time tracking en utilisant des SVG au lieu du html
// Générer le flux RSS -> Attention aux pages privées, ne pas indexer les pages du time tracker
// Générer le sitemap -> Attention aux pages privées, ne pas indexer les pages du time tracker
