import * as fs from 'fs'
import {
    exec
} from "child_process"
import parser from './kaku.mjs'
import generateTime from './time.mjs'

async function retrievePageData(text) {

    for (let i = 0; i < splitContent.length; i++) {
        const el = splitContent[i];
        if (el) {
            const content = retrievePageData(el);
            allPages.push(content)
        }
    }

    const symbols = [
        /(?:NAME:)((?:\\[\s\S]|[^\\])+?)\n/g,
        /(?:HOST:)((?:\\[\s\S]|[^\\])+?)\n/g,
        /(?:BREF:)((?:\\[\s\S]|[^\\])+?)\n/g,
        /(?:BODY:)((?:\\[\s\S]|[^\\])+?)$/g,
    ];

    const page = []

    for (let i = 0; i < symbols.length; i++) {
        const s = symbols[i]
        if (text.match(s)) {
            const match = text.match(s)
            const type = match[0].substring(0, 4).toLowerCase()
            const value = match[0].substr(5).trim()
            page[type] = value;
        }
    }
    return page
}


async function splitContent(textContent) {
    const tempPage = []
    const splitContent = textContent.split("====");
    for (let i = 0; i < splitContent.length; i++) {
        const el = splitContent[i];
        if (el) {
            const content = await retrievePageData(el);
            tempPage.push(content)
        }
    }
    return tempPage
}


async function generateHtml(allPages, htmlTemplate) {
    fs.mkdirSync('./dist');

    for (let i = 0; i < allPages.length; i++) {
        const el = allPages[i];
        let page = htmlTemplate
        console.log(el.name)
        page = page.replace(/pageTitle/g, `${el.name} - Thomasorus`)
        page = page.replace(/metaDescription/g, el.bref)
        if (el.name.toLowerCase() !== el.host.toLowerCase() && el.host !== undefined) {
            const parentSlug = el.host.toLowerCase().replace(/\b \b/g, "-")
            page = page.replace(/breadCrumb/g, `<nav role="breadcrumb"><i>Back to <a href="${parentSlug}.html">${el.host}</a></i></nav>`)
        } else {
            page = page.replace(/breadCrumb/g, '')
        }
        page = page.replace(/pageBody/g, parser(el.body))

        const slug = el.name.toLowerCase().replace(/\b \b/g, "-")
        fs.writeFileSync(`./dist/${slug}.html`, page, err => {
            if (err) {
                console.log(err);
                throw err;
            }
        });
    }
}

async function generateTimePage(graph, htmlTemplate) {
    let page = htmlTemplate
    page = page.replace("<article>", "<article class='full'>")
    page = page.replace(/pageTitle/g, "Time")
    page = page.replace(/breadCrumb/g, `<nav>Back to <a href="tracking.html">Tracking</a></nav>`)
    graph = "<h1>Time</h1>\n" + graph
    page = page.replace(/pageBody/g, graph)

    fs.writeFileSync(`./dist/time.html`, page, err => {
        if (err) {
            console.log(err);
            throw err;
        }
    });
}


async function getCss(cssPath, cssDestination) {
    fs.mkdirSync('dist/assets');
    fs.copyFile(cssPath, cssDestination, err => {
        if (err) throw err;
    });
}



async function generateAll(dir) {
    console.log('Building site...')
    fs.rmdirSync(dir, {
        recursive: true
    });
    const textContent = fs.readFileSync("data/content.kaku", 'utf8');
    const allPages = await splitContent(textContent);
    const htmlTemplate = fs.readFileSync("assets/main.html", 'utf8');
    await generateHtml(allPages, htmlTemplate);
    await getCss('assets/style.css', 'dist/assets/style.css');
    fs.mkdirSync('dist/media');
    const imgProcess = fs.readFileSync("src/images.sh", 'utf8')
    fs.copyFile('assets/logo.png', 'dist/assets/logo.png', err => {
        if (err) throw err;
    });
    exec(imgProcess, {
        encoding: 'utf-8'
    });
    let timeContent = fs.readFileSync("data/time.kaku", "utf8");
    const graph = await generateTime(timeContent);
    await generateTimePage(graph, htmlTemplate)
    console.log('Finished!')

}

generateAll("./dist");