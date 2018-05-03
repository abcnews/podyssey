const { h, Component } = require('preact');
const Portal = require('preact-portal');
const Modal = require('../Modal');
const Player = require('../Player');
const styles = require('./styles.css');

class App extends Component {
  constructor(props) {
    super(props);

    this.getBottomRef = this.getBottomRef.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.dismiss = this.dismiss.bind(this);

    this.state = {
      hasOpenedAtLeastOnce: false,
      isDismissed: false,
      isOpen: false
    };
  }

  getBottomRef(el) {
    this.bottomEl = el;
  }

  open() {
    this.setState({ hasOpenedAtLeastOnce: true, isOpen: true });
  }

  close() {
    this.setState({ isOpen: false });
  }

  dismiss() {
    this.setState({ isDismissed: true });
    setTimeout(() => {
      this.bottomEl.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }, 500);
  }

  componentDidUpdate(prevProps, prevState) {
    document.documentElement.classList[this.state.isOpen ? 'add' : 'remove'](styles.hasOpen);
    this.base.parentElement.classList[this.state.isDismissed ? 'add' : 'remove'](styles.hasDismissed);
  }

  render({ playerProps }, { hasOpenedAtLeastOnce, isDismissed, isOpen }) {
    return (
      <div className={styles.root}>
        <button className={styles.open} onClick={this.open}>
          {hasOpenedAtLeastOnce ? 'Resume' : 'Get started'}
          <span className={styles.icon}>🎧</span>
        </button>
        <div className={styles.dismissChoice}>
          {'or'}
          <button className={styles.dismiss} onClick={this.dismiss}>
            read the story without audio
          </button>
        </div>
        <div ref={this.getBottomRef} className={styles.bottom} />
        <Portal into={'body'}>
          <div className={styles.portal}>
            {isOpen && <Modal close={this.close}>{playerProps && <Player key="player" {...playerProps} />}</Modal>}
          </div>
        </Portal>
      </div>
    );
  }
}

module.exports = App;
