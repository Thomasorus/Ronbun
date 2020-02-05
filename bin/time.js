// const fs = require("fs");
// const path = require("path");

const help = `# Time Tracking

| week | activity | project    | hours |
| ---- | -------- | ---------- | ----- |
| 1    |          |            |       |
| 2    | dev      | wiki       | 6     |
| 3    | pod      | bgp        | 4     |
| 3    | dev      | wiki       | 1     |
| 4    | dev      | wiki       | 1     |
| 4    | pod      | bgp        | 8.5   |
| 5    | dev      | experiment | 2     |
| 5    | dev      | bgp        | 11    |
| 5    | edi      | bgp        | 4     |
`;

// let p = "../content/tracking/2020/2020-time.md";
// let textContent = fs.readFileSync(p, "utf8");

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
  let newEntry = entry.split("|");
  newEntry.shift();
  newEntry.pop();
  let result = newEntry.map(s => s.trim());
  let weekNum = result[0];
  if (!isNaN(weekNum)) {
    return result;
  } else {
    return null;
  }
}

async function createWeeks(allWeeks) {
  let year = [];
  allWeeks.forEach(week => {
    let weekNumber = week[0];
    let entries = [
      { activity: week[1] },
      { project: week[2] },
      { hours: week[3] }
    ];
    let weekObj = { week: weekNumber, entries: [entries] };

    if (year.length <= 0) {
      year.push(weekObj);
    }

    const result = year.find(({ week }) => week === weekNumber);

    if (result === undefined) {
      year.push(weekObj);
    } else if (result.week === weekNumber) {
      result.entries.push(entries);
    }
  });

  return year;
}

async function generateTime(help) {
  const allEntries = await parseTime(help);
  console.log({ allEntries });
  const yearData = await createWeeks(allEntries);
  console.log({ yearData });
}

generateTime(help);
