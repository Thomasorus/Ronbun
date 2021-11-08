import * as fs from 'fs'
import * as utils from './utils.mjs'
import {
    config
} from './config.mjs'
import textParser from './kaku.mjs'
import timeParser from './time.mjs'


utils.mkDir(config.buildDir)
utils.mkDir(config.buildAssetsDir)
utils.mkDir(config.buildMediaDir)
utils.moveAssets(config.srcAssetsDir, config.buildAssetsDir)

const htmlTemplate = utils.readFile(config.htmlTemplate)

const text = utils.readFile(config.content)
    .split('====')
    .map((x) => {
        let name = x.match(/NAME:((?:\\[\s\S]|[^\\])+?)\n/)
        let host = x.match(/HOST:((?:\\[\s\S]|[^\\])+?)\n/)
        let bref = x.match(/BREF:((?:\\[\s\S]|[^\\])+?)\n/)
        let priv = x.match(/PRIV:((?:\\[\s\S]|[^\\])+?)\n/)
        let body = x.match(/BODY:((?:\\[\s\S]|[^\\])+?)$/)

        x = {
            name: name[1].trim(),
            id: name[1].trim().toLowerCase().replace(/ /g, '_'),
            slug: name[1].trim().toLowerCase().replace(/ /g, '-'),
            host: host[1].trim(),
            hostId: host[1].trim().toLowerCase().replace(/ /g, '_'),
            hostslug: host[1].trim().toLowerCase().replace(/ /g, '-'),
            bref: bref[1].trim(),
            priv: priv[1].trim(),
            body: textParser(body[1].trim())
        }
        return x
    })

const time = utils.readFile(config.time)
    .split('\n')
    .map(x => x.split(' '))
    .map(x => x = {
        year: x[0],
        week: x[1],
        activity: x[2].replace(/_/g, ' '),
        activityId: x[2].toLowerCase(),
        name: x[3].replace(/_/g, ' '),
        id: x[3].toLowerCase(),
        hours: x[4],
    })

// Grouping  time entries by project and activity

let projects = time.reduce((r, a) => {
    r[a.id] = r[a.id] || [];
    r[a.id].push(a);
    return r;
}, Object.create(null))

const activities = time.reduce((r, a) => {
    r[a.activityId] = r[a.activityId] || [];
    r[a.activityId].push(a);
    return r;
}, Object.create(null))


const oldProjects = Object.keys(projects).length
const oldActivities = Object.keys(activities).length

//Find matching ids between text entries and project/activities

for (let textkey in text) {
    const txt = text[textkey]
    for (let projkey in projects) {
        const proj = projects[projkey]
        if (proj[0]) {
            if (txt.id === proj[0].id) {
                txt.entries = []
                proj.map(x => txt.entries.push(x))
                txt.first = `week ${proj[0].week} of ${proj[0].year}`
                txt.last = `week ${proj[proj.length - 1].week} of ${proj[proj.length - 1].year}`
                txt.total = 0
                proj.map(x => txt.total += parseInt(x.hours))
                delete projects[projkey]
            }
        }
    }
}

for (const textkey in text) {
    const txt = text[textkey]
    for (const actkey in activities) {
        let act = activities[actkey]
        if (act[0]) {
            if (txt.id === act[0].activityId) {
                txt.entries = []
                act.map(x => txt.entries.push(x))
                txt.first = `week ${act[0].week} of ${act[0].year}`
                txt.last = `week ${act[act.length - 1].week} of ${act[act.length - 1].year}`
                txt.total = 0
                act.map(x => txt.total += parseInt(x.hours))
                delete activities[actkey]
            }
        }
    }
}

const remainingProjects = []
for (const i in projects) {
    let el = projects[i]
    let project = []
    project.entries = []
    el.map(x => {
        project.entries.push(x)
    })
    project.name = el[0].name
    project.slug = el[0].name.toLowerCase().replace(/ /g, '-')
    project.id = el[0].id
    project.host = 'Stubs'
    project.hostId = 'stubs'
    project.hostslug = 'stubs'
    project.first = `Week ${el[0].week} of ${el[0].year}`
    project.last = `Week ${el[el.length - 1].week} of ${el[el.length - 1].year}`
    project.total = 0
    project.priv = "false"
    el.map(x => project.total += parseInt(x.hours))
    remainingProjects.push(project)
}

