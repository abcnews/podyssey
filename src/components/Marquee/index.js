const { h, Component } = require('preact');
const styles = require('./styles.css');

module.exports = ({ text }) => (
  <div className={styles.root}>
    <div className={styles.track} style={{ animationDuration: `${Math.max(5, text.length * 0.125 + 0.25)}s` }}>
      <span className={styles.text}>{text}</span>
      <span className={styles.text} role="presentation">
        {text}
      </span>
    </div>
  </div>
);

module.exports.displayName = 'Marquee';
