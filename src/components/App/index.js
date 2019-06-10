const { Client } = require('@abcnews/poll-counters-client');
const { h, Component } = require('preact');
const Portal = require('preact-portal');
const { select } = require('../../dom');
const Button = require('../Button');
const { load } = require('../Image');
const Icon = require('../Icon');
const Modal = require('../Modal');
const Player = require('../Player');
const styles = require('./styles.css');

const ARTICLE_SLUG = window.location.pathname.split('/').reverse()[1];
const NO_OP = () => {};
const increment = (id, answer) => new Client(`podyssey-${id}`).increment({ question: ARTICLE_SLUG, answer }, NO_OP);
const logMediaChoice = answer => increment('media-choice', answer);

function setHTMLFlag(name, isOn) {
  document.documentElement[isOn ? 'setAttribute' : 'removeAttribute'](`data-podyssey-${name}`, '');
}

class App extends Component {
  constructor(props) {
    super(props);

    this.getPortalRef = this.getPortalRef.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.dismiss = this.dismiss.bind(this);

    this.alternativeStartEl = select('[name="alternative"]');

    this.state = {
      hasClosedAtLeastOnce: false,
      isDismissed: false,
      isOpen: false,
      transitionData: null
    };
  }

  getPortalRef(ref) {
    // https://github.com/developit/preact-portal/issues/2
    this._portal = ref;
  }

  open() {
    const transitionData = {
      playIconRect: select('svg[data-type="play"]').getBoundingClientRect()
    };

    this.setState({ isDismissed: false, isOpen: true, transitionData });

    logMediaChoice('audio');
  }

  close() {
    this.setState({ hasClosedAtLeastOnce: true, isOpen: false });
  }

  dismiss() {
    this.setState({ isDismissed: true });
    setTimeout(() => {
      this.alternativeStartEl.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }, 500);

    logMediaChoice('text');
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.playerProps && this.props.playerProps.cover) {
      setHTMLFlag('has-cover', true);
      setHTMLFlag('has-unloaded-cover', true);
      load(this.props.playerProps.cover.url, () => {
        document.body.style.backgroundImage = `url(${this.props.playerProps.cover.url})`;
        setHTMLFlag('has-unloaded-cover', false);
      });
    }

    if (this.state.isOpen !== prevState.isOpen) {
      if (this.state.isOpen) {
        this.lastKnownScrollY = window.scrollY;
        setHTMLFlag('has-open', true);
        setHTMLFlag('has-opening', true);
        // After 750ms fade-out time plus 125ms buffer for code execution...
        setTimeout(() => setHTMLFlag('has-opening', false), 875);
      } else {
        setHTMLFlag('has-open', false);
        setHTMLFlag('has-opening', false);
        window.scrollTo(0, this.lastKnownScrollY);
      }
    }

    if (this.state.isDismissed !== prevState.isDismissed) {
      setHTMLFlag('has-dismissed', true)
    }
  }

  render({ playerProps }, { hasClosedAtLeastOnce, isDismissed, isOpen, transitionData }) {
    return (
      <div className={styles.root}>
        <div className={styles.notice}>
          <Icon type="audio" size="tiny" />
          <span>This story features audio</span>
        </div>
        <Button type="play" className={styles.open} onClick={this.open} iconProps={{ block: true, size: 'large' }}>
          <span>{hasClosedAtLeastOnce ? 'Resume play' : 'Get started'}</span>
        </Button>
        {this.alternativeStartEl && (
          <div className={styles.dismissChoice}>
            <button className={styles.dismiss} onClick={this.dismiss}>
              Give me the non-audio version
            </button>
          </div>
        )}
        <Portal into={'body'} ref={this.getPortalRef}>
          <div className={styles.portal}>
            {isOpen && (
              <Modal close={this.close}>
                {playerProps && <Player key="player" transitionData={transitionData} {...playerProps} />}
              </Modal>
            )}
          </div>
        </Portal>
      </div>
    );
  }
}

module.exports = App;
