import * as fs from 'fs'
import * as utils from './utils.mjs'
import {
    config
} from './config.mjs'
import textParser from './kaku.mjs'
import timeParser from './time.mjs'

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
            slug: name[1].trim().toLowerCase().replace(/ /g, '-'),
            host: host[1].trim(),
            bref: bref[1].trim(),
            priv: priv[1].trim(),
            body: textParser(body[1].trim())
        }
        return x
    })
    .reduce((r, a) => {
        r[a.slug] = [...r[a.slug] || [], a];
        return r;
    }, {});

const time = utils.readFile(config.time)
    .split('\n')
    .map(x => x.split(' '))
    .map(x => x = {
        year: x[0],
        week: x[1],
        activity: x[2].replace(/_/g, ' '),
        activityslug: x[2].toLowerCase().replace(/_/g, '-'),
        name: x[3].replace(/_/g, ' '),
        slug: x[3].toLowerCase().replace(/_/g, '-'),
        time: x[4]
    })

const projects = time.reduce((r, a) => {
    r[a.slug] = [...r[a.slug] || [], a];
    return r;
}, {});

const activities = time.reduce((r, a) => {
    r[a.activityslug] = [...r[a.activityslug] || [], a];
    return r;
}, {});


//Grouping text entries and projects
for (const projkey in projects) {
    const proj = projects[projkey]
    for (const textkey in text) {
        const txt = text[textkey]
        if (textkey === projkey) {
            txt.entries = []
            // txt.entries = txt.entries.push[proj]
            proj.entries.map(x => txt.entries.push(x))
            txt.first = `week ${proj.entries[0].week} of ${proj.entries[0].year}`
            txt.last = `week ${proj.entries[proj.entries.length - 1].week} of ${proj.entries[proj.entries.length - 1].year}`
            txt.total = 0
            proj.entries.map(x => txt.total += parseInt(x.time))
            delete projects[projkey]
        } else if (proj.entries.length === 0) {
            proj.entries = []
            proj.map(x => {
                proj.entries.push(x)
            })
            proj.splice(0, Object.keys(proj).length)
            proj.name = proj.entries[0].name
            proj.slug = proj.entries[0].slug
            proj.host = 'Time'
        }
    }
}

//Grouping text entries and activities
for (const actkey in activities) {
    let act = activities[actkey]
    for (const textkey in text) {
        const txt = text[textkey]
        if (textkey === actkey) {
            txt.entries = []
            // txt.entries = txt.entries.push[act]
            act.map(x => txt.entries.push(x))
            txt.first = `week ${act[1].week} of ${act[1].year}`
            txt.last = `week ${act[act.length - 1].week} of ${act[act.length - 1].year}`
            txt.total = 0
            act.map(x => txt.total += parseInt(x.time))
            delete activities[actkey]
        } else if (act.entries.length === 0) {
            act.entries = []
            act.map(x => {
                act.entries.push(x)
            })
            act.splice(0, Object.keys(act).length)
            act.name = act.entries[0].activity
            act.slug = act.entries[0].activityslug
            act.host = 'Time'
        }
    }
}

const timeEntries = Object.keys(time).length
const pageEntries = Object.keys(text).length
const orphanProjects = Object.keys(projects).length
const orphanActivities = Object.keys(activities).length


let all = Object.assign({}, text, projects, activities)


// Generate pages
utils.mkDir(config.buildDir)
Object.entries(all).forEach(([key, value]) => {
    const el = value[0] === undefined ? value : value[0]


    let page = htmlTemplate

    if (el.slug === "time") {
        page = page.replace('<article>', "<article class='full'>")
    }

    // if (el.titleSlug === "sitemap") {
    //     el.parsedText += utils.createRecursiveList(tree)
    // }

    page = page.replace(/pageTitle/g, `${el.name} - Thomasorus`)
    page = page.replace(/metaDescription/g, el.bref)
    // page = page.replace(/breadCrumb/g, el.hostNav ? el.hostNav : "")
    // page = page.replace(/timeSection/g, el.timeSection ? el.timeSection : "")
    page = page.replace(/pageBody/g, el.body ? el.body : "")
    // page = page.replace(/colorCat/g, el.mainCategory ? el.mainCategory : "")

    utils.createFile(`${config.buildDir}/${el.slug}.html`, page)
})

console.log("Time Entries: " + timeEntries)
console.log("Page Entries: " + pageEntries)
console.log("Orphan projects: " + orphanProjects)
console.log("Orphan activities: " + orphanActivities)
console.log(Object.keys(all).length)


// utils.createFile('data.json', JSON.stringify(all))

// console.log(
//     content
// )