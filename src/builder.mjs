import * as fs from 'fs'
import * as utils from './utils.mjs'
import {
    config
} from './config.mjs'
import contentParser from './kaku.mjs'
import timeParser from './time.mjs'


async function generateHtml(contentArray, htmlTemplate, styleHasChanged, buildDir) {
    console.log("Starting page builder")

    for (let i = 0; i < contentArray.length; i++) {
        const el = contentArray[i]
        //Create nav only if host exist and is not the same as current page
        if (el.name.toLowerCase() !== el.host.toLowerCase() && el.host !== undefined) {
            el.hostNav = `<nav role="breadcrumb"><i>Back to <a href="${el.hostSlug}.html">${el.host}</a></i></nav>`
        }

        let page = htmlTemplate;

        page = page.replace(/pageTitle/g, `${el.title}`)
        page = page.replace(/metaDescription/g, el.bref)
        page = page.replace(/breadCrumb/g, el.hostNav)
        page = page.replace(/pageBody/g, el.html)

        //Checking if page already exists in dir
        let existingPage;
        let error;
        try {
            existingPage = await utils.readFile(`${buildDir}/${el.slug}.html`)
        } catch (err) {
            error = err.code;
        }

        //If page does not exist
        if (error === "ENOENT") {
            console.log(`New page: ${el.name}`)
            const path = `${buildDir}/${el.slug}.html`;
            const file = page.replace(/pageTimeContent/g, el.date);
            await utils.createFile(path, file);
        } else {
            //Checking if page changed
            const titleContent = RegExp(/ <title>([\s\S]*?)<\/title>/).exec(existingPage);
            const htmlTitle = titleContent[1].replace(/\n/g, "").trim() === el.title.replace(/\n/g, "").trim() ? true : false

            const brefContent = RegExp(/ <meta name="description" content="([\s\S]*?)">/).exec(existingPage);
            const htmlBref = brefContent[1].replace(/\n/g, "").trim() === el.bref.replace(/\n/g, "").trim() ? true : false

            let textContent = RegExp(/<article>([\s\S]*?)<\/article>/).exec(existingPage);
            let htmlText;
            if (textContent) {
                if (el.name !== "Time") {
                    htmlText = textContent[1].replace(/\n/g, "").trim() === el.html.replace(/\n/g, "").trim() ? true : false
                } else {
                    htmlText = false;
                }
            } else {
                htmlText = true;
            }


            let htmlHostSlug;
            let HostSlugContent = RegExp(/html">([\s\S]*?)<\/a><\/i><\/nav>/).exec(existingPage);

            if (HostSlugContent !== null) {
                htmlHostSlug = HostSlugContent[1].replace(/\n/g, "").trim() === el.host.replace(/\n/g, "").trim() ? true : false
            } else {
                htmlHostSlug = true
            }

            const contentChange = RegExp(/content update: <time>([\s\S]*?)<\/time>/).exec(existingPage);

            //If something changed rebuild, else skip
            if (htmlTitle === false || htmlBref === false || htmlHostSlug === false || htmlText === false || styleHasChanged) {
                console.log("Rebuilding...")
                const name = el.name
                console.log({
                    name,
                    htmlTitle,
                    htmlBref,
                    htmlHostSlug,
                    htmlText,
                    styleHasChanged
                })

                if (styleHasChanged || htmlText === false) {
                    page = page.replace(/pageTimeContent/g, contentChange[1])
                } else {
                    page = page.replace(/pageTimeContent/g, el.date)
                }

                if (el.name === "Time") {
                    page = page.replace("<article>", "<article class='full'>")
                }


                fs.unlinkSync(`${buildDir}/${el.slug}.html`);
                fs.writeFileSync(`${buildDir}/${el.slug}.html`, page, err => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                });
            } else {
                process.stdout.write('.');
            }
        }
    }
    console.log("\n")
}

async function generateAssets(buildAssetsDir, srcAssetsDir) {
    console.log("Checking for assets")
    await utils.mkDir(buildAssetsDir, srcAssetsDir)
    const logoChange = await utils.copyAsset(buildAssetsDir, srcAssetsDir, "logo.png")
    const templateChange = await utils.copyAsset(buildAssetsDir, srcAssetsDir, "main.html")
    const styleChange = await utils.copyAsset(buildAssetsDir, srcAssetsDir, "style.css")
    return logoChange || templateChange || styleChange ? true : false
}

