import * as fs from 'fs'
import * as utils from './utils.mjs'
import { config } from './config.mjs'
import textParser from './kaku.mjs'

class Entry {
  constructor() {
    this.key
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
    this.activity
    this.project
  }
}

function generate(config) {
  const contentArray = utils
    .readFile(config.srcDataDir + '/' + config.contentFile)
    .split(config.contentSplitter)
  const timeArray = utils
    .readFile(config.srcDataDir + '/' + config.timeFile)
    .split('\n')

  const allEntries = []

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
      console.log(entry.isPrivate)

      let body = el.match(/(?:BODY:)((?:\\[\s\S]|[^\\])+?)$/g)
      entry.body = body[0].substr(5).trim()
      entry.parsedText = textParser(entry.body)

      allEntries.push(entry)
    }
  }

  for (let i = 0; i < timeArray.length; i++) {
    const timeEl = timeArray[i].split(' ')
    let contentExists = false

    for (let u = 0; u < allEntries.length; u++) {
      const contentEl = allEntries[u]
      if (contentEl.key === timeEl[3].toLowerCase()) {
        if (!contentEl.startYear) {
          contentEl.startYear = timeEl[0]
          contentEl.startWeek = timeEl[1]
        }
        if (contentEl.startYear) {
          contentEl.endYear = timeEl[0]
          contentEl.endWeek = timeEl[1]
        }
        if (!contentEl.activity) {
          contentEl.activity = timeEl[2]
        }
        if (!contentEl.project) {
          contentEl.activity = timeEl[3]
        }
        if (timeEl[4]) {
          contentEl.totalTime += Number(timeEl[4])
        }
        contentExists = true
      }
    }
    if(!contentExists) {

      const entry = new Entry()
      entry.key = timeEl[3].toLowerCase()
      if (!entry.startYear) {
        entry.startYear = timeEl[0]
        entry.startWeek = timeEl[1]
      }
      if (entry.startYear) {
        entry.endYear = timeEl[0]
        entry.endWeek = timeEl[1]
      }
      if (!entry.activity) {
        entry.activity = timeEl[2]
      }
      if (!entry.project) {
        entry.project = timeEl[3]
      }
      if (timeEl[4]) {
        entry.totalTime += Number(timeEl[4])
      }
      allEntries.push(entry)
    }
  }

  const htmlTemplate = utils.readFile(config.buildAssetsDir + "/" + config.htmlTemplate)

  for (var i = 0; i < allEntries.length; i++) {
    const el = allEntries[i]

     if (el.titleSlug !== el.categorySlug && el.category !== null) {
      el.hostNav = `<nav role="breadcrumb"><i>Back to <a href="${el.hostSlug}.html">${el.host}</a></i></nav>`
    }

    let page = htmlTemplate

    page = page.replace(/pageTitle/g, `${el.title}`)
    page = page.replace(/metaDescription/g, el.bref)
    page = page.replace(/breadCrumb/g, el.hostNav)
    page = page.replace(/pageBody/g, el.parsedText)
  }

}
generate(config)
