export default function* ({ allContent }) {
  for (const node of dfs(allContent[0])) {
    yield {
      layout: "layout.njk",
      created: node.created,
      date: node.generated,
      url: `/${node.slug}.html`,
      ...node,
    };
  }
}

function* dfs(node) {
  yield node
  if (Array.isArray(node.childPages)) {
    for (const child of node.childPages) {
      yield* dfs(child);
    }
  }
}
