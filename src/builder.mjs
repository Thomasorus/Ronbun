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
        page = page.replace(/pageTitle/g, el.name)
        if (el.name.toLowerCase() !== el.host) {
            page = page.replace(/mainMenu/g, `<nav>Back to <a href="${el.host}.html">${el.host}</a></nav>`)
        } else {
            page = page.replace(/mainMenu/g, '')
        }
        page = page.replace(/pageBody/g, parser(el.body))

        fs.writeFileSync(`./dist/${el.name.toLowerCase()}.html`, page, err => {
            if (err) {
                console.log(err);
                throw err;
            }
        });
    }
}

async function generateTimePage(graph, htmlTemplate) {
    let page = htmlTemplate
    page = page.replace(/pageTitle/g, "Time")
    page = page.replace(/mainMenu/g, `<nav>Back to <a href="home.html">Home</a></nav>`)
    graph = "# Time\n" + graph
    page = page.replace(/pageBody/g, parser(graph))

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
    exec(imgProcess, {
        encoding: 'utf-8'
    });
    let timeContent = fs.readFileSync("data/time.kaku", "utf8");
    const graph = await generateTime(timeContent);
    await generateTimePage(graph, htmlTemplate)
    console.log('Finished!')

}

generateAll("./dist");