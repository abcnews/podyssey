const { h, Component } = require('preact');
const { FormattedTime } = require('react-player-controls');
const styles = require('./styles.css');

const isStateless = component => typeof component !== 'string' && !component.prototype.render;

class Note extends Component {
  constructor(props) {
    super(props);

    this.makeStatic = this.makeStatic.bind(this);
  }

  makeStatic() {
    this.base.removeEventListener('animationend', this.makeStatic);
    this.base.setAttribute('static', '');
  }

  componentDidMount() {
    this.base.addEventListener('animationend', this.makeStatic);
  }

  componentWillUnmount() {
    this.base.removeEventListener('animationend', this.makeStatic);
  }

  render({ component, props = {}, time, timeIndex }) {
    const Constructor = !isStateless(component) && component;

    return (
      <article className={styles.root} style={{ animationDelay: timeIndex ? `${timeIndex / 15}s` : null }}>
        {timeIndex === 0 &&
          time > 0 && (
            <div className={styles.time} onClick={this.props.onTimeLink ? () => this.props.onTimeLink(time) : null}>
              <FormattedTime numSeconds={time} />
            </div>
          )}
        <div className={styles.content}>{Constructor ? <Constructor {...props} /> : component(props)}</div>
      </article>
    );
  }
}

module.exports = Note;
