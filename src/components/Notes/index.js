const { h, Component } = require('preact');
const { disableBodyScroll, enableBodyScroll } = require('body-scroll-lock');
const Note = require('../Note');
const styles = require('./styles.css');

const NEAR_END_DISTANCE = 200;

const getVisibleEntriesTimes = (entries, time) => Object.keys(entries).filter(key => time >= +key);
const getIsComposing = (entries, time) =>
  Object.keys(entries).filter(key => +key > time && +key - 5 <= time).length > 0;

class Notes extends Component {
  constructor(props) {
    super(props);

    this.getNotesElRef = this.getNotesElRef.bind(this);
    this.getNotesEndElRef = this.getNotesEndElRef.bind(this);
  }

  getNotesElRef(el) {
    this.notesEl = el;
  }

  getNotesEndElRef(el) {
    this.notesEndEl = el;
  }

  componentDidMount() {
    this.notesEl.scrollTop = this.notesEl.scrollHeight;
    disableBodyScroll(this.notesEl);
  }

  componentWillReceiveProps() {
    this._wasNearEnd =
      this.notesEndEl.getBoundingClientRect().top - this.base.getBoundingClientRect().bottom < NEAR_END_DISTANCE;
  }

  componentDidUpdate(prevProps) {
    // We have more content if we've added more note times, or we're 'composing' the next note time
    this._hasMoreContent =
      getVisibleEntriesTimes(prevProps.entries, prevProps.time).length <
        getVisibleEntriesTimes(this.props.entries, this.props.time).length ||
      (getIsComposing(this.props.entries, this.props.time) && !getIsComposing(prevProps.entries, prevProps.time));

    if (this._hasMoreContent && this._wasNearEnd) {
      this.notesEndEl.scrollIntoView({
        behavior: 'smooth'
      });
    }

    this._wasNearEnd = null;
    this._hasMoreContent = null;
  }

  componentWillUnmount() {
    enableBodyScroll(this.notesEl);
  }

  render({ entries, sections, time }) {
    const visibleEntriesTimes = getVisibleEntriesTimes(entries, time);
    const visibleNotes = visibleEntriesTimes.reduce(
      (memo, time, index) =>
        memo.concat(
          []
            .concat(entries[time].media ? [entries[time].media] : [])
            .concat(entries[time].content)
            .map((note, timeIndex) => ({
              note,
              section: sections[entries[time].sectionIndex],
              time: +time,
              timeIndex
            }))
        ),
      []
    );
    const isComposing = getIsComposing(entries, time);

    return (
      <section className={styles.root}>
        <div ref={this.getNotesElRef} className={styles.notes} aria-live="polite">
          {visibleNotes
            .map(({ note, section, time, timeIndex }, index) => (
              <Note
                key={`note${index}`}
                component={note.component}
                props={note.props}
                section={section}
                time={time}
                timeIndex={timeIndex}
                onTimeLink={this.props.onTimeLink}
              />
            ))
            .concat(isComposing ? [<Note key="composing" component={Composing} time={time - 5} />] : [])
            .concat([<div key="end" ref={this.getNotesEndElRef} className={styles.end} />])}
        </div>
      </section>
    );
  }
}

const Composing = () => (
  <div className={styles.composing}>
    <span className={styles.dot} />
    <span className={styles.dot} />
    <span className={styles.dot} />
  </div>
);

module.exports = Notes;
