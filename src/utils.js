const ImageEmbed = require('./components/ImageEmbed');
const Quote = require('./components/Quote');
const Raw = require('./components/Raw');
const { append, before, detach, select, selectAll } = require('./dom');

const PREVIEW_CTX_SELECTOR = 'span[id^="CTX"]';
const PREVIEW_SCRIPT_PATTERN = /(?:coremedia|joo\.classLoader)/;

module.exports.normalise = () => {
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
    console.log(el);
    Array.from(el.children).forEach(childEl => {
      if (childEl.tagName === 'SCRIPT' && childEl.textContent.match(PREVIEW_SCRIPT_PATTERN)) {
        detach(childEl);
      } else {
        before(el, childEl);
      }
    });
    detach(el);
  });
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

module.exports.getNotes = () => {
  let time = 0;
  let notes = { 0: [] };
  let currentNode;

  const startNode = select('a[name="notes"]');
  const endNode = select('a[name="endnotes"]');

  if (!startNode || !endNode) {
    return notes;
  }

  currentNode = startNode;

  while (((currentNode = currentNode.nextSibling), currentNode && currentNode !== endNode)) {
    if (
      !currentNode.tagName ||
      (currentNode.tagName === 'P' && currentNode.textContent.trim().length === 0) ||
      (currentNode.tagName === 'A' && currentNode.getAttribute('name').length > 0)
    ) {
      // Skip non-elements, empty paragraphs and #markers
    } else if (
      currentNode.tagName.indexOf('H') === 0 &&
      currentNode.textContent.match(TIMESTAMP_PATTERN).toString() === currentNode.textContent
    ) {
      // Headings matching the timestamp pattern create new entries
      time = timestampToTime(currentNode.textContent);

      if (!notes[time]) {
        notes[time] = [];
      }
    } else if (
      currentNode.matches(`
        .inline-content.photo,
        [class*="view-image-embed"]
      `) ||
      select('.type-photo', currentNode)
    ) {
      // Transform image embeds
      notes[time].push({
        component: ImageEmbed,
        props: ImageEmbed.inferProps(currentNode)
      });
    } else if (
      currentNode.matches(
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
        props: Quote.inferProps(currentNode)
      });
    } else {
      // Keep everything else, as-is (with links opening in new windows)
      notes[time].push({
        component: Raw,
        props: Raw.inferProps(currentNode)
      });
    }
  }

  return notes;
};

module.exports.parse = () => {
  const audio = window.inlineAudioData ? window.inlineAudioData[0][0] : select('figure audio source');
  const audioData = audio
    ? {
        url: audio.src || audio.url,
        mimeType: audio.type || audio.contentType
      }
    : null;

  return {
    title: document.title.split(' - ABC')[0],
    audioData
  };
};
