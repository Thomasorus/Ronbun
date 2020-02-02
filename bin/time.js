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

function parseTime(timeToParse) {
  let splitted = timeToParse.split(/\r?\n/);
  let week = [];

  for (let i = 0; i < splitted.length; i++) {
    let line = parseLine(splitted[i]);
    if (line !== null) {
      week.push(line);
    }
  }
  regroupWeeks(week);
}

function parseLine(lineToParse) {
  let split = lineToParse.split("|");
  split.shift();
  split.pop();
  let result = split.map(s => s.trim());
  let weekNum = result[0];
  if (!isNaN(weekNum)) {
    return result;
  } else {
    return null;
  }
}

function regroupWeeks(allWeeks) {
  let year = [];

  // Trouver un moyen de créer un array pour toutes les semaines de l'année et d'itérer dessus.

  for (let i = 0; i < allWeeks.length; i++) {
    let element = allWeeks[i];
    let weekNumber = parseInt(element[0]);
    let activities = element.splice(1);
    year.push(element);
  }
  console.log(allWeeks);
}

parseTime(help);
