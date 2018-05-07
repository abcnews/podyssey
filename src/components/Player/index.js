const { actions, events } = require('html5-audio-driver');
const { h, Component } = require('preact');
const { detach, select } = require('../../dom');
const Button = require('../Button');
const Entry = require('../Entry');
const Time = require('../Time');
const Timeline = require('../Timeline');
const styles = require('./styles.css');

const STORAGE_PREFIX = 'podyssey';
const HOP_BACK_SECONDS = 15;
const HOP_FORWARD_SECONDS = 30;
const INERT_EL = { focus: () => {} };

class Player extends Component {
  constructor(props) {
    super(props);

    this.getAudioElRef = this.getAudioElRef.bind(this);
    this.pause = this.pause.bind(this);
    this.play = this.play.bind(this);
    this.hopBack = this.hopBack.bind(this);
    this.hopForward = this.hopForward.bind(this);
    this.hopTo = this.hopTo.bind(this);

    // this._lastStoredTime = +localStorage.getItem(`${STORAGE_PREFIX}__currentTime__${this.props.audioCMID}`);

    this.state = {
      // currentTime: this._lastStoredTime,
      currentTime: 0,
      duration: 0,
      isPaused: true,
      isEnded: false
    };
  }

  getAudioElRef(el) {
    this.audioEl = el;
  }

  pause() {
    this.audioActions.pause();
  }

  play() {
    if (this.state.isEnded) {
      this.audioEl.currentTime = 0;
    }

    this.audioActions.play();
  }

  hopTo(time) {
    this.audioActions.setPlaytime(time);
  }

  hopBack() {
    this.hopTo(this.state.currentTime - HOP_BACK_SECONDS);
  }

  hopForward() {
    this.hopTo(this.state.currentTime + HOP_FORWARD_SECONDS);
  }

  componentDidUpdate() {
    // Persist playback time if changed by 5 seconds
    // if (Math.abs(this._lastStoredTime - this.state.currentTime) > 5) {
    //   this._lastStoredTime = Math.round(this.state.currentTime);
    //   localStorage.setItem(`${STORAGE_PREFIX}__currentTime__${this.props.audioCMID}`, this._lastStoredTime);
    // }
  }

  componentDidMount() {
    this.audioActions = actions(this.audioEl);
    this.audioEvents = events(this.audioEl);
    this.audioEvents.onDurationChange(() => this.setState({ duration: this.audioEl.duration }));
    this.audioEvents.onEnd(() => this.setState({ isEnded: true }));
    this.audioEvents.onPause(() => this.setState({ isPaused: true }));
    this.audioEvents.onPlay(() => this.setState({ isPaused: false, isEnded: false }));
    this.audioEvents.onPlaytimeUpdate(
      () => this._isSeeking || this.setState({ currentTime: this.audioEl ? this.audioEl.currentTime : 0 })
    );
    // this.audioActions.setPlaytime(this._lastStoredTime);

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

    // Auto-play
    this.play();
  }

  componentWillUnmount() {
    this.audioActions.pause();
    detach(this.audioEl);
  }

  render({ audioData, entries, sections, title }, { currentTime, duration, isEnded, isPaused }) {
    const activeEntryTime = Object.keys(entries)
      .reverse()
      .find(time => time < currentTime);
    const activeEntry = activeEntryTime === null ? null : entries[activeEntryTime];
    const snappableSectionTimes = sections.filter(section => section.title).map(section => section.time);

    return (
      <div className={styles.root}>
        <audio ref={this.getAudioElRef}>
          <source src={audioData.url} type={audioData.contentType} />}
        </audio>
        <main className={styles.main}>
          {activeEntry && (
            <Entry
              key={activeEntry}
              media={activeEntry.media}
              notes={activeEntry.notes}
              section={sections[activeEntry.sectionIndex]}
            />
          )}
        </main>
        <nav ref={this.getControlsElRef} className={styles.controls}>
          <Timeline
            currentTime={currentTime}
            duration={duration}
            snapTimes={snappableSectionTimes}
            update={this.hopTo}
          />
          <div className={styles.times}>
            <Time numSeconds={Math.round(currentTime)} />
            <Time numSeconds={Math.round(duration)} />
          </div>
          <div className={styles.buttons}>
            <Button type="prev" disabled={currentTime - HOP_BACK_SECONDS <= 0} onClick={this.hopBack} />
            <Button type={isPaused ? 'play' : 'pause'} onClick={this[isPaused ? 'play' : 'pause']} />
            <Button type="next" disabled={currentTime + HOP_FORWARD_SECONDS >= duration} onClick={this.hopForward} />
          </div>
        </nav>
      </div>
    );
  }
}

module.exports = Player;
