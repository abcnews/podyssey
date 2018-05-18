const cn = require('classnames');
const NoSleep = require('nosleep.js');
const { h, Component } = require('preact');
const ReactCSSTransitionReplace = require('react-css-transition-replace');
const widont = require('widont');
const { detach, select } = require('../../dom');
const Button = require('../Button');
const Entry = require('../Entry');
const Timeline = require('../Timeline');
const styles = require('./styles.css');

const STORAGE_PREFIX = 'podyssey';
const HOP_BACK_SECONDS = 15;
const HOP_FORWARD_SECONDS = 30;
const NOOP = () => {};

const TRANSITIONS = {
  SECTION_TITLE: {
    enter: styles.sectionTitleEnter,
    enterActive: styles.sectionTitleEnterActive,
    leave: styles.sectionTitleLeave,
    leaveActive: styles.sectionTitleLeaveActive
  },
  ENTRY: {
    enter: styles.entryContainerEnter,
    enterActive: styles.entryContainerEnterActive,
    leave: styles.entryContainerLeave,
    leaveActive: styles.entryContainerLeaveActive
  },
  ENTRY_SECTION_FORWARDS: {
    enter: styles.entryContainerEnterSection,
    enterActive: styles.entryContainerEnterActiveSection,
    leave: styles.entryContainerLeaveSection,
    leaveActive: styles.entryContainerLeaveActiveSection
  },
  ENTRY_SECTION_BACKWARDS: {
    enter: styles.entryContainerEnterSectionBackwards,
    enterActive: styles.entryContainerEnterActiveSection,
    leave: styles.entryContainerLeaveSection,
    leaveActive: styles.entryContainerLeaveActiveSectionBackwards
  }
};

class Player extends Component {
  constructor(props) {
    super(props);

    this.getAudioElRef = this.getAudioElRef.bind(this);
    this.pause = this.pause.bind(this);
    this.play = this.play.bind(this);
    this.hopTo = this.hopTo.bind(this);
    this.hopToDataTime = this.hopToDataTime.bind(this);
    this.forgetTime = this.forgetTime.bind(this);

    this.nosleep = new NoSleep();

    this.storageKey = `${STORAGE_PREFIX}__currentTime__${this.props.cmid}`;

    this._prevCurrentTime = -1;
    this._prevActiveSectionIndex = -1;
    this._resumeFrom = this.loadTime() || null;

    this.state = {
      canPlay: false,
      canPlayThrough: false,
      currentTime: 0,
      duration: 0,
      isBuffering: false,
      isPaused: true,
      isEnded: false
    };
  }

  getAudioElRef(el) {
    this.audioEl = el;
  }

  pause() {
    this.audioEl.pause();
    this.nosleep.disable();
  }

  play() {
    if (this.state.isEnded) {
      this.hopTo(0);
    }

    try {
      this.nosleep.enable();
      this.audioEl.play().catch(NOOP);
    } catch (e) {}
  }

  hopTo(time) {
    console.log(`hopTo: ${Math.round(time) + 0.01}`);
    this.audioEl.currentTime = Math.round(time) + 0.01;
  }

  hopToDataTime(event) {
    this.hopTo(event.currentTarget.getAttribute('data-time'));
  }

  loadTime() {
    return +sessionStorage.getItem(this.storageKey);
  }

  saveTime() {
    sessionStorage.setItem(this.storageKey, this.state.currentTime);
  }

  forgetTime() {
    sessionStorage.removeItem(this.storageKey);
  }

  componentDidMount() {
    this.audioEl.addEventListener('durationchange', () => this.setState({ duration: this.audioEl.duration }));
    this.audioEl.addEventListener('canplay', () => this.setState({ canPlay: true }));
    this.audioEl.addEventListener('canplaythrough', () => this.setState({ canPlayThrough: true }));
    this.audioEl.addEventListener('waiting', () => this.setState({ isBuffering: true }));
    this.audioEl.addEventListener('ended', () => this.setState({ isEnded: true }));
    this.audioEl.addEventListener('pause', () => this.setState({ isPaused: true }));
    this.audioEl.addEventListener('playing', () => {
      this.setState({ isBuffering: false, isEnded: false, isPaused: false });

      if (this._resumeFrom) {
        this.hopTo(this._resumeFrom);
        this._resumeFrom = null;
      }
    });
    this.audioEl.addEventListener('timeupdate', () => {
      const currentTime = this.audioEl ? this.audioEl.currentTime : 0;
      const isEnded = this.audioEl ? currentTime === this.audioEl.duration : false;

      this.setState({
        currentTime,
        isEnded
      });
    });

    // FLIP playback icon

    const playbackIconEl = select('svg[data-type="play"], svg[data-type="pause"]', this.base);
    const playbackIconRect = playbackIconEl.getBoundingClientRect();

    if (this.props.transitionData) {
      const transform = {
        translateY:
          this.props.transitionData.playIconRect.top -
          playbackIconRect.top +
          (this.props.transitionData.playIconRect.height - playbackIconRect.height) / 2,
        scale: this.props.transitionData.playIconRect.width / playbackIconRect.width
      };

      playbackIconEl.style.transitionDelay = '0s';
      playbackIconEl.style.transitionDuration = '0s';
      playbackIconEl.style.transform = `translate(0, ${transform.translateY}px) scale(${transform.scale})`;

      setTimeout(() => {
        playbackIconEl.style.transitionDelay = '';
        playbackIconEl.style.transitionDuration = '';
        playbackIconEl.style.transform = '';
      });
    }

    window.addEventListener('unload', this.forgetTime);
    this.audioEl.load();
    this.play();
  }

