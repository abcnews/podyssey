import { h, Component } from 'preact';
import Loader from '../Loader';
import styles from './styles.css';

const DIMENSIONS =
  window.ABC && ABC.News && ABC.News.bandwidth && ABC.News.bandwidth.isSlowConnection
    ? '940x529'
    : '2150x1210';
const P1_RATIO_AND_DIMENSIONS_PATTERN = /(\d+x\d+)-(\d+x\d+)/;
const P2_RATIO_AND_DIMENSIONS_PATTERN = /(\d+x\d+)-([a-z]+)/;

const preloaded = {};

export function load(src, done) {
  if (preloaded[src]) {
    return done && done();
  }

  const loader = new window.Image();

  loader.onload = () => {
    if (!preloaded[src]) {
      preloaded[src] = loader;
    }

    done && done();
  };

  loader.src = src;
}

class Image extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoaded: !!preloaded[props.src]
    };
  }

  componentDidMount() {
    if (this.state.isLoaded) {
      return;
    }

    load(this.props.src, () => {
      this.setState({ isLoaded: true });
    });
  }

  render({ id, src, alt = '' }, { isLoaded }) {
    return (
      <div id={id} className={styles.root}>
        <Loader inverted large overlay />
        <img key={src} src={src} alt={alt} loaded={isLoaded ? '' : null} />
      </div>
    );
  }
}

export default Image;

export function preload(props) {
  return load(props.src);
}
