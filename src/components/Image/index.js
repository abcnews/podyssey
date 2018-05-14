const { h, Component } = require('preact');
const { MS_VERSION } = require('../../constants');
const Loader = require('../Loader');
const styles = require('./styles.css');

const SMALLEST_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAADs=';
const IS_SIZE_SMALL_TEST = '(max-height: 940px)';
const SIZE_DIMENSIONS = {
  small: '940x529',
  large: '2150x1210'
};
const P1_RATIO_AND_DIMENSIONS_PATTERN = /(\d+x\d+)-(\d+x\d+)/;
const P2_RATIO_AND_DIMENSIONS_PATTERN = /(\d+x\d+)-([a-z]+)/;

const preloaded = {};

function load(src, done) {
  const loader = new window.Image();

  loader.onload = () => {
    preloaded[src] = true;
    done();
  };

  loader.src = src;
}

function resize({ url, size }) {
  return url
    .replace(P2_RATIO_AND_DIMENSIONS_PATTERN, '16x9-large')
    .replace(P1_RATIO_AND_DIMENSIONS_PATTERN, `16x9-${SIZE_DIMENSIONS[size]}`);
}

class Image extends Component {
  constructor(props) {
    super(props);

    const size = window.matchMedia(IS_SIZE_SMALL_TEST).matches ? 'small' : 'large';
    const src = resize({ url: props.url, size });
    const wasPreloaded = preloaded[src];

    this.state = {
      src,
      isLoaded: wasPreloaded,
      wasPreloaded
    };
  }

  componentDidMount() {
    if (this.state.wasPreloaded) {
      return;
    }

    load(this.state.src, () => {
      this.setState({ isLoaded: true });
    });
  }

  render({ alt = '' }, { src, isLoaded }) {
    return (
      <div className={styles.root}>
        <Loader inverted large overlay />
        <img key={src} src={src} alt={alt} loaded={isLoaded} />
      </div>
    );
  }
}

module.exports = Image;

module.exports.inferProps = el => {
  el = el.matches('img') ? el : el.querySelector('img');

  return {
    url: el.src,
    alt: el.alt
  };
};