async function generateData(textContentArray, timeContent) {
    const symbols = [
        /(?:NAME:)((?:\\[\s\S]|[^\\])+?)\n/g,
        /(?:HOST:)((?:\\[\s\S]|[^\\])+?)\n/g,
        /(?:BREF:)((?:\\[\s\S]|[^\\])+?)\n/g,
        /(?:PRIV:)((?:\\[\s\S]|[^\\])+?)\n/g,
        /(?:BODY:)((?:\\[\s\S]|[^\\])+?)$/g,
    ];

    const today = new Date()
    const contentArray = [];

    for (let i = 0; i < textContentArray.length; i++) {
        const el = textContentArray[i];
        if (el) {
            const page = []

            //Retrieving data from document
            for (let i = 0; i < symbols.length; i++) {
                const s = symbols[i]
                if (el.match(s)) {
                    const match = el.match(s)
                    const key = match[0].substring(0, 4).toLowerCase()
                    const value = match[0].substr(5).trim()
                    page[key] = value;
                }
            }
            //Creating additionnal data
            page.title = page.name + " - Thomasorus"
            page.slug = page.name.toLowerCase().replace(/\b \b/g, "-")
            page.hostSlug = page.host.toLowerCase().replace(/\b \b/g, "-")
            page.date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            page.hostNav = ""
            page.html = contentParser(page.body)

            if (page.name === "Time") {
                page.html = page.html + await timeParser(timeContent)
            }

            contentArray.push(page)
        }
    }
    return contentArray
}

async function generateRss(contentArray, rssTemplate, rssItemTemplate, buildDir) {
    const items = []
    let date;
    for (let i = 0; i < contentArray.length; i++) {
        const item = contentArray[i];
        if(item.priv === "false"){
            let template = rssItemTemplate;
            date = item.date
    
            const page = utils.readFile(`${buildDir}/${item.slug}.html`);
            const pageDate = RegExp(/content update: <time>([\s\S]*?)<\/time>/).exec(page);
            const pageDateIso = await utils.toIsoDate(pageDate[1]);
    
            template = template.replace(/{{TITLE}}/g, item.title)
            template = template.replace(/{{GUID}}/g, item.slug)
            template = template.replace(/{{DATE}}/g, pageDateIso.toUTCString())
            template = template.replace(/{{CONTENT}}/g, item.html)
    
            items.push(template)
        }
    }

    const itemsString = items.join("\n");
    const event = new Date();
    const rssFile = rssTemplate.replace(/{{CONTENT}}/, itemsString).replace(/{{DATE}}/, event.toUTCString())

    const currentRss = utils.readFile(`${buildDir}/feed.xml`);
    const rssContent = RegExp(/<\/image>([\s\S]*?)<\/channel>/).exec(currentRss);
    const rssHasChanged = rssContent[1].replace(/\n/g, "").trim() === itemsString.replace(/\n/g, "").trim() ? false : true

    if (rssHasChanged) {
        console.log("Updating RSS file")
        fs.writeFileSync(`${buildDir}/feed.xml`, rssFile, err => {
            if (err) {
                console.log(err);
                throw err;
            }
        });
    } else {
        console.log("Skipping RSS file")
    }

}


async function generateAll() {
    console.log('STARTING RONBUN')

    await utils.mkDir(config.buildDir);

    //Checking for changes in template, style or logo
    const styleHasChanged = await generateAssets(config.buildAssetsDir, config.srcAssetsDir);

    //Recover all files needed
    const textContent = utils.readFile(`${config.srcDataDir}/${config.contentFile}`)
    const timeContent = utils.readFile(`${config.srcDataDir}/${config.timeFile}`)
    const htmlTemplate = utils.readFile(`${config.srcAssetsDir}/${config.htmlTemplate}`)
    const rssTemplate = utils.readFile(`${config.srcAssetsDir}/${config.rssTemplate}`)
    const rssItemTemplate = utils.readFile(`${config.srcAssetsDir}/${config.itemTemplate}`)

    const textContentArray = await utils.splitContent(textContent, config.contentSplitter);
    const contentArray = await generateData(textContentArray, timeContent);
    await generateHtml(contentArray, htmlTemplate, styleHasChanged, config.buildDir);
    await generateRss(contentArray, rssTemplate, rssItemTemplate, config.buildDir);
    await utils.mkDir(config.buildMediaDir);
}

generateAll();