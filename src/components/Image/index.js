const { h, Component } = require('preact');
const { MS_VERSION } = require('../../constants');
const Loader = require('../Loader');
const styles = require('./styles.css');

const SMALLEST_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAADs=';
const DIMENSIONS =
  window.ABC && ABC.News && ABC.News.bandwidth && ABC.News.bandwidth.isSlowConnection ? '940x529' : '2150x1210';
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

function resize(url) {
  return url
    .replace(P2_RATIO_AND_DIMENSIONS_PATTERN, '16x9-large')
    .replace(P1_RATIO_AND_DIMENSIONS_PATTERN, `16x9-${DIMENSIONS}`);
}

class Image extends Component {
  constructor(props) {
    super(props);

    const src = resize(props.url);
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

  render({ id, alt = '' }, { src, isLoaded }) {
    return (
      <div id={id} className={styles.root}>
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
