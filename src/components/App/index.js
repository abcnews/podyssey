const { h, Component } = require('preact');
const Portal = require('preact-portal');
const screenfull = require('screenfull');
const xhr = require('xhr');
const { getMetaContent, select } = require('../../dom');
const { detailPageURLFromCMID, getNotes, normalise } = require('../../utils');
const Modal = require('../Modal');
const Player = require('../Player');
const styles = require('./styles.css');

const NEWLINES_PATTERN = /[\n\r]/g;
const SHOULD_APPEAR_FULLSCREEN = typeof window.orientation === 'number' && screenfull.enabled;

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
    if (SHOULD_APPEAR_FULLSCREEN) {
      screenfull.request();
    }

    this.setState({ isOpen: true });

    if (this.state.playerProps === null) {
      this.fetchPlayerProps();
    }
  }

  close() {
    this.setState({ isOpen: false });

    if (SHOULD_APPEAR_FULLSCREEN) {
      screenfull.exit();
    }
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

      const doc = new DOMParser().parseFromString(body, 'text/html');

      const playerProps = {
        cover: getMetaContent('og:image', doc),
        notes: getNotes(doc),
        title: getMetaContent('title', doc)
      };

      if (body.indexOf('inlineAudioData') > -1) {
        // Phase 1 (Standard)
        const { url, contentType } = JSON.parse(
          body
            .replace(NEWLINES_PATTERN, '')
            .match(/inlineAudioData\.push\((\[.*\])\)/)[1]
            .replace(/'/g, '"')
        )[0];

        playerProps.audioData = { url, contentType };
      } else if (body.indexOf('WCMS.pluginCache') > -1) {
        // Phase 2
        const { url, contentType } = JSON.parse(
          body.replace(NEWLINES_PATTERN, '').match(/"sources":(\[.*\]),"defaultTracking"/)[1]
        )[0];

        playerProps.audioData = { url, contentType };
      }

      this.setState({ playerProps });
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
