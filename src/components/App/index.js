const { h, Component } = require('preact');
const Portal = require('preact-portal');
const { select } = require('../../dom');
const Button = require('../Button');
const Icon = require('../Icon');
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
      isOpen: false,
      transitionData: null
    };
  }

  getBottomRef(el) {
    this.bottomEl = el;
  }

  open() {
    const transitionData = {
      playIconRect: select('svg[data-type="play"]').getBoundingClientRect()
    };

    this.setState({ hasOpenedAtLeastOnce: true, isOpen: true, transitionData });
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
    const htmlClassList = document.documentElement.classList;

    if (this.state.isOpen !== prevState.isOpen) {
      if (this.state.isOpen) {
        this.lastKnownScrollY = window.scrollY;
        htmlClassList.add(styles.hasOpen, styles.hasOpening);
        // After 750ms fade-out time plus 125ms buffer for code execution...
        setTimeout(() => htmlClassList.remove(styles.hasOpening), 875);
      } else {
        htmlClassList.remove(styles.hasOpen, styles.hasOpening);
        window.scrollTo(0, this.lastKnownScrollY);
      }
    }

    if (this.state.hasDismissed !== prevState.hasDismissed) {
      this.base.parentElement.classList.add(styles.hasDismissed);
    }
  }

  render({ playerProps }, { hasOpenedAtLeastOnce, isDismissed, isOpen, transitionData }) {
    return (
      <div className={styles.root}>
        <div className={styles.notice}>
          <Icon type="audio" size="tiny" />
          <span>This story features audio</span>
        </div>
        <Button type="play" className={styles.open} onClick={this.open} iconProps={{ block: true, size: 'large' }}>
          <span>{hasOpenedAtLeastOnce ? 'Resume play' : 'Get started'}</span>
        </Button>
        <div className={styles.dismissChoice}>
          <button className={styles.dismiss} onClick={this.dismiss}>
            Give me the non-audio version
          </button>
        </div>
        <div ref={this.getBottomRef} className={styles.bottom} />
        <Portal into={'body'}>
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
