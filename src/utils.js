import acto from '@abcnews/alternating-case-to-object';
import { fetchOne } from '@abcnews/terminus-fetch';
import Custom from './components/Custom';
import ImageViewer from './components/ImageViewer';
import { detach, selectAll } from './dom';

const TIMESTAMP_PATTERN = /^\d*h?\d*m?\d*s?/;
const TIMESTAMP_SEGMENT_PATTERN = /(\d+)(h|m|s)/g;
const TIMESTAMP_UNIT_VALUES = {
  h: 3600,
  m: 60,
  s: 1
};
const XFADE_PATTERN = /Xfade/;

const timestampToTime = timestamp => {
  let time = 0;

  timestamp.replace(TIMESTAMP_SEGMENT_PATTERN, (_match, value, unit) => {
    time += value * TIMESTAMP_UNIT_VALUES[unit];
  });

  return time;
};

export const parseSectionsAndEntries = (transcript, mediaEmbedded) => {
  const sections = [];
  const entries = {};
  let time = null;

  transcript.forEach((node, nodeIndex) => {
    const { tagname, children, parameters } = node;
    const textContent = children.length ? children[0].content : null;

    if (!textContent || textContent.trim().length === 0) {
      // Skip nodes that have child elements rather than a text node, or an empty text node
    } else if (
      tagname.indexOf('h') === 0 &&
      textContent.match(TIMESTAMP_PATTERN).toString().length > 0
    ) {
      // Headings matching the timestamp pattern create new entries (and potentially sections)
      time = timestampToTime(textContent);

      // Add optional crossfade on sections
      let crossfade = false;
      let matchedFade = textContent.match(XFADE_PATTERN);
      if (matchedFade && matchedFade.toString().length > 0) crossfade = true;

      if (!entries[time]) {
        if (tagname === 'h1' || sections.length === 0) {
          // Create the next section
          sections.push({
            time,
            title:
              textContent.replace(TIMESTAMP_PATTERN, '').replace(XFADE_PATTERN, '').trim() || null
          });
        }

        // Create the next entry
        entries[time] = {
          media: null,
          caption: null,
          notes: [],
          emit: null,
          sectionIndex: sections.length ? sections.length - 1 : null,
          crossfade: crossfade
        };
      }
    } else if (time === null) {
      // Skip anything that occurs before the first entry exists
    } else if (tagname === 'p' && textContent.indexOf('#') === 0) {
      // Skip markers unless we have a purpose for them
      const mountValue = textContent.slice(1);

      if (mountValue.indexOf('custom') === 0) {
        entries[time].notes.push({
          component: Custom,
          props: { id: mountValue.slice(6) }
        });
      } else if (mountValue.indexOf('emit') === 0) {
        entries[time].emit = parseConfig(mountValue);
      }
    } else if (tagname === 'a' && typeof parameters === 'object' && parameters.align === 'embed') {
      const embed = mediaEmbedded.find(embed => embed.id === parameters.ref);

      if (!embed) {
        return;
      }

      let animation;

      if (nodeIndex > 0) {
        const { tagname: previousNodeTagname, children: previousNodeChildren } =
          transcript[nodeIndex - 1];
        const previousNodeTextContent = previousNodeChildren.length
          ? previousNodeChildren[0].content
          : null;

        if (
          previousNodeTagname === 'p' &&
          previousNodeTextContent &&
          previousNodeTextContent.indexOf('#animation') === 0
        ) {
          animation = acto(previousNodeTextContent.slice(10));
        }
      }

      // Set the current entry's media (and source)
      entries[time].media = {
        component: ImageViewer,
        props: {
          image: {
            src: embed.media.image.primary.images['16x9'],
            alt: embed.alt
          },
          animation
        }
      };
      entries[time].caption = {
        text: embed.caption,
        attribution: embed.byline ? embed.byline.plain : null
      };
    }
  });

  return {
    sections,
    entries
  };
};

export const fetchAudioDocument = () => {
  const embedEl = selectAll('[data-component="Figure"]').find(
    el => el._descriptor && el._descriptor.key === 'Audio'
  );

  if (!embedEl) {
    return Promise.reject(new Error('No audio embed found'));
  }

  detach(embedEl);

  return fetchOne({ id: embedEl._descriptor.props.document.id, type: 'audio' });
};
