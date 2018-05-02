const { h, Component } = require('preact');
const Loader = require('../Loader');
const styles = require('./styles.css');

class Modal extends Component {
  constructor(props) {
    super(props);
  }

  render({ children }) {
    return (
      <div className={styles.root}>
        <Loader className={styles.loader} large overlay />
        {children}
      </div>
    );
  }
}

module.exports = Modal;
