import { h } from 'preact';
import styles from './styles.css';

const pad = digit => `${digit < 10 ? '0' : ''}${digit}`;

const BLANK = '–:––';

const Time = ({ numSeconds = 0, isZeroUnknown = false, ...props }) => {
  let text;

  if (!isZeroUnknown || numSeconds > 0) {
    numSeconds = numSeconds || 0;

    const prefix = numSeconds < 0 ? '-' : '';
    const abs = Math.abs(numSeconds);
    const hours = Math.floor(abs / 3600);
    const minutes = Math.floor((abs % 3600) / 60);
    const seconds = Math.floor(abs) % 60;

    text =
      hours > 0
        ? `${prefix}${hours}:${pad(minutes)}:${pad(seconds)}`
        : `${prefix}${minutes}:${pad(seconds)}`;
  }

  return (
    <span className={styles.root} {...props}>
      {text || BLANK}
    </span>
  );
};

export default Time;

export const displayName = 'Time';
