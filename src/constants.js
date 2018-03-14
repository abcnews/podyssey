module.exports.MS_VERSION = (ua => {
  const msie = ua.indexOf('MSIE ');

  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(uaUA.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }

  const trident = ua.indexOf('Trident/');

  if (trident > 0) {
    // IE 11 => return version number
    var rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }

  const edge = ua.indexOf('Edge/');

  if (edge > 0) {
    // Edge (IE 12+) => return version number
    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }
})(window.navigator.userAgent);

const MOCK_NODE = (module.exports.MOCK_NODE = {
  parentNode: null,
  parentElement: null,
  previousSibling: null,
  nextSibling: null,
  childNodes: [],
  firstChild: null,
  lastChild: null,
  textContent: ''
});

module.exports.MOCK_ELEMENT = Object.assign(
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
);
