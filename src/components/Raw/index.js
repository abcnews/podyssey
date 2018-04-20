const { h, Component } = require('preact');
const Markup = require('preact-markup');
const { clone } = require('../../dom');
const styles = require('./styles.css');

module.exports = ({ html, tagName }) => <Markup className={styles.root} markup={html} {...{ [tagName]: '' }} />;

module.exports.inferProps = el => ({
  html: clone(el).outerHTML,
  tagName: el.tagName.toLowerCase()
});
