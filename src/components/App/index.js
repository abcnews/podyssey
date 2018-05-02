const { h, Component } = require('preact');
const Portal = require('preact-portal');
const xhr = require('xhr');
const { detailPageURLFromCMID, normalise, parsePlayerProps } = require('../../utils');
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
      isDismissed: false,
      isOpen: false,
      playerProps: null
    };
  }

  getBottomRef(el) {
    this.bottomEl = el;
  }

  open() {
    this.setState({ isOpen: true });

    if (this.state.playerProps === null) {
      this.fetchPlayerProps();
    }
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

  fetchPlayerProps() {
    xhr({ url: detailPageURLFromCMID(this.props.audioCMID) }, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        console.error(error || new Error(response.statusCode));

        return this.close();
      }

      this.setState({ playerProps: parsePlayerProps(body) });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    document.documentElement.classList[this.state.isOpen ? 'add' : 'remove'](styles.hasOpen);
    this.base.parentElement.classList[this.state.isDismissed ? 'add' : 'remove'](styles.hasDismissed);
  }

  render({ audioCMID }, { isDismissed, isOpen, playerProps }) {
    return (
      <div className={styles.root}>
        <button className={styles.open} onClick={this.open}>
          {playerProps ? 'Resume' : 'Get started'}
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
            {isOpen && (
              <Modal>
                {playerProps && <Player key="player" audioCMID={audioCMID} close={this.close} {...playerProps} />}
              </Modal>
            )}
          </div>
        </Portal>
      </div>
    );
  }
}

module.exports = App;
