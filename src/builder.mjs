import * as fs from 'fs'
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


async function generateHtml(allPages, htmlTemplate, styleHasChanged) {

    console.log("Starting page build")

    for (let i = 0; i < allPages.length; i++) {
        const el = allPages[i]
        const name = el.name + " - Thomasorus"
        const slug = el.name.toLowerCase().replace(/\b \b/g, "-")
        const bref = el.bref
        const text = parser(el.body)
        const host = el.host
        const hostSlug = el.host.toLowerCase().replace(/\b \b/g, "-")
        const today = new Date()
        const date = today.getDate() +'/'+ today.getMonth()+'/'+ today.getFullYear() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
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
            page = page.replace(/pageTimeContent/g, date)
            page = page.replace(/pageTimeDesign/g, date)

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
            if(HostSlugContent !== null) {
                htmlHostSlug = HostSlugContent[1].replace(/\n/g, "").trim() === host.replace(/\n/g, "").trim() ? true : false
            } else { 
                htmlHostSlug = true
            }
        
            const textContent = RegExp(/<article>([\s\S]*?)<\/article>/).exec(existingPage);
            const htmlText = textContent[1].replace(/\n/g, "").trim() === text.replace(/\n/g, "").trim() ? true : false

            const contentChange = RegExp(/content update: <time>([\s\S]*?)<\/time>/).exec(existingPage);
           

            //If something changed rebuild, else skip
            if(htmlTitle  === false || htmlBref  === false|| htmlHostSlug  === false|| htmlText === false || styleHasChanged) {
                console.log("Rebuilding...")
                console.log({name, htmlTitle, htmlBref, htmlHostSlug, htmlText, styleHasChanged})
                
                if(styleHasChanged) {
                    page = page.replace(/pageTimeContent/g, contentChange[1])
                } else {
                    page = page.replace(/pageTimeContent/g, date)
                }
                

                fs.unlinkSync(`./dist/${slug}.html`);
                fs.writeFileSync(`./dist/${slug}.html`, page, err => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                });
            } else {
                console.log(`Skipping ${el.name}`)
            }
        }
	}
}

async function generateTimePage(graph, htmlTemplate, dir) {
    let page = htmlTemplate
    page = page.replace("<article>", "<article class='full'>")
    page = page.replace(/pageTitle/g, "Time")
    page = page.replace(/breadCrumb/g, `<nav>Back to <a href="tracking.html">Tracking</a></nav>`)
    graph = "<h1>Time</h1>\n" + graph
    page = page.replace(/pageBody/g, graph)

    const today = new Date()
        const date = today.getDate() +'/'+ today.getMonth()+'/'+ today.getFullYear() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    page = page.replace(/pageTimeContent/g, date)

    fs.writeFileSync(`${dir}/time.html`, page, err => {
        if (err) {
            console.log(err);
            throw err;
        } 
    });
    console.log("Tracking page done!")
}


async function getFileSize(dir) {
    const stats = fs.statSync(dir)
    return stats.size
}

async function copyAsset(dir, file) {
    if (fs.existsSync(`${dir}/assets/${file}`)) {
        const oldFile = await getFileSize(`${dir}/assets/${file}`)
        const newFile = await getFileSize(`assets/${file}`)
        if(oldFile !== newFile) {
            console.log(`Changes for ${file}`)
            fs.copyFile(`assets/${file}`, `${dir}/assets/${file}`, err => {
                if (err) {
                    throw err 
                }
            });
            return true
        } else {
            console.log(`No change for ${file}`)
            return false
        }
    } 
    else {
        console.log(`Copy of ${file}`)
        fs.copyFile(`assets/${file}`, `${dir}/assets/${file}`, err => {
            if (err) {
                throw err 
            }
        });
        return true
    }    
}

async function getCss(dir) {
    if (fs.existsSync(`${dir}/assets`)) {
        console.log('Assets directory exists!');
    } else {
        console.log('Assets directory not found. Creating...')
        fs.mkdirSync(`${dir}/assets`)
        console.log("Done")
    }    
    
    const logoChange = await copyAsset(dir, "logo.png")
    const templateCHange = await copyAsset(dir, "main.html")
    const styleChange = await copyAsset(dir, "style.css")

    console.log("Assets copied!")

     return logoChange || templateCHange || styleChange ? true : false
    
}

async function processImages(dir) {
    if (fs.existsSync(`${dir}/media`)) {
        console.log('Media directory exists!');
    } else {
        console.log('Media directory not found. Creating...')
        fs.mkdirSync(`${dir}/media`)
        console.log("Done")
    }
    console.log("Processing images")
}


async function generateAll(dir) {
    console.log('START')
    if (fs.existsSync(dir)) {
        console.log('The main directory exists!');
    } else {
        console.log('The main directory was not found. Creating...')
        fs.mkdirSync('./dist')
        console.log("Done")
    }

    const styleHasChanged = await getCss(dir);

    const textContent = fs.readFileSync("data/content.kaku", 'utf8');
    const allPages = await splitContent(textContent);
    const htmlTemplate = fs.readFileSync("assets/main.html", 'utf8');
    await generateHtml(allPages, htmlTemplate, styleHasChanged);

    let timeContent = fs.readFileSync("data/time.kaku", "utf8");
    const graph = await generateTime(timeContent);
    await generateTimePage(graph, htmlTemplate, dir)

    await processImages(dir);
}

generateAll("./dist");
