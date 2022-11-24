const isDocument = node => node && node.nodeType === Node.DOCUMENT_NODE;

const isElement = node => node && node.nodeType === Node.ELEMENT_NODE;

export const select = (selector, root) =>
  (isElement(root) || isDocument(root) ? root : document).querySelector(selector);

export const selectAll = (selector, roots) => {
  roots = Array.isArray(roots) ? roots : [roots];
  roots = isElement(roots[0]) ? roots : [document];

  return Array.from(
    new Set(
      roots.reduce((acc, root) => {
        if ('querySelectorAll' in root) {
          const results = root.querySelectorAll(selector);

          return acc.concat([...results]);
        }

        return acc;
      }, [])
    )
  );
};

export const detach = (node = {}) => (
  node != null && node.parentNode && node.parentNode.removeChild(node), node
);
