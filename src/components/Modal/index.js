const { h, Component } = require('preact');
const FocusTrap = require('react-focus-trap');
const Button = require('../Button');
const Loader = require('../Loader');
const styles = require('./styles.css');

let nextMaskIndex = 0;

class Modal extends Component {
  constructor(props) {
    super(props);

    this.getContentElRef = this.getContentElRef.bind(this);
    this.stopTouchMove = this.stopTouchMove.bind(this);
    this.updateMask = this.updateMask.bind(this);

    this.state = {
      maskIndex: nextMaskIndex++
    };
  }

  getContentElRef(el) {
    this.contentEl = el;
  }

  stopTouchMove(event) {
    event.preventDefault();
  }

  updateMask() {
    setTimeout(() => {
      const contentRect = this.contentEl.getBoundingClientRect();
      const contentRadius = window.getComputedStyle(this.contentEl).borderRadius;

      this.setState({
        mask:
          contentRadius === '0px'
            ? null
            : {
                width: window.innerWidth,
                height: window.innerHeight,
                contentX: Math.ceil(contentRect.left),
                contentY: Math.ceil(contentRect.top),
                contentWidth: Math.floor(contentRect.width),
                contentHeight: Math.floor(contentRect.height),
                contentRadius
              }
      });
    });
  }

  componentDidMount() {
    this.updateMask();

    window.addEventListener('resize', this.updateMask);
    document.addEventListener('touchmove', this.stopTouchMove);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateMask);
    document.removeEventListener('touchmove', this.stopTouchMove);
  }

  render({ children, close }, { maskIndex, mask }) {
    return (
      <FocusTrap className={styles.root}>
        {mask && (
          <svg className={styles.mask} viewbox={`0 0 ${mask.width} ${mask.height}`}>
            <defs>
              <mask id={`${styles.mask}_mask${maskIndex}`} x="0" y="0" width={mask.width} height={mask.height}>
                <rect x="0" y="0" width={mask.width} height={mask.height} fill="#fff" />
                <rect
                  x={mask.contentX}
                  y={mask.contentY}
                  width={mask.contentWidth}
                  height={mask.contentHeight}
                  rx={mask.contentRadius}
                  ry={mask.contentRadius}
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width={mask.width}
              height={mask.height}
              mask={`url(#${styles.mask}_mask${maskIndex})`}
              fill="#1c1c1c"
            />
          </svg>
        )}
        <div ref={this.getContentElRef} className={styles.content}>
          {children}
          <Loader className={styles.loader} inverted large overlay />
          {close && <Button type="close" onClick={close} />}
        </div>
      </FocusTrap>
    );
  }
}

module.exports = Modal;