const remainingActivities = []
for (const i in activities) {
    let el = activities[i]
    let activity = []
    activity.entries = []
    el.map(x => {
        activity.entries.push(x)
    })
    activity.name = el[0].activity
    activity.slug = el[0].activity.toLowerCase().replace(/ /g, '-')
    activity.id = el[0].activity.toLowerCase().replace(/ /g, '_')
    activity.host = 'Stubs'
    activity.hostId = 'stubs'
    activity.hostslug = 'stubs'
    activity.first = `Week ${el[0].week} of ${el[0].year}`
    activity.last = `Week ${el[el.length - 1].week} of ${el[el.length - 1].year}`
    activity.total = 0
    activity.priv = "false"
    el.map(x => activity.total += parseInt(x.hours))
    remainingActivities.push(activity)
}

const all = []

Object.entries(remainingProjects).forEach(([key, array]) => {
    all.push(array)
})
Object.entries(remainingActivities).forEach(([key, array]) => {
    all.push(array)
})
Object.entries(text).forEach(([key, array]) => {
    all.push(array)
})

const timeEntries = Object.keys(time).length
const pageEntries = Object.keys(text).length
const orphanProjects = remainingProjects.length
const orphanActivities = remainingActivities.length
const allEntries = Object.keys(all).length

const timeText = await timeParser(utils.readFile(config.time))
const sitemapArr = await utils.toTree(all)
const finalTree = await utils.setMainCategories(sitemapArr, null)

const rssArray = []
const rssItemTemplate = utils.readFile(config.itemTemplate)

generateHtml(finalTree)

function generateHtml(arr) {
    Object.entries(arr).forEach(([key, value]) => {
        const el = value[0] === undefined ? value : value[0]

        let page = htmlTemplate

        if (el.slug === "time") {
            el.body += timeText
            page = page.replace('<article>', "<article class='full'>")
        }
        if (el.host) {
            el.hostNav = `<nav role="breadcrumb"><i>Back to <a href="${el.hostslug}.html">${el.host}</a></i></nav>`
        }
        if (el.slug === "sitemap") {
            el.body += utils.createRecursiveList(sitemapArr)
            el.body += `<dl>
                            <dt>Time Entries</dt>
                            <dd>${timeEntries}</dd>
                            <dt>Text Entries</dt>
                            <dd>${pageEntries}</dd>
                            <dt>Orphan projects</dt>
                            <dd>${orphanProjects}</dd>
                            <dt>Orphan activities</dt>
                            <dd>${orphanActivities}</dd>
                            <dt>Pages built</dt>
                            <dd>${allEntries}</dd>
                        </dl>`
        }
        if (el.priv === 'false') {
            let rss = rssItemTemplate
            rss = rss.replace(/{{TITLE}}/g, el.name + " - Thomasorus")
            rss = rss.replace(/{{GUID}}/g, el.slug)
            rss = rss.replace(/{{CONTENT}}/g, el.body)
            rssArray.push(rss)
        }

        if (el.entries) {
            el.timeSection = utils.createTimeSection(el)
        }

        if (!el.body) {
            el.body = `<h1>${el.name}</h1><p>This page was generated by the time tracker and has no proper content.</p>`
        }

        page = page.replace(/pageTitle/g, el.name ? `${el.name} - Thomasorus` : "Thomasorus")
        page = page.replace(/metaDescription/g, el.bref ? el.bref : "")
        page = page.replace(/breadCrumb/g, el.hostNav ? el.hostNav : "")
        page = page.replace(/timeSection/g, el.timeSection != undefined ? el.timeSection : "")
        page = page.replace(/pageBody/g, el.body != undefined ? el.body : "")
        page = page.replace(/colorCat/g, el.category ? el.category : "")
        utils.createFile(`${config.buildDir}/${el.slug}.html`, page)

        if (el.children.length > 0) {
            generateHtml(el.children)
        }
    })
}

// Generate RSS
const rssString = rssArray.join('\n')
const event = new Date()
const rssTemplate = utils.readFile(config.rssTemplate)
const rssFile = rssTemplate.replace(/{{CONTENT}}/, rssString).replace(/{{DATE}}/, event.toUTCString())
fs.writeFileSync(`${config.buildDir}/feed.xml`, rssFile, (err) => {
    if (err) {
        console.log(err)
        throw err
    }
})

console.log("Time Entries: " + timeEntries)
console.log("Text Entries: " + pageEntries)
console.log("Orphan projects: " + orphanProjects)
console.log("Orphan activities: " + orphanActivities)
console.log("Pages built: " + allEntries)