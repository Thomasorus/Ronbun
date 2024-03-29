const patterns = [
  "checks",
  "checks-diagonal",
  "grid",
  "grid-medium",
  "cross-dots",
  "vertical-lines",
  "horizontal-lines",
  "diagonal-lines-left",
  "diagonal-lines-right",
  "vertical-stripes",
  "horizontal-stripes",
  "diagonal-stripes-left",
  "diagonal-stripes-right",
  "double-diagonal-stripes",
  "zig-zag",
  "zig-zag-3d",
  "triangles",
  "quarter-circles",
  "seigaiha",
  "wave",
  "yinyang",
  "circles-small",
  "circles-medium",
  "circles-large",
  "stars",
  "squares",
  "paper",
  "cubes",
];

async function parseTime(timeToParse) {
  const cleanedEntries = [];
  const splittedEntries = timeToParse.split(/\r?\n/);
  for (let i = 0; i < splittedEntries.length; i++) {
    const entry = await cleanEntry(splittedEntries[i]);
    if (entry !== null) {
      cleanedEntries.push(entry);
    }
  }
  return cleanedEntries;
}

function cleanEntry(entry) {
  const newEntry = entry.split(" ");
  const result = newEntry.map((s) => s.trim());
  const weekNum = result[1];
  if (!isNaN(weekNum)) {
    return result;
  } else {
    return null;
  }
}

function createWeeks(allWeeks) {
  const years = [];

  // Splitting activities by years
  allWeeks.forEach((activity) => {
    // Create years
    const yearObj = {
      year: activity[0],
      entries: [],
      cleaned: [],
    };
    if (!years.length) {
      years.push(yearObj);
      years[0].entries.push(activity);
    } else {
      const neededYear = years.find(({
        year,
      }) => year === activity[0]);

      if (neededYear) {
        neededYear.entries.push(activity);
      } else {
        years.push(yearObj);
        const newNeededYear = years.find(({
          year,
        }) => year === activity[0]);
        newNeededYear.entries.push(activity);
      }
    }
  });

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const activities = year.entries;

    const acc = [];

    activities.forEach((activity) => {
      const yearNumber = activity[0];
      const weekNumber = activity[1];
      const entries = {
        activity: activity[2],
        project: activity[3],
        hours: activity[4],
      };
      const weekObj = {
        year: yearNumber,
        week: weekNumber,
        entries: [entries],
      };

      if (!acc.length) {
        acc.push(weekObj);
      } else {
        const result = acc.find(({
          week,
        }) => week === weekNumber);

        if (!result) {
          acc.push(weekObj);
        } else if (result.week === weekNumber) {
          result.entries.push(entries);
        }
      }
    });
    acc.forEach((el) => {
      year.cleaned.push(el);
    });
  }
  years.forEach((el) => {
    delete el.entries;
  });
  return years;
}

function createGraph(yearsData, graphs, type) {
  let template = `<h3>Time by ${type}</h3><div class='time-graph'>`;
  for (let i = 0; i < yearsData.length; i++) {
    const weekData = yearsData[i];
    const activities = weekData.entries;
    let weekTemplate = "";
    const week = weekData.week;

    for (let i = 0; i < activities.length; i++) {
      const el = activities[i];

      const activity = el.activity;
      const project = el.project;
      const hours = el.hours;
      const size = hours * 10;
      let pattern = "";

      for (let i = 0; i < graphs.length; i++) {
        const el = graphs[i];
        const keeey = Object.keys(el).toString();
        const valuuuue = Object.values(el).toString();

        if (type === "activity") {
          if (keeey === activity) {
            pattern = valuuuue;
          }
        } else {
          if (keeey === project) {
            pattern = valuuuue;
          }
        }
      }

      let tempLi = "";
      if (hours > 0) {
        tempLi =
          `<li class="time-graph__activity"><svg  height="${size}" width="100%"><rect style="fill: url(#${pattern});" height="100%" width="100%"></rect></svg><span class="time-graph__hours" aria-hidden="true">${hours}</span><span class="time-graph__tooltip" aria-hidden="true">${
            activity.replace(
              /_/g,
              " ",
            )
          } on ${
            project.replace(
              /_/g,
              " ",
            )
          } during ${hours} hours.</span><span class="visually-hidden">${
            activity.replace(
              /_/g,
              " ",
            )
          } on ${
            project.replace(/_/g, " ")
          } during ${hours} hours.</span></li>`;
      } else {
        tempLi =
          `<li class="time-graph__activity><span class="time-graph__hours" aria-hidden="true">${hours}</span><span class="visually-hidden">Nothing during week ${week}.</span></li>`;
      }

      weekTemplate = weekTemplate + tempLi;
    }

    weekTemplate =
      `<ul class='time-graph__week'><span aria-hidden="true">${week}</span><span class="visually-hidden">Week ${week}</span>${weekTemplate}</ul>`;

    template = template + weekTemplate;
  }

  template = template + "</div>";
  return template;
}

function createActivitiesPatterns(yearsData) {
  const act = [];

  for (let i = 0; i < yearsData.length; i++) {
    const weekData = yearsData[i];
    const activities = weekData.entries;

    for (let u = 0; u < activities.length; u++) {
      const element = activities[u];
      const acti = element.activity;
      act.push(acti);
    }
  }

  const uniqueChars = [...new Set(act)];

  const activitiesPatterns = [];
  for (let i = 0; i < uniqueChars.length; i++) {
    const el = uniqueChars[i];
    if (el !== "null") {
      const acti = {};
      acti[el] = patterns[i];
      activitiesPatterns.push(acti);
    }
  }
  return activitiesPatterns;
}

