const { h, Component } = require('preact');
const styles = require('./styles.css');

const ENTER = 13;
const LEFT = 37;
const RIGHT = 39;

class Timeline extends Component {
  constructor(props) {
    super(props);

    this.getPointerFraction = this.getPointerFraction.bind(this);
    this.getPointerTime = this.getPointerTime.bind(this);
    this.onHaloKeyDown = this.onHaloKeyDown.bind(this);
    this.scrubStart = this.scrubStart.bind(this);
    this.scrub = this.scrub.bind(this);
    this.scrubEnd = this.scrubEnd.bind(this);

    this.state = {
      scrubTime: null
    };
  }

  getPointerFraction(event) {
    const rect = this.base.getBoundingClientRect();
    const pointerX = event.touches ? event.touches[0].clientX : event.clientX;
    const rectX = Math.max(Math.min(pointerX - rect.left, rect.width), 0);

    return rectX / rect.width;
  }

  getPointerTime(event) {
    return Math.min(Math.round(this.getPointerFraction(event) * this.props.duration), this.props.duration - 0.01);
  }

  scrubStart(event) {
    this.isScrubbing = true;
    this.startPointerFraction = this.getPointerFraction(event);
    this.scrub(event, !!event.touches);
  }

  scrub(event, isPassive = true) {
    if (!this.isScrubbing) {
      return;
    }

    if (!isPassive) {
      event.preventDefault();
    }

    this.endPointerFraction = this.getPointerFraction(event);
    this.setState({ scrubTime: this.getPointerTime(event) });
  }

  scrubEnd(event) {
    if (!this.isScrubbing) {
      return;
    }

    let nearbySnapTime = null;

    if (Math.abs(this.startPointerFraction - this.endPointerFraction) < 0.01) {
      nearbySnapTime = (this.props.snapTimes || []).reduce(
        (memo, snapTime) => {
          const snapFraction = snapTime / this.props.duration;
          const snapDistance = Math.abs(snapFraction - this.endPointerFraction);
          const isNearby = snapDistance < 0.02;
          const isClosestSoFar = memo.distance === null || snapDistance < memo.distance;

          return isNearby && isClosestSoFar
            ? {
                time: snapTime,
                distance: snapDistance
              }
            : memo;
        },
        { time: null, distance: null }
      ).time;
    }

    this.isScrubbing = false;
    this.startPointerFraction = null;
    this.endPointerFraction = null;

    if (this.props.update) {
      this.props.update(nearbySnapTime === null ? this.state.scrubTime : nearbySnapTime + 0.01);
    }
  }

  onHaloKeyDown(event) {
    if (event.keyCode === LEFT && this.props.update) {
      this.props.update(this.props.currentTime - 15);
    } else if (event.keyCode === RIGHT && this.props.update) {
      this.props.update(this.props.currentTime + 15);
    }
  }

  componentDidMount() {
    this.base.addEventListener('mousedown', this.scrubStart);
    this.base.addEventListener('touchstart', this.scrubStart, { passive: true });
    document.addEventListener('mousemove', this.scrub);
    document.addEventListener('touchmove', this.scrub, { passive: true });
    document.addEventListener('mouseup', this.scrubEnd);
    document.addEventListener('touchend', this.scrubEnd);
    document.addEventListener('touchcancel', this.scrubEnd);
  }

  componentWillUnmount() {
    this.base.removeEventListener('mousedown', this.scrubStart);
    this.base.removeEventListener('touchstart', this.scrubStart);
    document.removeEventListener('mousemove', this.scrub);
    document.removeEventListener('touchmove', this.scrub);
    document.removeEventListener('mouseup', this.scrubEnd);
    document.removeEventListener('touchend', this.scrubEnd);
    document.removeEventListener('touchcancel', this.scrubEnd);
  }

  render() {
    const { currentTime, duration, snapTimes } = this.props;
    const { scrubTime } = this.state;
    const currentTimePct = `${currentTime / duration * 100}%`;
    const progressPct = this.isScrubbing ? `${scrubTime / duration * 100}%` : currentTimePct;

    return (
      <div className={styles.root}>
        <div className={styles.track}>
          <div className={styles.halo} tabindex="0" onKeyDown={this.onHaloKeyDown} />
          <div className={styles.snapTimes}>
            {snapTimes.map(snapTime => {
              const snapTimePct = Math.max(0, Math.min(snapTime / duration, 1)) * 100;

              return <div key={snapTime} className={styles.snapTime} style={{ left: `${snapTimePct}%` }} />;
            })}
          </div>
          <div className={styles.currentTimeProgress} style={{ width: currentTimePct }} />
          <div className={styles.progress} style={{ width: progressPct }} />
          <div className={styles.handle} style={{ left: progressPct }} />
        </div>
      </div>
    );
  }
}

module.exports = Timeline;
