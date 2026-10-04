// Give overflowing code, tables and display math keyboard access in static HTML, too.
export default function scrollRegions() {
  return tree => {
    function visit(node) {
      if (node.type === 'element') {
        const classes = node.properties?.className || [];
        if (node.tagName === 'pre' || node.tagName === 'table' || classes.includes('katex-display')) {
          node.properties ||= {};
          node.properties.tabIndex = 0;
          if (node.tagName !== 'table') {
            node.properties.role = 'group';
            node.properties.ariaLabel = node.tagName === 'pre' ? 'Code example' : 'Equation';
          }
        }
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
