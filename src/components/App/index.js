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

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.dismiss = this.dismiss.bind(this);

    this.state = {
      isOpen: false,
      playerProps: null
    };
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
    this.base.parentElement.setAttribute('dismissed', '');
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

  componentDidUpdate() {
    if (this.state.isOpen) {
      document.documentElement.classList.add(styles.hasOpen);
    } else {
      document.documentElement.classList.remove(styles.hasOpen);
    }
  }

  render({ audioCMID }, { isOpen, playerProps }) {
    return (
      <div className={styles.root}>
        <button className={styles.open} onClick={this.open}>
          {playerProps ? 'Resume' : 'Get started'}
          <span className={styles.icon}>🎧</span>
        </button>
        <br />
        {'or'}
        <button className={styles.dismiss} onClick={this.dismiss}>
          read the story without audio
        </button>
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
