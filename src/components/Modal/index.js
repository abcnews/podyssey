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
        {close && (
          <button className={styles.close} onClick={close}>
            X
          </button>
        )}
        <Loader className={styles.loader} inverted large overlay />
        {children}
      </div>
    );
  }
}

module.exports = Modal;
