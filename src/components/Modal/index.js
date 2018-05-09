const { h, Component } = require('preact');
const FocusTrap = require('react-focus-trap');
const Button = require('../Button');
const Loader = require('../Loader');
const styles = require('./styles.css');

let nextMaskIndex = 0;

const IS_MASK_FEATURE_ENABLED = false;

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
    document.body.addEventListener('touchmove', this.stopTouchMove, { passive: false });

    if (IS_MASK_FEATURE_ENABLED) {
      this.updateMask();

      window.addEventListener('resize', this.updateMask);
    }
  }

  componentWillUnmount() {
    document.body.removeEventListener('touchmove', this.stopTouchMove);

    if (IS_MASK_FEATURE_ENABLED) {
      window.removeEventListener('resize', this.updateMask);
    }
  }

  render({ children, close }, { maskIndex, mask }) {
    return (
      <FocusTrap className={styles.root}>
        {IS_MASK_FEATURE_ENABLED ? (
          mask && (
            <svg className={styles.overlay} viewbox={`0 0 ${mask.width} ${mask.height}`}>
              <defs>
                <mask id={`${styles.overlay}_mask${maskIndex}`} x="0" y="0" width={mask.width} height={mask.height}>
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
                mask={`url(#${styles.overlay}_mask${maskIndex})`}
              />
            </svg>
          )
        ) : (
          <div className={styles.overlay} />
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
