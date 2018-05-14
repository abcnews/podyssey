const cn = require('classnames');
const { h, Component } = require('preact');
const Caption = require('../Caption');
const Image = require('../Image');
const styles = require('./styles.css');

class ImageEmbed extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render({ image, caption }, {}) {
    return (
      <figure className={cn(styles.root)}>
        <Image key={image.url} url={image.url} alt={image.alt} />
        <Caption text={caption.text || image.alt} attribution={caption.attribution} />
      </figure>
    );
  }
}

module.exports = ImageEmbed;

module.exports.inferProps = el => ({
  image: Image.inferProps(el),
  caption: Caption.inferProps(el)
});
