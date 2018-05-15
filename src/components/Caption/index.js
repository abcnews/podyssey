const { h, Component } = require('preact');
const { MOCK_ELEMENT } = require('../../constants');
const { detach } = require('../../dom');
const styles = require('./styles.css');

module.exports = ({ text, attribution }) => (
  <figcaption className={styles.root}>
    {text && <span>{text}</span>}
    {attribution && <em className={styles.attribution}>{attribution}</em>}
  </figcaption>
);

module.exports.displayName = 'Caption';

const attr = (el, name) => (el || MOCK_ELEMENT).getAttribute(name);
const text = (el, hasParenthesis) =>
  (el || MOCK_ELEMENT).textContent.slice(hasParenthesis ? 1 : 0, hasParenthesis ? -1 : undefined).trim();
const isType = (el, type) => el.className.indexOf(` ${type}`) > -1;

module.exports.inferProps = el => {
  const clone = el.cloneNode(true);
  const $ = clone.querySelector.bind(clone);
  let props = {};

  if (clone.className.indexOf('embedded-external-link') > -1) {
    // P2 (external)
    props.text = [text($('.embed-label')), text($('.embed-caption a span')), text($('.inline-caption span'))].join(' ');
  } else if (isType(clone, 'photo') || isType(clone, 'video') || isType(clone, 'embedded')) {
    // P1S
    props.attribution = text(detach($('.source')), true);
    isType(clone, 'embedded') && detach($('.inline-caption strong'));
    props.text = text($('.inline-caption'));
  } else if ($('.type-photo, .type-video, .type-external')) {
    // P1M
    (!$('.type-external') || clone.textContent.indexOf(':') > -1) && detach($('h3 strong'));
    props.text = text($('h3'));
    props.attribution = text($('.attribution'));
  } else if ($('figcaption')) {
    // P2 (image)
    props = {
      text: text($('figcaption .lightbox-trigger')),
      attribution: text($('figcaption .byline'), true)
    };
  } else if ($('.comp-video-player')) {
    // P2 (video)
    props = {
      text: text($('.comp-video-player ~ .caption a')),
      attribution: text($('.comp-video-player ~ .caption .byline'), true)
    };
  }

  return props;
};
