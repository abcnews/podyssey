const { actions, events } = require('html5-audio-driver');
const { h, Component } = require('preact');
const { detach } = require('../../dom');
const Button = require('../Button');
const Entry = require('../Entry');
const Time = require('../Time');
const Timeline = require('../Timeline');
const styles = require('./styles.css');

const STORAGE_PREFIX = 'podyssey';
const HOP_BACK_SECONDS = 15;
const HOP_FORWARD_SECONDS = 30;
const INERT_EL = { focus: () => {} };
const NO_BUBBLE = event => event.stopPropagation();

class Player extends Component {
  constructor(props) {
    super(props);

    this.getAudioElRef = this.getAudioElRef.bind(this);
    this.getPauseElRef = this.getPauseElRef.bind(this);
    this.getPlayElRef = this.getPlayElRef.bind(this);
    this.pause = this.pause.bind(this);
    this.play = this.play.bind(this);
    this.hopBack = this.hopBack.bind(this);
    this.hopForward = this.hopForward.bind(this);
    this.hopTo = this.hopTo.bind(this);

    this._lastStoredTime = +localStorage.getItem(`${STORAGE_PREFIX}__currentTime__${this.props.audioCMID}`);

    this.state = {
      currentTime: this._lastStoredTime,
      duration: 0,
      isPaused: true,
      isEnded: false
    };
  }

  getAudioElRef(el) {
    this.audioEl = el;
  }

  getPauseElRef(component) {
    this.pauseEl = component ? component.base : INERT_EL;
  }

  getPlayElRef(component) {
    this.playEl = component ? component.base : INERT_EL;
  }

  pause() {
    this.audioActions.pause();
    this.playEl.focus();
  }

  play() {
    if (this.state.isEnded) {
      this.audioEl.currentTime = 0;
    }

    this.audioActions.play();
    this.pauseEl.focus();
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
    if (Math.abs(this._lastStoredTime - this.state.currentTime) > 5) {
      this._lastStoredTime = Math.round(this.state.currentTime);
      localStorage.setItem(`${STORAGE_PREFIX}__currentTime__${this.props.audioCMID}`, this._lastStoredTime);
    }
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
    this.audioActions.setPlaytime(this._lastStoredTime);

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
        <nav className={styles.controls} onTouchMove={NO_BUBBLE}>
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
            <Button ref={this.getPauseElRef} type="pause" disabled={isPaused} onClick={this.pause} />
            <Button ref={this.getPlayElRef} type="play" disabled={!isPaused} onClick={this.play} />
            <Button type="next" disabled={currentTime + HOP_FORWARD_SECONDS >= duration} onClick={this.hopForward} />
          </div>
        </nav>
      </div>
    );
  }
}

module.exports = Player;
