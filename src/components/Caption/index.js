import { h } from 'preact';
import styles from './styles.css';

const Caption = ({ text, attribution }) => (
  <figcaption className={styles.root}>
    {text && <span>{text}</span>}
    {attribution && <em className={styles.attribution}>{attribution}</em>}
  </figcaption>
);

export default Caption;

export const displayName = 'Caption';
