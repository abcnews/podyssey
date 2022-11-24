import cn from 'classnames';
import { h } from 'preact';
import styles from './styles.css';

const TYPE_PATHS = {
  audio: [
    'M4.16 14.24h2.88v11.52H4.16V14.24zm5.76-7.2h2.88v25.92H9.92V7.04zm5.76 5.76h2.88v14.4h-2.88V12.8zM27.2 9.92h2.88v20.16H27.2V9.92zm5.76 4.32h2.88v11.52h-2.88V14.24zM21.44 2.72h2.88v34.56h-2.88V2.72z'
  ],
  close: [
    'M12.5 13.75l1.25-1.25L20 18.75l6.25-6.25 1.25 1.25L21.25 20l6.25 6.25-1.25 1.25L20 21.25l-6.25 6.25-1.25-1.25L18.75 20l-6.25-6.25z'
  ],
  next: ['M13.635 35l-2.385-2.5L23.75 20 11.25 7.5 13.635 5 28.75 20.003z'],
  replay: [
    'M20.026 34.825c6.791 0 12.577-5.781 12.577-12.584 0-6.792-5.786-12.445-12.577-12.445v4.112L8.359 8.37l11.667-5.475V7.24c8.056 0 14.948 6.943 14.948 15 0 8.068-6.892 14.863-14.948 14.863-8.057 0-15-6.773-15-14.863h2.267c0 6.826 5.941 12.584 12.733 12.584z'
  ],
  pause: ['M8.333 5H15v30H8.333V5zM25 5h6.667v30H25V5z'],
  play: ['M11 6.667L34.332 20 11 33.335z'],
  prev: ['M26.365 35l2.385-2.5L16.25 20l12.5-12.5L26.365 5 11.25 20.003z']
};

const Icon = ({ type, block, size }) => (
  <svg
    className={cn(
      styles.root,
      {
        [styles.block]: block
      },
      styles[size]
    )}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    data-type={type}
  >
    {TYPE_PATHS[type].map(d => (
      <path d={d} />
    ))}
  </svg>
);

export default Icon;