function createProjectsPatterns(yearsData) {
  const proj = [];

  for (let i = 0; i < yearsData.length; i++) {
    const weekData = yearsData[i];
    const projects = weekData.entries;

    for (let u = 0; u < projects.length; u++) {
      const element = projects[u];
      const acti = element.project;
      proj.push(acti);
    }
  }

  const uniqueProjects = [...new Set(proj)];
  const projectsPatterns = [];
  for (let i = 0; i < uniqueProjects.length; i++) {
    const el = uniqueProjects[i];
    if (el !== "null") {
      const proje = {};
      proje[el] = patterns[i];
      projectsPatterns.push(proje);
    }
  }
  return projectsPatterns;
}

function createLegend(array, hours) {
  let legendTlp =
    "<div class='time-graph__legend-container'><ul class='time-graph__legend-list'>";

  for (let i = 0; i < array.length; i++) {
    const el = array[i];
    const key = Object.keys(el).toString();

    const time = hours.find(({
      dataType,
    }) => dataType === key);

    const definition = Object.keys(el);
    const legend =
      `<li class="time-graph__legend"><svg aria-hidden="true" height="18" width="18"><rect style="fill: url(#${
        Object.values(el)
      });" height="100%" width="100%"></rect></svg></span><span class="time-graph__definition"> <a href="${
        definition[0].toLowerCase().replace(/_/g, "-")
      }.html">${
        definition[0].replace(/_/g, " ")
      }: ${time.hours} hours</a></span></li>`;
    legendTlp = legendTlp + legend;
  }
  return `${legendTlp}</ul></div>`;
}

function createHours(allEntries, type, year) {
  const hours = [];

  for (let i = 0; i < allEntries.length; i++) {
    const el = allEntries[i];
    if (year === el[0]) {
      let entryObj = {};
      if (type === "activity") {
        entryObj = {
          dataType: el[2],
          hours: parseInt(el[4]),
        };
      } else if (type === "project") {
        entryObj = {
          dataType: el[3],
          hours: parseInt(el[4]),
        };
      }
      if (entryObj.dataType !== "null") {
        if (!hours.length) {
          hours.push(entryObj);
        } else {
          const result = hours.find(
            ({
              dataType,
            }) => dataType === entryObj.dataType,
          );
          if (!result) {
            hours.push(entryObj);
          } else if (result.dataType === entryObj.dataType) {
            result.hours = result.hours + entryObj.hours;
          }
        }
      }
    }
  }
  return hours;
}

function createTotalHours(
  yearsData,
  totalActivities,
  totalProjects,
  year,
) {
  let total = 0;
  const weeks = yearsData.length;
  for (let i = 0; i < yearsData.length; i++) {
    const el = yearsData[i];
    for (let u = 0; u < el.entries.length; u++) {
      const a = el.entries[u];
      const hours = parseInt(a.hours);
      total = total + hours;
    }
  }
  const perWeek = Math.round(total / weeks);
  return `<p>I spent <strong>${total} hours</strong> on <strong>${totalActivities} activities</strong> for <strong>${totalProjects} projects</strong>. On <strong>week ${weeks}</strong> of <strong>${year}</strong>, my personal projects took me around <strong>${perWeek} hours each week</strong>.</p>`;
}

async function generateTime(textContent) {
  // Parsing file
  const allEntries = await parseTime(textContent);

  // Splitting entries by year and week
  const allData = await createWeeks(allEntries);
  const reversedData = allData.reverse();
  let graph = "";

  for (let i = 0; i < reversedData.length; i++) {
    const e = allData[i];
    const yearsData = e.cleaned;
    const year = yearsData[0].year;

    // Determining patterns for each activity and project
    const activitiesPatterns = await createActivitiesPatterns(yearsData);
    const projectsPatterns = await createProjectsPatterns(yearsData);

    // //Creating graphs
    const activitiesGraph = await createGraph(
      yearsData,
      activitiesPatterns,
      "activity",
    );
    const projectsGraph = await createGraph(
      yearsData,
      projectsPatterns,
      "project",
    );

    // console.log(allEntries)

    // //Create hours for each activity and project
    const activitiesHours = await createHours(allEntries, "activity", year);
    const projectsHours = await createHours(allEntries, "project", year);

    // console.log(projectsHours)

    // //Create graph legends
    const activitiesLegend = await createLegend(
      activitiesPatterns,
      activitiesHours,
    );
    const projectsLegend = await createLegend(projectsPatterns, projectsHours);

    // //Create total hours
    const totalHours = await createTotalHours(
      yearsData,
      activitiesPatterns.length,
      projectsPatterns.length,
      year,
    );

    const yearText = `<h2>Year ${year}</h2>`;

    graph = graph +
      yearText +
      totalHours +
      "<div class='time-graph-container'>" +
      activitiesGraph +
      activitiesLegend +
      "</div>" +
      "<div class='time-graph-container'>" +
      projectsGraph +
      projectsLegend +
      "</div>";
  }
  return graph;
}

export { generateTime as default };
