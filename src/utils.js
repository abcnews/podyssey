const url2cmid = require('@abcnews/url2cmid');
const Caption = require('./components/Caption');
const HTMLEmbed = require('./components/HTMLEmbed');
const { resize } = require('./components/Image');
const ImageViewer = require('./components/ImageViewer');
const Quote = require('./components/Quote');
const Raw = require('./components/Raw');
const { append, before, create, detach, getMetaContent, prepend, parseConfig, select, selectAll } = require('./dom');

const META_PROPS = {
  // Android
  'theme-color': 'black',
  'mobile-web-app-capable': 'yes',
  // iOS
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'black',
  // UC Mobile Browser
  'full-screen': 'yes'
};
const NEWLINES_PATTERN = /[\n\r]/g;
const PREVIEW_CTX_SELECTOR = 'span[id^="CTX"]';
const PREVIEW_SCRIPT_PATTERN = /(?:coremedia|joo\.classLoader)/;
const TIMESTAMP_PATTERN = /^\d*h?\d*m?\d*s?/;
const TIMESTAMP_SEGMENT_PATTERN = /(\d+)(\w)/g;
const TIMESTAMP_UNIT_VALUES = {
  h: 3600,
  m: 60,
  s: 1
};

module.exports.normalise = rootEl => {
  const viewportMetaEl = select('meta[name="viewport"]') || create('meta', { name: 'viewport' });

  viewportMetaEl.setAttribute('content', 'width=device-width, initial-scale=1');

  if (!viewportMetaEl.parentElement) {
    append(document.head, viewportMetaEl);
  }

  Object.keys(META_PROPS).forEach(name => append(document.head, create('meta', { name, content: META_PROPS[name] })));

  selectAll(PREVIEW_CTX_SELECTOR).forEach(el => {
    Array.from(el.children).forEach(childEl => {
      if (childEl.tagName === 'SCRIPT' && childEl.textContent.match(PREVIEW_SCRIPT_PATTERN)) {
        detach(childEl);
      } else {
        before(el, childEl);
      }
    });
    detach(el);
  });

  let htmlFragmentEl = rootEl.parentElement;

  before(htmlFragmentEl, rootEl);
  detach(htmlFragmentEl);

  return rootEl;
};

const timestampToTime = timestamp => {
  let time = 0;

  timestamp.replace(TIMESTAMP_SEGMENT_PATTERN, (match, value, unit) => {
    time += value * TIMESTAMP_UNIT_VALUES[unit];
  });

  return time;
};

const getSourceNodes = doc => {
  let transcriptEl;
  let startMarkerEl;
  let nodes = [];

  if ((startMarkerEl = select('a[name="podyssey"]', doc))) {
    // Strategy 1: Bookend nodes with markers (end is optional)
    const endMarkerEl = select('a[name="endpodyssey"]', doc);
    let node = startMarkerEl;

    while (((node = node.nextSibling), node && node !== endMarkerEl)) {
      nodes.push(node);
    }
  } else if ((transcriptEl = select('.media-transcript, .view-transcript .comp-rich-text', doc))) {
    // Strategy 2: Get all transcript child elements
    nodes = [...transcriptEl.children];
  }

  return nodes;
};

const getCover = doc => {
  const url = getMetaContent('og:image', doc);

  if (!url) {
    return null;
  }

  return {
    url: resize(url),
    attribution: getMetaContent('cover:attribution', doc)
  };
};

