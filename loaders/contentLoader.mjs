import textParser from "./kaku.mjs";
import timeParser from "./time.mjs";
import createGraph from "./graph.mjs";
import parseFeeds from './feeds.mjs'

function parseKaku(raw) {
  const text = raw
    .split("====")
    .map((x) => {
      const name = x.match(/NAME:((?:\\[\s\S]|[^\\])+?)\n/);
      const host = x.match(/HOST:((?:\\[\s\S]|[^\\])+?)\n/);
      const bref = x.match(/BREF:((?:\\[\s\S]|[^\\])+?)\n/);
      const priv = x.match(/PRIV:((?:\\[\s\S]|[^\\])+?)\n/);
      const menu = x.match(/MENU:((?:\\[\s\S]|[^\\])+?)\n/);
      const feed = x.match(/FEED:((?:\\[\s\S]|[^\\])+?)\n/);
      const date = x.match(/DATE:((?:\\[\s\S]|[^\\])+?)\n/);
      const content = x.match(/BODY:((?:\\[\s\S]|[^\\])+?)$/);

      x = {
        name: name[1].trim(),
        id: name[1].trim().toLowerCase().replace(/ /g, "_"),
        slug: name[1].trim().toLowerCase().replace(/ /g, "-"),
        host: host[1].trim(),
        hostId: host[1].trim().toLowerCase().replace(/ /g, "_"),
        hostslug: host[1].trim().toLowerCase().replace(/ /g, "-"),
        bref: bref[1].trim(),
        priv: priv[1].trim(),
        menu: menu[1].trim(),
        feed: feed[1].trim(),
        created: date[1].trim(),
        content: textParser(content[1].trim()),
      };
      return x;
    });
  return text;
}

export async function contentLoader() {
  const text = [];
  for await (const file of Deno.readDir(`./_data`)) {
    if (file.isFile && file.name.substr(file.name.length - 4) === "kaku") {
      const raw_content = await Deno.readTextFile(`./_data/${file.name}`);
      const content = parseKaku(raw_content);
      text.push(...content);
    }
  }

  const raw_time = await Deno.readTextFile("./_data/time.txt");
  const time = raw_time
    .split("\n")
    .map((x) => x.split(" "))
    .map(
      (x) => (x = {
        year: x[0],
        week: x[1],
        activity: x[2].replace(/_/g, " "),
        activityId: x[2].toLowerCase(),
        name: x[3].replace(/_/g, " "),
        id: x[3].toLowerCase(),
        hours: x[4],
      }),
    );

  const projects = time.reduce((r, a) => {
    r[a.id] = r[a.id] || [];
    r[a.id].push(a);
    return r;
  }, Object.create(null));

  const activities = time.reduce((r, a) => {
    r[a.activityId] = r[a.activityId] || [];
    r[a.activityId].push(a);
    return r;
  }, Object.create(null));

  //Find matching ids between text entries and project/activities
  for (const textkey in text) {
    const txt = text[textkey];
    for (const projkey in projects) {
      const proj = projects[projkey];
      if (proj[0]) {
        if (txt.id === proj[0].id) {
          txt.entries = [];
          proj.map((x) => txt.entries.push(x));
          txt.first = `week ${proj[0].week} of ${proj[0].year}`;
          txt.last = `week ${proj[proj.length - 1].week} of ${
            proj[proj.length - 1].year
          }`;
          txt.total = 0;
          proj.map((x) => (txt.total += parseInt(x.hours)));
          delete projects[projkey];
        }
      }
    }
  }

  for (const textkey in text) {
    const txt = text[textkey];
    for (const actkey in activities) {
      const act = activities[actkey];
      if (act[0]) {
        if (txt.id === act[0].activityId) {
          txt.entries = [];
          act.map((x) => txt.entries.push(x));
          txt.first = `week ${act[0].week} of ${act[0].year}`;
          txt.last = `week ${act[act.length - 1].week} of ${
            act[act.length - 1].year
          }`;
          txt.total = 0;
          act.map((x) => (txt.total += parseInt(x.hours)));
          delete activities[actkey];
        }
      }
    }
  }

  const remainingProjects = [];
  for (const i in projects) {
    const el = projects[i];
    const project = [];
    project.entries = [];
    el.map((x) => {
      project.entries.push(x);
    });
    project.name = el[0].name;
    project.slug = el[0].name.toLowerCase().replace(/ /g, "-");
    project.bref = "Generated by the time tracker";
    project.id = el[0].id;
    project.host = "Stubs";
    project.hostId = "stubs";
    project.hostslug = "stubs";
    project.first = `Week ${el[0].week} of ${el[0].year}`;
    project.last = `Week ${el[el.length - 1].week} of ${
      el[el.length - 1].year
    }`;
    project.total = 0;
    project.priv = "false";
    el.map((x) => (project.total += parseInt(x.hours)));
    remainingProjects.push(project);
  }

  const remainingActivities = [];
  for (const i in activities) {
    const el = activities[i];
    const activity = [];
    activity.entries = [];
    el.map((x) => {
      activity.entries.push(x);
    });
    activity.name = el[0].activity;
    activity.slug = el[0].activity.toLowerCase().replace(/ /g, "-");
    activity.bref = "Generated by the time tracker";
    activity.id = el[0].activity.toLowerCase().replace(/ /g, "_");
    activity.host = "Stubs";
    activity.hostId = "stubs";
    activity.hostslug = "stubs";
    activity.first = `Week ${el[0].week} of ${el[0].year}`;
    activity.last = `Week ${el[el.length - 1].week} of ${
      el[el.length - 1].year
    }`;
    activity.total = 0;
    activity.priv = "false";
    el.map((x) => (activity.total += parseInt(x.hours)));
    remainingActivities.push(activity);
  }

  
  const all = [...remainingProjects, ...remainingActivities, ...text];
  const timeText = await timeParser(raw_time);
  const timeEntries = Object.keys(time).length;
  const pageEntries = Object.keys(text).length;
  const orphanProjects = remainingProjects.length;
  const orphanActivities = remainingActivities.length;
  const allEntries = Object.keys(all).length;

  const feed_raw = await Deno.readTextFile("./_data/live_feed.xml");
  let feedSplit = feed_raw.split("</author>").pop().split("</entry>")

  all.forEach(async (x) => {
    if(x.name === "Feeds") {
      x.content += await parseFeeds()
    }
    if (x.name === "Time") {
      x.content += timeText;
    }
    if (x.name === "Sitemap") {
      x.content += `<dl>
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
      </dl>`;
      x.content += createRecursiveList(toTree(all));
    }
    if (x.entries) {
      x.timeGraph = createGraph(x.entries.reverse());
    }
    if(x.priv === "false") {
      x.generated = checkDate(x, feedSplit);
      x.generated === undefined ? x.generated = Date.now() : x.generated   
    }
  });
  const sitemapArr = toTree(all);
  const finalTree = setMainCategories(sitemapArr, null);
  return finalTree
}


