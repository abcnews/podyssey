import cn from 'classnames';
import { h, Component } from 'preact';
import Time from '../Time';
import styles from './styles.css';

const LEFT = 37;
const RIGHT = 39;
const SKIP_BACK_SECONDS = 15;
const SKIP_FORWARD_SECONDS = 30;

class Timeline extends Component {
  constructor(props) {
    super(props);

    this.getPointerFraction = this.getPointerFraction.bind(this);
    this.getPointerTime = this.getPointerTime.bind(this);
    this.onHaloKeyDown = this.onHaloKeyDown.bind(this);
    this.onHaloKeyUp = this.onHaloKeyUp.bind(this);
    this.scrubStart = this.scrubStart.bind(this);
    this.scrub = this.scrub.bind(this);
    this.scrubEnd = this.scrubEnd.bind(this);

    this.state = {
      tempTime: null
    };
  }

  getPointerFraction(event) {
    const rect = this.base.getBoundingClientRect();
    const pointerX = event.touches ? event.touches[0].clientX : event.clientX;
    const rectX = Math.max(Math.min(pointerX - rect.left, rect.width), 0);

    return rectX / rect.width;
  }

  getPointerTime(event) {
    return Math.min(
      Math.round(this.getPointerFraction(event) * this.props.duration),
      this.props.duration - 0.01
    );
  }

  scrubStart(event) {
    if (this.isIgnoringScrubbing) {
      return;
    }

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
    this.setState({ tempTime: this.getPointerTime(event) });
  }

  scrubEnd(event) {
    if (!this.isScrubbing) {
      return;
    }

    const scrubDistance = Math.abs(this.startPointerFraction - this.endPointerFraction);
    let nearbySnapTime = null;

    if (scrubDistance < 0.01) {
      const snapRange = event.type.indexOf('touch') < 0 ? 0.01 : 0.04;

      nearbySnapTime = (this.props.snapTimes || []).reduce(
        (memo, snapTime) => {
          const snapFraction = snapTime / this.props.duration;
          const snapDistance = Math.abs(snapFraction - this.endPointerFraction);
          const isNearby = snapDistance < snapRange;
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

    // Stop extra touch/mouse events in environments that fire both in succession
    this.isIgnoringScrubbing = true;
    setTimeout(() => (this.isIgnoringScrubbing = false), 200);

    this.update(nearbySnapTime === null ? this.state.tempTime : nearbySnapTime);
  }

  onHaloKeyDown(event) {
    if (event.keyCode !== LEFT && event.keyCode !== RIGHT) {
      return;
    }

    this.isScrubbing = true;

    const tempTime =
      typeof this.state.tempTime === 'number' ? this.state.tempTime : this.props.currentTime;

    if (event.keyCode === LEFT) {
      this.setState({ tempTime: Math.max(0, tempTime - SKIP_BACK_SECONDS) });
    } else if (event.keyCode === RIGHT) {
      this.setState({ tempTime: Math.min(this.props.duration, tempTime + SKIP_FORWARD_SECONDS) });
    }
  }

  onHaloKeyUp(event) {
    if (event.keyCode !== LEFT && event.keyCode !== RIGHT) {
      return;
    }

    this.isScrubbing = false;
    this.update(this.state.tempTime);
  }

  update(time) {
    if (this.props.update) {
      this.isApplyingUpdate = true;
      this.setState({ tempTime: time });
      this.props.update(time);
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

  componentDidUpdate(prevProps, prevState) {
    if (this.isApplyingUpdate && this.props.currentTime !== prevProps.currentTime) {
      this.isApplyingUpdate = false;
    }
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
    const { tempTime } = this.state;
    const currentTimeFraction = currentTime / duration;
    const currentTimePct = `${currentTimeFraction * 100}%`;
    const progressFraction =
      this.isScrubbing || this.isApplyingUpdate ? tempTime / duration : currentTimeFraction;
    const progressPct = `${progressFraction * 100}%`;

    return (
      <div className={cn(styles.root, { [styles.hasDuration]: !!duration })}>
        <div className={styles.track}>
          <div
            className={styles.halo}
            tabindex="0"
            onKeyDown={this.onHaloKeyDown}
            onKeyUp={this.onHaloKeyUp}
          />
          <div className={styles.snapTimes}>
            {snapTimes.map(snapTime => {
              const snapTimePct = Math.max(0, Math.min(snapTime / duration, 1)) * 100;

              return (
                <div
                  key={snapTime}
                  className={styles.snapTime}
                  style={{ left: `${snapTimePct}%` }}
                />
              );
            })}
          </div>
          <div className={styles.currentTimeProgress} style={{ width: currentTimePct }} />
          <div className={styles.progress} style={{ width: progressPct }} />
          <div className={styles.handle} style={{ left: progressPct }} />
        </div>
        <div className={cn(styles.scrubTime, { [styles.isVisible]: this.isScrubbing })}>
          <Time
            numSeconds={Math.round(tempTime)}
            style={{
              paddingLeft: `calc(${progressFraction * 100}% - 2.25rem)`,
              paddingRight: `calc(${(1 - progressFraction) * 100}% - 2.25rem)`
            }}
          />
        </div>
        <div className={styles.extents}>
          <Time numSeconds={Math.round(currentTime)} isZeroUnknown={duration === 0} />
          <Time numSeconds={Math.round(duration)} isZeroUnknown />
        </div>
      </div>
    );
  }
}

export default Timeline;
