const patterns = [
  "pattern-checks",
  "pattern-grid",
  "pattern-dots",
  "pattern-cross-dots",
  "pattern-vertical-lines",
  "pattern-horizontal-lines",
  "pattern-diagonal-lines",
  "pattern-vertical-stripes",
  "pattern-horizontal-stripes",
  "pattern-diagonal-stripes",
  "pattern-zigzag",
  "pattern-triangles",
  "pattern-diagonal-stripes--alt",
  "pattern-diagonal-lines--alt"
]

async function parseTime(timeToParse) {
  let cleanedEntries = [];
  let splittedEntries = timeToParse.split(/\r?\n/);
  for (let i = 0; i < splittedEntries.length; i++) {
    let entry = await cleanEntry(splittedEntries[i]);
    if (entry !== null) {
      cleanedEntries.push(entry);
    }
  }
  return cleanedEntries;
}

async function cleanEntry(entry) {
  let newEntry = entry.split(" ");
  let result = newEntry.map(s => s.trim());
  let weekNum = result[1];
  if (!isNaN(weekNum)) {
    return result;
  } else {
    return null;
  }
}

async function createWeeks(allWeeks) {
  const year = [];
  allWeeks.forEach(week => {
    const yearNumber = week[0]
    const weekNumber = week[1];
    const entries = [{
        activity: week[2]
      },
      {
        project: week[3]
      },
      {
        hours: week[4]
      }
    ];
    const weekObj = {
      year: yearNumber,
      week: weekNumber,
      entries: [entries]
    };
    if (!year.length) {
      year.push(weekObj);
    } else {
      const result = year.find(({
        week
      }) => week === weekNumber);
      if (!result) {
        year.push(weekObj);
      } else if (result.week === weekNumber) {
        result.entries.push(entries);
      }
    }
  });
  return year;
}

async function createGraph(yearData, graphs, type) {
  let template = `<h2>Time by ${type}</h2><div class='time-graph'>`
  for (let i = 0; i < yearData.length; i++) {
    const weekData = yearData[i]
    const activities = weekData["entries"]
    let weekTemplate = ""
    const year = weekData["year"]
    const week = weekData["week"]

    activities.forEach(el => {

      const activity = el[0].activity
      const project = el[1].project
      const hours = el[2].hours
      const size = hours * 10;
      let pattern = ""

      for (let i = 0; i < graphs.length; i++) {
        const el = graphs[i];
        const keeey = Object.keys(el).toString()
        const valuuuue = Object.values(el).toString()
        
        if(type === "activity") {
          if(keeey === activity) {
            pattern = valuuuue
          }
        } else {
          if(keeey === project) {
            pattern = valuuuue
          }
        }
        
      }

      const tempLi = `<li style="height:${size}px;" class="time-graph__activity ${pattern}" title="${activity} on ${project} during ${hours} hours."><span class="time-graph__hours">${hours}</span></li>`

      weekTemplate = weekTemplate + tempLi
    });

    weekTemplate = `<ul class='time-graph__week'><span>${week}</span>${weekTemplate}</ul>`
    template = template + weekTemplate
  }


  template = template + "</div>"
  return template;
}

async function createActivitiesPatterns(yearData) {

  let act = []

  for (let i = 0; i < yearData.length; i++) {
    const weekData = yearData[i]
    const activities = weekData["entries"]
    activities.forEach(el => {
      act.push(el[0].activity)
    })
  }

  let uniqueChars = [...new Set(act)];


  let activitiesPatterns = []
  for (let i = 0; i < uniqueChars.length; i++) {
    const el = uniqueChars[i];
    if(el !== "null") {
      let acti = {}
      acti[el] = patterns[i]
      activitiesPatterns.push(acti)
    }
  }
  
  return activitiesPatterns
}

async function createProjectsPatterns(yearData) {
  let proj = []

  for (let i = 0; i < yearData.length; i++) {
    const weekData = yearData[i]
    const activities = weekData["entries"]
    activities.forEach(el => {
      proj.push(el[1].project)
    })
  }

  let uniqueProjects = [...new Set(proj)];
  let projectsPatterns = []
  for (let i = 0; i < uniqueProjects.length; i++) {
    const el = uniqueProjects[i];
    if(el !== "null") {
      let proje = {}
      proje[el] = patterns[i]
      projectsPatterns.push(proje) 
    }
  }
  return projectsPatterns
}

async function createLegend(array) {
  let legendTlp = "<div class='time-graph__legend-container'>"
  array.forEach(el => {
    console.log(Object.keys(el))
    const legend = `<dl class="time-graph__legend"><dt class="time-graph__pattern ${Object.values(el)}"></dt><dd class="time-graph__definition">${Object.keys(el)}</dd></dl>`
    legendTlp = legendTlp + legend
  });
  return legendTlp + "</div>"
}

async function generateTime(textContent) {
  const allEntries = await parseTime(textContent);
  const yearData = await createWeeks(allEntries);

  const activitiesPatterns = await createActivitiesPatterns(yearData);
  const projectsPatterns = await createProjectsPatterns(yearData);

  const activitiesGraph = await createGraph(yearData, activitiesPatterns, 'activity');
  const projectGraph = await createGraph(yearData, projectsPatterns, "project");

  const activitiesLegend = await createLegend(activitiesPatterns);
  const projectsLegend = await createLegend(projectsPatterns);


  const graph = projectGraph + projectsLegend + activitiesGraph + activitiesLegend
  return graph
}

export {
  generateTime as
  default
};