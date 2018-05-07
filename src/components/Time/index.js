const { h, Component } = require('preact');
const styles = require('./styles.css');

const pad = digit => `${digit < 10 ? '0' : ''}${digit}`;

module.exports = ({ numSeconds = 0 }) => {
  const prefix = numSeconds < 0 ? '-' : '';
  const abs = Math.abs(numSeconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = Math.floor(abs) % 60;
  const formatted =
    hours > 0 ? `${prefix}${hours}:${pad(minutes)}:${pad(seconds)}` : `${prefix}${minutes}:${pad(seconds)}`;

  return <span className={styles.root}>{formatted}</span>;
};

module.exports.displayName = 'Time';
