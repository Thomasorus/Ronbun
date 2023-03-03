function createGraph(data) {
    const yearList = data.map(x => x.year)
    const yearsDataSet = new Set(yearList);
    const years = [...yearsDataSet]
    const chartScale = 10
    const formatedData = []

    years.forEach(el => {
        let newEntry = []
        newEntry.name = el[0].name
        newEntry.year = el
        newEntry.maxHours = 0
        newEntry.years = Array(53).fill("0")
        for (let i = 0; i < data.length; i++) {
            const da = data[i];
            if (da.year === newEntry.year) {
                newEntry.name = da.name
                newEntry.years[da.week] = da.hours

                if (newEntry.maxHours < parseInt(da.hours)) {
                    newEntry.maxHours = parseInt(da.hours)
                }
            }
        }
        formatedData.push(newEntry)
    })

    let body = ""
    for (let i = 0; i < formatedData.length; i++) {
        const el = formatedData[i];
        el.scaleX = el.years.length * chartScale
        el.scaleY = el.maxHours * chartScale + chartScale
        el.path = `M${chartScale},${el.scaleY} `
        el.dots = ''
        el.hor = ''
        el.x = 0
        el.y = 0
        el.numbers = `<g><svg style="font-size:10px;" height="${el.scaleY}" width="20">`
        el.years.forEach(ul => {
            el.x = el.x + chartScale
            el.y = el.scaleY - (parseInt(ul) * chartScale)
            el.path += `${el.x},${el.y} `
            let dotSize = ul != 0 ? 3 : 2
            el.dots += `<circle cx="${el.x}" cy="${el.y}" r="${dotSize}" fill="var(--text, #000)" />`
        })
        for (let i = 0; i < el.maxHours + 1; i++) {
            el.hor += `<line x1="0" y1="${i * chartScale + chartScale}" x2="${el.scaleX}" y2="${i * chartScale + chartScale}" stroke="var(--text, #000)" opacity="0.3" stroke-width="0.5px" />`
            el.numbers += `<text fill="var(--text, #000)" x="0" y="${el.scaleY -1 - i * chartScale}">${i}</text>`
        }
        el.numbers += '</svg></g>'
        el.svg = `
          <div aria-hidden="true" style="overflow-x: auto;">
              <p style="text-align:center; max-width: ${el.scaleX}px; margin-left:${el.scaleY / chartScale}px;">${el.year}</p>
              <div style="font-size:12px; text-align:center; width:10px; display:inline-block; transform:rotate(-90deg) translateX(${(el.scaleY - chartScale) / 2}px);">hours</div>
                  <svg viewbox="0 0 ${el.scaleX} ${el.scaleY + chartScale}" width="${el.scaleX}" height="${el.scaleY + chartScale}" style="border:2px solid var(--text, #000);">
                  ${el.hor}
                  <path d="${el.path}" fill="none" stroke="var(--a, #000)" stroke-width="2px"/>
                  ${el.dots}
                  ${el.numbers}
              </svg>
              <div style="width:${el.scaleX}px; text-align:center; font-size:12px; line-height: 1.1; margin-left:${el.scaleY / chartScale}px;">weeks</div>
              </div>
          </div>
          `
        body += el.svg
    }
    return body
}

export { createGraph as default };
