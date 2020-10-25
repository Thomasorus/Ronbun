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
    //fs.mkdirSync('./dist');

    for (let i = 0; i < allPages.length; i++) {
        const el = allPages[i]
        const name = el.name + " - Thomasorus"
        const slug = el.name.toLowerCase().replace(/\b \b/g, "-")
        const bref = el.bref
        const text = parser(el.body)
        const host = el.host
        const hostSlug = el.host.toLowerCase().replace(/\b \b/g, "-")
        let hostNav = ""

        //Check if page and parent page are the same
        if (el.name.toLowerCase() !== el.host.toLowerCase() && el.host !== undefined) {
            hostNav = `<nav role="breadcrumb"><i>Back to <a href="${hostSlug}.html">${host}</a></i></nav>`
        }

        let page = htmlTemplate
            page = page.replace(/pageTitle/g, `${name}`)
            page = page.replace(/metaDescription/g, bref)
            page = page.replace(/breadCrumb/g, hostNav)            
            page = page.replace(/pageBody/g, text)
           
        //Checking if page already exists in dir
        let existingPage;
        let error;
        try	{
        	existingPage = fs.readFileSync(`./dist/${slug}.html`,'utf8');
        } catch(err) {
        	error = err.code;
        }

        //If page does not exist
        if(error === "ENOENT") {
            console.log(`New page: ${name}`)

            fs.writeFileSync(`./dist/${slug}.html`, page, err => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            });
        } else {

            //Gathering content from existing html page for comparaison
            const titleContent = RegExp(/ <title>([\s\S]*?)<\/title>/).exec(existingPage);
            const htmlTitle = titleContent[1].replace(/\n/g, "").trim() === name.replace(/\n/g, "").trim() ? true : false  
            
            const brefContent = RegExp(/ <meta name="description" content="([\s\S]*?)">/).exec(existingPage);
            const htmlBref = brefContent[1].replace(/\n/g, "").trim() === bref.replace(/\n/g, "").trim() ? true : false        

            let HostSlugContent;
            let htmlHostSlug;
       
            HostSlugContent = RegExp(/html">([\s\S]*?)<\/a><\/i><\/nav>/).exec(existingPage);
            if(HostSlugContent != null) {
                htmlHostSlug = HostSlugContent[1].replace(/\n/g, "").trim() === host.replace(/\n/g, "").trim() ? true : false
            } else { 
                htmlHostSlug = true
            }
        
            const textContent = RegExp(/<article>([\s\S]*?)<\/article>/).exec(existingPage);
            const htmlText = textContent[1].replace(/\n/g, "").trim() === text.replace(/\n/g, "").trim() ? true : false

            //If something change rebuild, else skip
            if(htmlTitle  === false || htmlBref  === false|| htmlHostSlug  === false|| htmlText === false) {
                console.log("Rebuilding...")
                console.log({name, htmlTitle, htmlBref, htmlHostSlug, htmlText})
                
                fs.rmSync(`./dist/${slug}.html`);
                fs.writeFileSync(`./dist/${slug}.html`, page, err => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                });
            } else {
                console.log(`Skipping ${name}`)
            }
        }
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
    //fs.mkdirSync('dist/assets');
    fs.copyFile(cssPath, cssDestination, err => {
        if (err) throw err;
    });
}



async function generateAll(dir) {
    console.log('Building site...')
    //fs.rmdirSync(dir, {
      //  recursive: true
    //});
    const textContent = fs.readFileSync("data/content.kaku", 'utf8');
    const allPages = await splitContent(textContent);
    const htmlTemplate = fs.readFileSync("assets/main.html", 'utf8');
    await generateHtml(allPages, htmlTemplate);
    await getCss('assets/style.css', 'dist/assets/style.css');
    //fs.mkdirSync('dist/media');
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
