export default function* ({ allContent }) {
  for (const node of dfs(allContent[0])) {
    yield {
      layout: "layout.njk",
      date: node.date,
      updated: node.updated,
      url: `/${node.slug}.html`,
      ...node,
    };
  }
}

function* dfs(node) {
  yield node
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      yield* dfs(child);
    }
  }
}