module.exports.parsePlayerProps = html => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections = [];
  const entries = {};
  let time = null;
  let audio = null;

  if (html.indexOf('inlineAudioData') > -1) {
    // Phase 1 (Standard)
    const { url, contentType } = JSON.parse(
      html
        .replace(NEWLINES_PATTERN, '')
        .match(/inlineAudioData\.push\((\[.*\])\)/)[1]
        .replace(/'/g, '"')
    )[0];

    audio = { url, contentType };
  } else if (html.indexOf('WCMS.pluginCache') > -1) {
    // Phase 2
    const { url, contentType } = JSON.parse(
      html.replace(NEWLINES_PATTERN, '').match(/"sources":(\[.*\]),"defaultTracking"/)[1]
    )[0];

    audio = { url, contentType };
  }

  getSourceNodes(doc).forEach(node => {
    if (!node.tagName || (node.tagName === 'P' && node.textContent.trim().length === 0)) {
      // Skip non-elements, empty paragraphs and #markers
    } else if (node.tagName.indexOf('H') === 0 && node.textContent.match(TIMESTAMP_PATTERN).toString().length > 0) {
      // Headings matching the timestamp pattern create new entries (and potentially sections)
      time = timestampToTime(node.textContent);

      if (!entries[time]) {
        if (node.tagName === 'H2' || sections.length === 0) {
          // Create the next section
          sections.push({ time, title: node.textContent.replace(TIMESTAMP_PATTERN, '').trim() || null });
        }

        // Create the next entry
        entries[time] = {
          media: null,
          caption: null,
          notes: [],
          emit: null,
          sectionIndex: sections.length ? sections.length - 1 : null
        };
      }
    } else if (time === null) {
      // Skip anything that occurs before the first entry exists
    } else if (node.tagName === 'A') {
      // Skip markers unless we have a purpose for them
      const markerName = node.getAttribute('name');

      if (markerName.indexOf('emit') === 0) {
        entries[time].emit = parseConfig(markerName);
      }
    } else if (
      node.matches(`
        .inline-content.photo,
        [class*="view-image-embed"]
      `) ||
      select('.type-photo', node)
    ) {
      // Set the current entry's media (and source)
      entries[time].media = {
        component: ImageViewer,
        props: ImageViewer.inferProps(node)
      };
      entries[time].caption = Caption.inferProps(node);
    } else if (
      node.matches(
        `blockquote:not([class]),
          .quote--pullquote,
          .inline-content.quote,
          .embed-quote,
          .comp-rich-text-blockquote,
          .view-inline-pullquote
        `
      )
    ) {
      // Transform quotes and add them to the entry's notes
      entries[time].notes.push({
        component: Quote,
        props: Quote.inferProps(node)
      });
    } else if (
      node.matches(`
        .inline-content.html-fragment,
        .embed-fragment,
        [class*="view-html-fragment-embedded"]
      `)
    ) {
      // Transform HTML fragments into wrapped innerHTML
      entries[time].notes.push({
        component: HTMLEmbed,
        props: HTMLEmbed.inferProps(node)
      });
    } else {
      // Keep everything else, as-is (with links opening in new windows),
      // and add it to the entry's notes
      entries[time].notes.push({
        component: Raw,
        props: Raw.inferProps(node)
      });
    }
  });

  return {
    title: getMetaContent('title', doc),
    cover: getCover(doc),
    audio,
    sections,
    entries
  };
};

module.exports.detailPageURLFromCMID = cmid =>
  `${(window.location.origin || '').replace('mobile', 'www')}/news/${cmid}?pfm=ms`;

module.exports.getAudioCMID = () => {
  // First, look for the embed using known selectors
  const embedEl = selectAll(
    '.inline-content.audio, .media-wrapper-dl.type-audio, .view-inlineMediaPlayer.doctype-abcaudio'
  ).concat(selectAll('.embed-content').filter(el => select('.type-audio', el)))[0];

  if (embedEl) {
    detach(embedEl);

    return selectAll('a', embedEl)
      .filter(x => x.href.indexOf('mpegmedia') < 0)
      .map(x => url2cmid(x.href))[0];
  }

  // Failing that, check window.dataLayer
  if (Array.isArray(window.dataLayer)) {
    const embedCMURL = window.dataLayer
      .filter(
        x => x.document && x.document.embedded && (Object.keys(x.document.embedded)[0] || '').indexOf('audio') > -1
      )
      .map(x => Object.keys(x.document.embedded)[0])[0];

    if (embedCMURL) {
      return embedCMURL.split('audio/')[1];
    }
  }
};
