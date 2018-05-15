const cn = require('classnames');
const { h, Component } = require('preact');
const { inferConfig } = require('../../dom');
const Caption = require('../Caption');
const Image = require('../Image');
const imageStyles = require('../Image/styles.css');
const styles = require('./styles.css');

let nextImageId = 0;
const mounted = new Map();

window.addEventListener('resize', () => {
  mounted.forEach((_, component) => component.updateRatio());
});

class ImageEmbed extends Component {
  constructor(props) {
    super(props);

    this.imageId = `${imageStyles.root}_${nextImageId++}`;

    this.state = {};
  }

  updateRatio() {
    const { width, height } = this.base.getBoundingClientRect();

    this.setState({ ratio: width / height });
  }

  componentDidMount() {
    mounted.set(this, true);
    this.updateRatio();
  }

  componentWillUnmount() {
    mounted.delete(this, true);
  }

  render({ image, caption, animation }, { ratio }) {
    return (
      <figure className={cn(styles.root)}>
        <Image key={image.src} id={this.imageId} src={image.src} alt={image.alt} />
        <Caption text={`Photo: ${caption.attribution}`} />
        {animation && ratio && <style>{animationCSS(this.imageId, animation, ratio)}</style>}
      </figure>
    );
  }
}

module.exports = ImageEmbed;

module.exports.inferProps = el => ({
  image: Image.inferProps(el),
  caption: Caption.inferProps(el),
  animation: inferConfig('animation', el)
});

module.exports.preload = props => Image.preload(props.image);

const transformX = (pct, ratio) => {
  const pctX = typeof pct === 'number' ? 50 - Math.min(100, Math.max(0, pct)) : 0;
  const absPctX = Math.abs(pctX);

  return Math.min(absPctX, (1 - ratio) / ratio * 50) * (pctX / absPctX);
};

const animationCSS = (id, { from = 0, to = 100, duration = 0, delay = 0, infinite = false }, ratio = 1) => {
  const name = `${id}_ratio${String(ratio * 100).split('.')[0]}`;

  return `
@keyframes ${name} {
  from {
    transform: translate(${transformX(from, ratio)}%, 0);
  }
  to {
    transform: translate(${transformX(to, ratio)}%, 0);
  }
}

#${id} {
  animation: ${name} ${duration}s ease-in-out ${delay}s ${infinite ? 'infinite alternate' : ''} both;
}
  `;
};
