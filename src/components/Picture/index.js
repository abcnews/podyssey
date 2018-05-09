const { h, Component } = require('preact');
const { MS_VERSION } = require('../../constants');
const Loader = require('../Loader');
const styles = require('./styles.css');

const SMALLEST_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAADs=';
const IS_SIZE_SMALL_TEST = '(max-height: 940px)';
const SIZE_WIDTHS = {
  small: 940,
  large: 1400
};
const P1_RATIO_SIZE_PATTERN = /(\d+x\d+)-(\d+x\d+)/;
const P2_RATIO_SIZE_PATTERN = /(\d+x\d+)-([a-z]+)/;

const preloaded = {};

function load(src, done) {
  const loader = new Image();

  loader.onload = () => {
    preloaded[src] = true;
    done();
  };

  loader.src = src;
}

function resize({ url, size }) {
  return url
    .replace(P2_RATIO_SIZE_PATTERN, '1x1-large')
    .replace(P1_RATIO_SIZE_PATTERN, `1x1-${SIZE_WIDTHS[size]}x${SIZE_WIDTHS[size]}`);
}

class Picture extends Component {
  constructor(props) {
    super(props);

    this.getImageRef = this.getImageRef.bind(this);

    const size = window.matchMedia(IS_SIZE_SMALL_TEST).matches ? 'small' : 'large';
    const src = resize({ url: this.props.url, size });
    const wasPreloaded = preloaded[src];

    this.state = {
      src,
      isLoaded: wasPreloaded,
      wasPreloaded
    };
  }

  getImageRef(el) {
    this.imageEl = el;
  }

  componentDidMount() {
    if (this.state.wasPreloaded) {
      return;
    }

    load(this.state.src, () => {
      this.setState({ isLoaded: true });
      // this.imageEl.src = this.state.src;
    });
  }

  render({ alt = '' }, { src, isLoaded }) {
    return (
      <div className={styles.root}>
        <Loader inverted large overlay />
        <img key={src} ref={this.getImageRef} src={src} alt={alt} loaded={isLoaded} />
      </div>
    );
  }
}

module.exports = Picture;

module.exports.inferProps = el => {
  el = el.matches('img') ? el : el.querySelector('img');

  return {
    url: el.src,
    alt: el.alt
  };
};
