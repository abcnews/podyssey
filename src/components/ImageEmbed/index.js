const { h, Component } = require('preact');
const Caption = require('../Caption');
const Picture = require('../Picture');
const styles = require('./styles.css');

class ImageEmbed extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);

    this.state = { isActive: false };
  }

  toggle() {
    this.setState({ isActive: !this.state.isActive });
  }

  render({ picture, caption }, { isActive }) {
    return (
      <figure className={`${styles.root}${isActive ? ` ${styles.isActive}` : ''}`} onClick={this.toggle}>
        <Picture key={picture.url} url={picture.url} alt={picture.alt} />
        <Caption text={caption.text || picture.alt} attribution={caption.attribution} />
      </figure>
    );
  }
}

module.exports = ImageEmbed;

module.exports.inferProps = el => ({
  picture: Picture.inferProps(el),
  caption: Caption.inferProps(el)
});
