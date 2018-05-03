const { h, Component } = require('preact');
const Loader = require('../Loader');
const styles = require('./styles.css');

class Modal extends Component {
  constructor(props) {
    super(props);
  }

  render({ children, close }) {
    return (
      <div className={styles.root}>
        <Loader className={styles.loader} inverted large overlay />
        {children}
        {close && (
          <button className={styles.close} onClick={close}>
            X
          </button>
        )}
      </div>
    );
  }
}

module.exports = Modal;
