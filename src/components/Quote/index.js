const cn = require('classnames');
const { h, Component } = require('preact');
const { linebreaksToParagraphs } = require('../../cm');
const { MOCK_NODE, append, clone, select, selectAll } = require('../../dom');
const Raw = require('../Raw');
const styles = require('./styles.css');

const Quote = ({ isPullquote = false, paragraphsHTML = [], attributionHTML = null }) => {
  return (
    <blockquote className={cn(styles.root, { [styles.isPullquote]: isPullquote })}>
      {paragraphsHTML.concat(attributionHTML ? [attributionHTML] : []).map(html => html && <Raw html={html} />)}
    </blockquote>
  );
};

module.exports = Quote;

module.exports.inferProps = el => {
  const clonedEl = clone(el, { areLinksCitations: true });
  let isPullquote = true;
  let parEls = selectAll('p', clonedEl);
  let attributionElSelector = 'footer';

  if (clonedEl.tagName === 'BLOCKQUOTE') {
    // P1S-B, P1M-B, P2-B, P1S-P, P1M-P
    if (clonedEl.className.indexOf('source-blockquote') > -1) {
      // P2-B
      isPullquote = false;
    } else {
      // P1S-B, P1M-B, P1S-P, P1M-P
      isPullquote = clonedEl.className.indexOf('quote--pullquote') > -1;
      parEls = selectAll('p:not([class])', clonedEl);
      attributionElSelector = '.p--pullquote-byline';
    }
  } else if (clonedEl.tagName === 'ASIDE') {
    // P2-P
  } else if (clonedEl.tagName === 'FIGURE') {
    // P1M-E
    parEls = Array.from(linebreaksToParagraphs(select('blockquote', clonedEl) || MOCK_NODE).childNodes);
    attributionElSelector = 'figcaption';
  } else if (
    clonedEl.className.indexOf('inline-content quote') > -1 ||
    clonedEl.className.indexOf('view-inline-pullquote') > -1
  ) {
    // P1S-E, P2-E
    attributionElSelector = '.cite';
  }

  const attributionEl = select(attributionElSelector, clonedEl);

  return {
    isPullquote,
    paragraphsHTML: parEls.map(el => el.outerHTML),
    attributionHTML: attributionEl ? `<footer>${attributionEl.innerHTML}</footer>` : null
  };
};