  componentDidUpdate() {
    if (this._nextMedia && this._nextMedia.component.preload) {
      this._nextMedia.component.preload(this._nextMedia.props);
    }

    this._nextMedia = null;
  }

  componentWillUnmount() {
    this.pause();
    detach(this.audioEl);
    this.saveTime();
  }

  render(
    { audio, entries, sections, title },
    { canPlay, canPlayThrough, currentTime, duration, isBuffering, isEnded, isPaused }
  ) {
    const titledSectionTimes = sections.filter(section => section.title).map(section => section.time);
    const activeTitledSectionTime = titledSectionTimes
      .slice()
      .reverse()
      .find(time => time < currentTime);
    const prevTitledSectionTime =
      titledSectionTimes.length > 1 && titledSectionTimes[titledSectionTimes.indexOf(activeTitledSectionTime) - 1];
    const nextTitledSectionTime =
      titledSectionTimes.length > 1 && titledSectionTimes[titledSectionTimes.indexOf(activeTitledSectionTime) + 1];
    const entryTimes = Object.keys(entries);
    const activeEntryTime = entryTimes
      .slice()
      .reverse()
      .find(time => time < currentTime);
    const nextEntryTime = entryTimes[entryTimes.indexOf(activeEntryTime) + 1];
    const activeEntry = activeEntryTime === null ? null : entries[activeEntryTime];
    const activeSectionIndex = activeEntry ? activeEntry.sectionIndex : -1;
    const activeSection = activeEntry ? sections[activeSectionIndex] : null;
    const hasTimeAdvanced = currentTime > this._prevCurrentTime;
    const hasSectionChanged = activeSectionIndex !== this._prevActiveSectionIndex;

    this._prevCurrentTime = currentTime;
    this._prevActiveSectionIndex = activeSectionIndex;

    if (nextEntryTime) {
      this._nextMedia = (entries[nextEntryTime] || {}).media;
    }

    return (
      <div className={cn(styles.root, { [styles.buffering]: isBuffering })}>
        <audio ref={this.getAudioElRef} title={title} preload="auto">
          <source src={audio.url} type={audio.contentType} />}
        </audio>
        <header className={styles.section}>
          <ReactCSSTransitionReplace
            transitionName={TRANSITIONS.SECTION_TITLE}
            transitionEnterTimeout={1000}
            transitionLeaveTimeout={1000}
          >
            <h2
              key={activeSectionIndex}
              className={cn(styles.sectionTitle, {
                [styles.isLong]: activeSection && (activeSection.title || '').length > 20
              })}
            >
              {activeSection ? widont(activeSection.title) : ' '}
            </h2>
          </ReactCSSTransitionReplace>
        </header>
        <main className={styles.main}>
          <ReactCSSTransitionReplace
            transitionName={
              hasSectionChanged
                ? hasTimeAdvanced
                  ? TRANSITIONS.ENTRY_SECTION_FORWARDS
                  : TRANSITIONS.ENTRY_SECTION_BACKWARDS
                : TRANSITIONS.ENTRY
            }
            transitionEnterTimeout={hasSectionChanged ? 1000 : 2000}
            transitionLeaveTimeout={hasSectionChanged ? 1000 : 2000}
          >
            <div key={activeEntryTime} className={styles.entryContainer}>
              {activeEntry ? <Entry media={activeEntry.media} notes={activeEntry.notes} isPaused={isPaused} /> : null}
            </div>
          </ReactCSSTransitionReplace>
        </main>
        <nav ref={this.getControlsElRef} className={styles.controls}>
          <Timeline currentTime={currentTime} duration={duration} snapTimes={titledSectionTimes} update={this.hopTo} />
          <div className={styles.buttons}>
            <HopButton type="prev" time={duration ? prevTitledSectionTime : null} onClick={this.hopToDataTime} />
            <Button
              type={isEnded ? 'replay' : isPaused || !canPlay ? 'play' : 'pause'}
              onClick={this[isPaused ? 'play' : 'pause']}
            />
            <HopButton type="next" time={duration ? nextTitledSectionTime : null} onClick={this.hopToDataTime} />
          </div>
        </nav>
      </div>
    );
  }
}

const HopButton = ({ type, time, onClick, ...props }) => (
  <Button
    type={type}
    disabled={typeof time !== 'number'}
    onClick={onClick}
    data-time={typeof time !== 'number' ? null : time}
    {...props}
  />
);

module.exports = Player;
