const { h, Component } = require('preact');

module.exports = ({ innerHTML }) => <div dangerouslySetInnerHTML={{ __html: innerHTML }} />;

module.exports.inferProps = el => ({
  innerHTML: el.innerHTML
});
