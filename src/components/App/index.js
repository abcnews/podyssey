import { selectMounts } from '@abcnews/mount-utils';
import { Client } from '@abcnews/poll-counters-client';
import { h, Component } from 'preact';
import { createPortal } from 'preact/compat';
import { select } from '../../dom';
import Button from '../Button';
import { load } from '../Image';
import Icon from '../Icon';
import Modal from '../Modal';
import Player from '../Player';
import styles from './styles.css';

const ARTICLE_SLUG = window.location.pathname.split('/').reverse()[1];
const NO_OP = () => {};
const increment = (id, answer) =>
  new Client(`podyssey-${id}`).increment({ question: ARTICLE_SLUG, answer }, NO_OP);
const logMediaChoice = answer => increment('media-choice', answer);

function setHTMLFlag(name, isOn) {
  document.documentElement[isOn ? 'setAttribute' : 'removeAttribute'](`data-podyssey-${name}`, '');
}

class App extends Component {
  constructor(props) {
    super(props);

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.dismiss = this.dismiss.bind(this);

    this.alternativeStartEl = selectMounts('alternative')[0] || null;

    this.state = {
      hasClosedAtLeastOnce: false,
      isDismissed: false,
      isOpen: false,
      transitionData: null
    };

    if (this.props.playerProps && this.props.playerProps.cover) {
      setHTMLFlag('has-cover', true);
      setHTMLFlag('has-unloaded-cover', true);
      load(this.props.playerProps.cover.url, () => {
        document.body.style.backgroundImage = `url(${this.props.playerProps.cover.url})`;
        setHTMLFlag('has-unloaded-cover', false);
      });
    }
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

  componentDidUpdate(_prevProps, prevState) {
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
      setHTMLFlag('has-dismissed', true);
    }
  }

  render({ playerProps }, { hasClosedAtLeastOnce, isDismissed, isOpen, transitionData }) {
    return (
      <div className={styles.root}>
        <div className={styles.notice}>
          <Icon type="audio" size="tiny" />
          <span>This story features audio</span>
        </div>
        <Button
          type="play"
          className={styles.open}
          onClick={this.open}
          iconProps={{ block: true, size: 'large' }}
        >
          <span>{hasClosedAtLeastOnce ? 'Resume play' : 'Get started'}</span>
        </Button>
        {this.alternativeStartEl && (
          <div className={styles.dismissChoice}>
            <button className={styles.dismiss} onClick={this.dismiss}>
              Give me the non-audio version
            </button>
          </div>
        )}
        {createPortal(
          <div className={styles.portal}>
            {isOpen && (
              <Modal close={this.close}>
                {playerProps && (
                  <Player key="player" transitionData={transitionData} {...playerProps} />
                )}
              </Modal>
            )}
          </div>,
          document.body
        )}
      </div>
    );
  }
}

export default App;
