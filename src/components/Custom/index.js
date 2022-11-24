import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

const Custom = ({ id }) => {
  const el = useRef();

  useEffect(() => {
    if (el.current !== null) {
      window.dispatchEvent(new CustomEvent('podyssey:custom', { detail: { el: el.current, id } }));
    }
  }, [el.current]);

  return <div ref={el}></div>;
};

export default Custom;
