const { h, Component } = require('preact');
const Markup = require('preact-markup');
const styles = require('./styles.css');

module.exports = ({ html }) => <Markup className={styles.root} markup={html} />;

module.exports.inferProps = el => {
  const clone = el.cloneNode(true);

  Array.from(clone.querySelectorAll('a[href]')).forEach(linkEl => {
    linkEl.target === '_blank';
  });

  return {
    html: clone.outerHTML
  };
};
