const smartquotes = require('./vendor/smartquotes');

const INLINE_TAG_NAMES = [
  'b',
  'big',
  'br',
  'i',
  'small',
  'tt',
  'abbr',
  'acronym',
  'cite',
  'code',
  'dfn',
  'em',
  'kbd',
  'strong',
  'samp',
  'time',
  'var',
  'a',
  'bdo',
  'img',
  'map',
  'object',
  'q',
  'script',
  'span',
  'sub',
  'sup',
  'button',
  'input',
  'label',
  'select',
  'textarea'
];

const MOCK_NODE = (module.exports.MOCK_NODE = Object.freeze({
  parentNode: null,
  parentElement: null,
  previousSibling: null,
  nextSibling: null,
  childNodes: [],
  firstChild: null,
  lastChild: null,
  textContent: ''
}));

module.exports.MOCK_ELEMENT = Object.freeze(
  Object.assign(
    {
      tagName: 'MOCK-ELEMENT',
      attributes: [],
      name: '',
      className: '',
      classList: [],
      previousElementSibling: null,
      nextElementSibling: null,
      children: [],
      childElementCount: 0,
      firstElementChild: null,
      lastElementChild: null,
      innerHTML: '',
      getAttribute: _ => '',
      hasAttribute: _ => false
    },
    MOCK_NODE
  )
);

module.exports.isDocument = node => node && node.nodeType === Node.DOCUMENT_NODE;

const isElement = (module.exports.isElement = node => node && node.nodeType === Node.ELEMENT_NODE);

module.exports.isInlineElement = node => isElement(node) && INLINE_TAG_NAMES.indexOf(node.tagName.toLowerCase()) > -1;

const isText = (module.exports.isText = node => node && node.nodeType === Node.TEXT_NODE);

const select = (module.exports.select = (selector, root) =>
  (isElement(root) ? root : document).querySelector(selector));

module.exports.selectAll = (selector, roots) => {
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

const detach = (module.exports.detach = (node = {}) => (
  node != null && node.parentNode && node.parentNode.removeChild(node), node
));

module.exports.detachAll = nodes => nodes.map(detach);

module.exports.append = (parent, node) => parent.appendChild(node);

const prepend = (module.exports.prepend = (parent, node) => parent.insertBefore(node, parent.firstChild));

const before = (module.exports.before = (sibling, node) => sibling.parentNode.insertBefore(node, sibling));

const after = (module.exports.before = (sibling, node) => sibling.parentNode.insertBefore(node, sibling.nextSibling));

module.exports.substitute = (node, replacementNode) => (before(node, replacementNode), detach(node));

module.exports.clone = (
  el,
  { areLinksCitations = false, shouldHaveSmartQuotes = true, shouldLinksOpenNewWindow = true } = {}
) => {
  const clonedEl = el.cloneNode(true);

  if (shouldHaveSmartQuotes) {
    smartquotes(clonedEl);
  }

  Array.from(clonedEl.querySelectorAll('a[href]')).forEach(linkEl => {
    if (shouldLinksOpenNewWindow) {
      linkEl.target === '_blank';
    }

    if (areLinksCitations) {
      const citeEl = document.createElement('cite');

      linkEl.parentElement.insertBefore(citeEl, linkEl);
      citeEl.appendChild(linkEl);
    }
  });

  return clonedEl;
};

module.exports.setText = (el, text) => {
  let node = el.firstChild;

  if (node === null || !isText(node)) {
    prepend(el, (node = document.createTextNode(text)));
  } else {
    node.nodeValue = text;
  }
};

const toggleAttribute = (module.exports.toggleAttribute = (node, attribute, shouldBeApplied) =>
  node[`${shouldBeApplied ? 'set' : 'remove'}Attribute`](attribute, ''));

module.exports.toggleBooleanAttributes = (node, map) =>
  Object.keys(map).forEach(name => toggleAttribute(node, name, map[name]));
