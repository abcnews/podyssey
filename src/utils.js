const ImageEmbed = require('./components/ImageEmbed');
const Raw = require('./components/Raw');

module.exports.normalise = () => {
  let viewportEl = document.querySelector('meta[name="viewport"]');

  if (!viewportEl) {
    viewportEl = document.createElement('meta');
    viewportEl.setAttribute('name', 'viewport');
  }

  viewportEl.setAttribute('content', 'width=device-width, initial-scale=1');

  if (!viewportEl.parentElement) {
    document.head.appendChild(viewportEl);
  }
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

  const startNode = document.querySelector('a[name="notes"]');
  const endNode = document.querySelector('a[name="endnotes"]');

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
      currentNode.matches('.inline-content.photo, [class*="view-image-embed"]') ||
      currentNode.querySelector('.type-photo')
    ) {
      // Transform image embeds
      notes[time].push({
        component: ImageEmbed,
        props: ImageEmbed.inferProps(currentNode)
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
  const audio = window.inlineAudioData ? window.inlineAudioData[0][0] : document.querySelector('figure audio source');
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
