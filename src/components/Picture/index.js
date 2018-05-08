const { h, Component } = require('preact');
const { MS_VERSION } = require('../../constants');
const styleUtils = require('../../utils.css');
const Loader = require('../Loader');
const styles = require('./styles.css');

const DEFAULT_RATIO = '1x1';
const RATIO_SIZES = {
  '16x9': '2150x1210',
  '3x2': '940x627',
  '4x3': '940x705',
  '1x1': '1400x1400',
  '3x4': '940x1253'
};
const RATIO_PATTERN = /(\d+x\d+)/;
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

function resize({ url, ratio }) {
  return url
    .replace(P2_RATIO_SIZE_PATTERN, '$1-large')
    .replace(RATIO_PATTERN, ratio)
    .replace(P1_RATIO_SIZE_PATTERN, `$1-${RATIO_SIZES[ratio]}`);
}

class Picture extends Component {
  constructor(props) {
    super(props);

    this.getImageRef = this.getImageRef.bind(this);

    const ratio = this.props.ratio || DEFAULT_RATIO;
    const src = resize({ url: this.props.url, ratio });
    const wasPreloaded = preloaded[src];

    this.state = {
      aspectClassName: styleUtils[`aspect${ratio}`],
      src,
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
      this.imageEl.src = this.state.src;
    });
  }

  render({ alt = '' }, { aspectClassName, src, wasPreloaded }) {
    return (
      <div className={styles.root}>
        <div className={aspectClassName} />
        <Loader inverted large overlay />
        <img key={src} ref={this.getImageRef} src={wasPreloaded ? src : null} alt={alt} />
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
