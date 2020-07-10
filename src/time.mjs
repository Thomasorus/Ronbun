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
    const entries = [
      { activity: week[2] },
      { project: week[3] },
      { hours: week[4] }
    ];
    const weekObj = { year: yearNumber, week: weekNumber, entries: [entries] };
    if (!year.length) {
         year.push(weekObj);
    } else {
        const result = year.find(({ week }) => week === weekNumber);
        if (!result) {
            year.push(weekObj);
        } else if (result.week === weekNumber) {
            result.entries.push(entries);
        }
    }
  });
  return year;
}

async function generateTime(textContent) {
  const allEntries = await parseTime(textContent);
  const yearData = await createWeeks(allEntries);
  return yearData
}

export { generateTime as default };