function parser(text) {
  const blocks = text.split(/\n\n/g);
  let parsedText = "";
  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i];
    const codeRegex = new RegExp("^```\n(.+)\n```", "sgim");
    const codeTest = codeRegex.test(el);

    if (!codeTest) {
      let tempText = el
        .replace(/^(#) (.*$)/gim, function (char, item, item2) {
          return parseTitles(item, item2);
        }) // h1 tag
        .replace(/^(##) (.*$)/gim, function (char, item, item2) {
          return parseTitles(item, item2);
        }) // h2 tag
        .replace(/^(###) (.*$)/gim, function (char, item, item2) {
          return parseTitles(item, item2);
        }) // h3 tag
        .replace(/^(####) (.*$)/gim, function (char, item, item2) {
          return parseTitles(item, item2);
        }) // h4 tag
        .replace(/^(#####) (.*$)/gim, function (char, item, item2) {
          return parseTitles(item, item2);
        }) // h5 tag
        .replace(/^(######) (.*$)/gim, function (char, item, item2) {
          return parseTitles(item, item2);
        }) // h6 tag
        .replace(/\`(.*?)\`/gim, function (char, item) {
          if (item.includes("<")) {
            return `<code>${item.replace(/</g, "<span><</span>")}</code>`;
          } else {
            return `<code>${item}</code>`;
          }
        }) // strong text
        .replace(/^----$/gim, "<hr>") // hr tag
        .replace(
          /(^|\(|\s)_(.*?)_(\s|\.|\,|\?|\!|\n|\)|\b)/gim,
          "$1<em>$2</em>$3"
        ) // em text
        .replace(/\*(.*?)\*/gim, "<strong>$1</strong>") // strong text
        .replace(/\~(.*?)\~/gim, "<del>$1</del>") // strike text
        .replace(/^- (.*$)/gim, "<ul><li>$1</li></ul>\n\n") // strike text
        .replace(/^\+ (.*$)/gim, "<ol><li>$1</li></ol>\n\n") // strike text
        .replace(/^\? (.*) : (.*$)/gim, "<dl><dt>$1</dt><dd>$2</dd></dl>\n\n") // strike text
        .replace(/^\{(.*?)\}/gim, "<aside><p>Side note</p>$1</aside>")
        .replace(/\(link:(.*?)\)/gim, function (char, item) {
          return parseLinks(item);
        }) // links
        .replace(/\(image:(.*?)\)/gim, function (char, item) {
          return parseImage(item);
        }) // image
        .replace(/\(video:(.*?)\)/gim, function (char, item) {
          return parseVideo(item);
        }) // links
        .replace(/\(audio:(.*?)\)/gim, function (char, item) {
          return parseAudio(item);
        }) // links
        .replace(/\(quote:(.*)\)/gim, function (char, item) {
          return parseQuote(item);
        })
        .replace(/\(details:(.*)\)/gims, function (char, item) {
          return parseSummary(item);
        })
        .replace(/^\[(.)\](.*)$/gm, function (char, item, item2) {
          return parseTodo(item, item2);
        });

      const htmlRegex = new RegExp("^<(.*)>", "gim");
      const htmlTest = htmlRegex.test(tempText);

      if (!htmlTest) {
        tempText = `<p>${tempText.trim()}</p>\n\n`;
      }

      if (tempText) {
        parsedText += tempText;
      }
    } else if (codeTest) {
      const splitCode = el.trim().split("\n");
      splitCode.shift();
      splitCode.pop();
      const cleanedCode = [];
      splitCode.forEach((el) => {
        if (el.includes("<")) {
          cleanedCode.push(el.replace(/</g, "<span><</span>"));
        } else {
          cleanedCode.push(el);
        }
      });
      const tempText = `<pre><code>${cleanedCode.join(
        "\n"
      )}\n</code></pre>\n\n`;
      if (tempText) {
        parsedText += tempText;
      }
    }
  }

  const cleanedText = parsedText
    .replace(/<\/ul>\n<ul>/g, "")
    .replace(/<\/ul>\n\n\n<ul>/g, "")
    .replace(/<\/ol>\n\n\n<ol>/g, "")
    .replace(/<\/dl>\n\n\n<dl>/g, "")
    .replace(/<p>[\s\S\n]<\/p>/gim, "")
    .replace(/<p><\/p>/g, "")
    .replace(/<\/li><li>/g, "</li>\n<li>")
    .replace(/<em><\/em>/g, "__")
    .replace(/<strong><\/strong>/g, "**")
    .replace(/<del><\/del>/g, "~~");

  return cleanedText;
}

function parseTitles(character, titleContent) {
  const lvl = character.length;
  const titleId = toKebab(titleContent).trim();
  const html = `<h${lvl} id="${titleId}" >${titleContent.trim()}<a href="#${titleId}" aria-label="${titleContent.trim()} permalink" style="color:currentColor;opacity:0.4;font-size: 0.4em;margin-left: 1ch; text-decoration:none;" title="Link to this title">&#35;</a></h${lvl}>\n\n`;
  return html;
}

function parseLinks(linkContent) {
  const linkData = /^(.+?(?=text:|title:|label:|$))/.exec(linkContent);
  const textData = /text:(.+?(?=title:|label:|$))/.exec(linkContent);
  const titleData = /title:(.+?(?=text:|label:|$))/.exec(linkContent);
  const labelData = /label:(.+?(?=text:|title:|$))/.exec(linkContent);
  const link = linkData ? `href="${linkData[1].trim()}"` : "";
  const text = textData ? textData[1].trim() : linkData[1].trim();
  const title = titleData ? ` title="${titleData[1].trim()}"` : "";
  const label = labelData ? ` aria-label="${labelData[1].trim()}"` : "";
  const html = `<a ${link}${title}${label}>${text}</a>`;
  return html;
}

function parseImage(imgContent) {
  const linkData =
    /^.+?(?=figcaption|(.jpg)|(.jpeg)|(.png)|alt:|figcaption|$)/.exec(
      imgContent
    );
  const altData = /alt:(.+?(?=figcaption|$))/.exec(imgContent);
  const figcaptionData = /figcaption:(.+?(?=alt:|$))/.exec(imgContent);
  const link = linkData ? linkData[0].trim() : "";
  const extension =
    linkData[1] || linkData[2] || linkData[3]
      ? linkData[1] || linkData[2] || linkData[3]
      : "";
  const alt = altData ? `alt="${altData[1].trim()}"` : "";
  const figcaption = figcaptionData
    ? `<figcaption>${figcaptionData[1].trim()} | <small><a href="${link}${extension}">Full size</a></small></figcaption>`
    : `<figcaption><small><a href="${link}${extension}">Full size</a></small></figcaption>`;

  // Uncomment this for picture + srcset
  // const html = `${figcaption ? "<figure>" : ""
  //   }<picture><source type="image/webp" srcset="${link}-400.webp 660w, ${link}-700.webp 1440w" sizes="(max-width: 630px) 400px, 700px" /><img loading="lazy" ${alt ? ` ${alt}` : ""
  //   } srcset="${link}-400${extension} 660w, ${link}-700${extension} 1440w" src="${link}${extension}" sizes="(max-width: 630px) 400px, 700px"></picture>${figcaption} ${figcaption ? "</figure>" : ""
  //   }`;
  // return html;

  if (figcaption) {
    const html = `<figure><img loading="lazy" src="${link}${extension}" ${alt}>${figcaption}</figure>`
    return html
  } else {
    const html = `<img loading="lazy" src="${link}${extension}" ${alt}>`
    return html
  }
}

function parseVideo(videoContent) {
  const videoData = /^(.+?(?=autoplay|figcaption|$))/.exec(videoContent);
  const autoplayData = / autoplay/.exec(videoContent);
  const figcaptionData = /figcaption:(.+?(?=autoplay|$))/.exec(videoContent);
  const link = videoData ? `src="${videoData[1].trim()}"` : "";
  const controls = autoplayData
    ? "autoplay playsinline loop mute"
    : "controls playsinline";
  const format = /\.mp4|\.webm|\.mov/.exec(link);
  const source = `type="video/${format.toString().slice(1)}"`;
  const figcaption = figcaptionData
    ? `<figcaption>${figcaptionData[1].trim()}</figcaption>`
    : "";
  const html = `${figcaptionData ? "<figure>" : ""
    }<video ${controls} preload="metadata" ${link} ${source}></video>${figcaption}${figcaptionData ? "</figure>" : ""
    }`;
  return html;
}

function parseAudio(audioContent) {
  const audioData = /^(.+?(?=figcaption|$))/.exec(audioContent);
  const figcaptionData = /figcaption:(.+?(?=autoplay|$))/.exec(audioContent);
  const link = audioData ? `src="${audioData[1].trim()}"` : "";
  const figcaption = figcaptionData
    ? `<figcaption>${figcaptionData[1].trim()}</figcaption>`
    : "";
  const html = `${figcaptionData ? "<figure>" : ""
    }<audio controls ${link} type="audio/mpeg" preload="metadata"></audio>${figcaption}${figcaptionData ? "</figure>" : ""
    }`;
  return html;
}

function parseQuote(quoteContent) {
  const quoteData = /^(.+?(?=author|source|link|$))/.exec(quoteContent);
  const authorData = /author:(.+?(?=source|link|$))/.exec(quoteContent);
  const sourceData = /source:(.+?(?=author|link|$))/.exec(quoteContent);
  const linkData = /link:(.+?(?=author|source|$))/.exec(quoteContent);
  const quote = quoteData ? quoteData[1].trim() : false;
  const author = authorData ? authorData[1].trim() : false;
  const source = sourceData ? sourceData[1].trim() : false;
  const link = linkData ? linkData[1].trim() : false;
  const cite = link ? `cite="${link}"` : "";

  let figcaption = "";
  if (author && !source && !link) {
    figcaption = `<figcaption>— ${author}</figcaption>`;
  } else if (author && source && !link) {
    figcaption = `<figcaption>— ${author}, ${source}</figcaption>`;
  } else if (author && source && link) {
    figcaption = `<figcaption>— ${author}, <a href="${link}">${source}</a></figcaption>`;
  } else if (!author && source && link) {
    figcaption = `<figcaption><a href="${link}">${source}</a></figcaption>`;
  } else if (!author && !source && link) {
    figcaption = `<figcaption><a href="${link}">${link}</a></figcaption>`;
  } else if (!author && source && !link) {
    figcaption = `<figcaption>${source}</figcaption>`;
  }

  const html = `<figure><blockquote ${cite}>${quote}</blockquote>${figcaption}</figure>`;
  return html;
}

function parseTodo(state, text) {
  let stateText;
  switch (state) {
    case " ":
      stateText = "Opened task";
      break;
    case "@":
      stateText = "Ongoing task";
      break;
    case "~":
      stateText = "Paused or abandonned task";
      break;
    case "x":
      stateText = "Completed task";
      break;
  }

  let string = `<ul><li><code aria-hidden="true">[${state}]</code><span class="visually-hidden">${stateText}</span> ${text}</li></ul>`;
  return string;
}

function parseSummary(text) {
  const detailsData = /^(.+?(?=summary|$))/.exec(text);
  const summaryData = /summary:(.+?(?=$))/.exec(text);
  let string = `<details><summary>${summaryData[1].trim()}</summary>${detailsData[1]}</details>`
  return string
}

function toKebab(text) {
  const toKebabCase =
    text &&
    text
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
      )
      .map((x) => x.toLowerCase())
      .join("-");
  return toKebabCase;
}
export { parser as default };
