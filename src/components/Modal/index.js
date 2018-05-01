const { h, Component } = require('preact');
const Loader = require('../Loader');
const styles = require('./styles.css');

module.exports = ({ children }) => (
  <div className={styles.root}>
    <Loader className={styles.loader} large overlay />
    {children}
  </div>
);

module.exports.displayName = 'Modal';
