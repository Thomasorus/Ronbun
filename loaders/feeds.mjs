// Lists websites and writes them inside the the rss page as a js array

async function parseFeeds() {
    const raw_rss = await Deno.readTextFile("./_data/feeds.txt")
    const list = raw_rss.split('\n')

    let html = "<details id='feedList'><summary>Click to see the list of feeds</summary><ul>"
    for (let i = 0; i < list.length; i++) {
        const url = list[i];
        html += `<li >
            <a id="feedUrl" href="${url}">${url}</a>
        </li>`
    }
    html += "</ul></details>"
    return html
}

export { parseFeeds as default };