function checkDate(page, feedText) {
  let date = undefined
  feedText.forEach((el) => {
    const titleP = `<title>(${page.name})</title>`;
    const re = new RegExp(titleP, "");
    const rssTest = re.test(el);
    const currentDate = /<updated>(.*)<\/updated>/.exec(el)
    if (rssTest) {
      const regex = /<content type="html">(.*?)<\/content>/s
      const elcontent = el.match(regex)[1].replace(/(\s|\r\n|\r|\n)/g,"").trim();
      const pagecontent = page.content.replace(/(\s|\r\n|\r|\n)/g, "").trim();
      const contentTest = elcontent === pagecontent ? true : false;
      if (contentTest) {
        date = currentDate[1]
      } else {
        console.log(page.name)
          date = Date.now()
      } 
    } 
  });
  return date;
}

function setMainCategories(arr, category) {
  for (let i = 0; i < arr.length; i++) {
    const el = arr[i];
    if (el.hostslug === "") {
      category = el.slug;
      el.category = el.slug;
    } else if (el.hostslug === "home") {
      category = el.slug;
      el.category = el.slug;
    } else {
      el.category = category;
    }
    if (el.childPages.length > 0) {
      setMainCategories(el.childPages, category);
    }
  }
  return arr;
}

function toTree(list) {
  const map = {};
  let node, i;
  const roots = [];

  for (i = 0; i < list.length; i += 1) {
    map[list[i].id] = i; // initialize the map
    list[i].childPages = []; // initialize the children
  }

  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node.name === "Home") {
      node.hostId = "";
    }
    if (node.hostId !== "") {
      list[map[node.hostId]].childPages.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function createRecursiveList(tree) {
  let html = "<ul>";
  tree.forEach(function (el) {
    if (el.slug && el.priv === "false") {
      const list = createRecursiveItem(el);
      html += list;
    }
  });
  html += "</ul>";
  return html;
}

function createRecursiveItem(elem) {
  let html = "<li>";
  html += `<a href="${elem.slug}.html">${elem.name}</a>`;
  if (elem.childPages.length > 0) {
    html += createRecursiveList(elem.childPages);
  }
  html += "</li>";
  return html;
}
