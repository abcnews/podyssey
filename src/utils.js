const url2cmid = require('@abcnews/url2cmid');
const ImageEmbed = require('./components/ImageEmbed');
const Quote = require('./components/Quote');
const Raw = require('./components/Raw');
const { append, before, detach, prepend, select, selectAll } = require('./dom');

const PREVIEW_CTX_SELECTOR = 'span[id^="CTX"]';
const PREVIEW_SCRIPT_PATTERN = /(?:coremedia|joo\.classLoader)/;

module.exports.normalise = rootEl => {
  let viewportEl = select('meta[name="viewport"]');

  if (!viewportEl) {
    viewportEl = document.createElement('meta');
    viewportEl.setAttribute('name', 'viewport');
  }

  viewportEl.setAttribute('content', 'width=device-width, initial-scale=1');

  if (!viewportEl.parentElement) {
    append(document.head, viewportEl);
  }

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

const TIMESTAMP_PATTERN = /\d*h?\d*m?\d*s?/;
const TIMESTAMP_SEGMENT_PATTERN = /(\d+)(\w)/g;
const TIMESTAMP_UNIT_VALUES = {
  h: 3600,
  m: 60,
  s: 1
};

const timestampToTime = timestamp => {
  let time = 0;

  timestamp.replace(TIMESTAMP_SEGMENT_PATTERN, (match, value, unit) => {
    time += value * TIMESTAMP_UNIT_VALUES[unit];
  });

  return time;
};

const getNotesNodes = doc => {
  let transcriptEl;
  let startMarkerEl;
  let nodes = [];

  if ((startMarkerEl = select('a[name="notes"]', doc))) {
    // Strategy 1: Bookend notes with markers (end is optional)
    const endMarkerEl = select('a[name="endnotes"]', doc);
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

module.exports.getNotes = (doc = document) => {
  let time = 0;
  let notes = { 0: [] };

  getNotesNodes(doc).forEach(node => {
    if (
      !node.tagName ||
      (node.tagName === 'P' && node.textContent.trim().length === 0) ||
      (node.tagName === 'A' && node.getAttribute('name').length > 0)
    ) {
      // Skip non-elements, empty paragraphs and #markers
    } else if (
      node.tagName.indexOf('H') === 0 &&
      node.textContent.match(TIMESTAMP_PATTERN).toString() === node.textContent
    ) {
      // Headings matching the timestamp pattern create new entries
      time = timestampToTime(node.textContent);

      if (!notes[time]) {
        notes[time] = [];
      }
    } else if (
      node.matches(`
        .inline-content.photo,
        [class*="view-image-embed"]
      `) ||
      select('.type-photo', node)
    ) {
      // Transform image embeds
      notes[time].push({
        component: ImageEmbed,
        props: ImageEmbed.inferProps(node)
      });
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
      // Transform quotes
      notes[time].push({
        component: Quote,
        props: Quote.inferProps(node)
      });
    } else {
      // Keep everything else, as-is (with links opening in new windows)
      notes[time].push({
        component: Raw,
        props: Raw.inferProps(node)
      });
    }
  });

  return notes;
};

module.exports.detailPageURLFromCMID = cmid =>
  `${(window.location.origin || '').replace('mobile', 'www')}/news/${cmid}?pfm=ms`;

module.exports.convertAudioEmbedToCMID = () => {
  const embedEl = selectAll(
    '.inline-content.audio, .media-wrapper-dl.type-audio, .view-inlineMediaPlayer.doctype-abcaudio'
  ).concat(selectAll('.embed-content').filter(el => select('.type-audio', el)))[0];

  if (!embedEl) {
    return;
  }

  detach(embedEl);

  return selectAll('a', embedEl)
    .filter(x => x.href.indexOf('mpegmedia') < 0)
    .map(x => url2cmid(x.href))[0];
};
