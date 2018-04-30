const ImageEmbed = require('./components/ImageEmbed');
const Quote = require('./components/Quote');
const Raw = require('./components/Raw');
const { append, before, detach, getMetaContent, prepend, select, selectAll } = require('./dom');

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

const getNotesNodes = () => {
  let transcriptEl;
  let startMarkerEl;
  let nodes = [];

  if ((startMarkerEl = select('a[name="notes"]'))) {
    // Strategy 1: Bookend notes with markers (end is optional)
    const endMarkerEl = select('a[name="endnotes"]');
    let node = startMarkerEl;

    while (((node = node.nextSibling), node && node !== endMarkerEl)) {
      nodes.push(node);
    }
  } else if ((transcriptEl = select('.media-transcript, .view-transcript .comp-rich-text'))) {
    // Strategy 2a: Get Phase 1 (standard) or Phase 2 transcript nodes
    nodes = [...transcriptEl.children];
  } else if ((transcriptEl = select('.transcript.richtext'))) {
    // Strategy 2b: Get Phase 1 (mobile) transcript nodes
    // (the expandable widget may have been initialised first)
    nodes =
      transcriptEl.className.indexOf('expandable') > -1
        ? [...select('.contents', transcriptEl).children].slice(0, -1)
        : [...transcriptEl.children].slice(1);
  }

  return nodes;
};

const getNotes = () => {
  let time = 0;
  let notes = { 0: [] };

  getNotesNodes().forEach(node => {
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

// Phase 1 (standard) : window.inlineAudioData[] → {url, contentType}
// Phase 1 (mobile) : <article|figure class="type-audio"> → <audio> → <source src type>
// Phase 2 : <div class="view-download-link"> → <a href> [or] <a href data-duration>

module.exports.parse = () => {
  const audio = window.inlineAudioData
    ? window.inlineAudioData[0][0]
    : select('.type-audio source, .view-download-link > a, a[data-duration]');
  const audioData = audio
    ? {
        url: audio.src || audio.url || audio.href,
        mimeType: audio.type || audio.contentType || 'audio/mp3'
      }
    : null;

  return {
    title: document.title.split(' - ')[0],
    cover: getMetaContent('og:image'),
    audioData,
    notes: getNotes()
  };
};
