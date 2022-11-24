import { h, Component } from 'preact';
import FocusTrap from 'react-focus-trap';
import Button from '../Button';
import styles from './styles.css';

let nextMaskIndex = 0;

const IS_MASK_FEATURE_ENABLED = true;

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
      if (!this.contentEl) {
        return;
      }

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
      setTimeout(this.updateMask, 1500); // After scroll bars have disappeared

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
                <mask
                  id={`${styles.overlay}_mask${maskIndex}`}
                  x="0"
                  y="0"
                  width={mask.width}
                  height={mask.height}
                >
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
          {close && <Button type="close" onClick={close} />}
        </div>
        <div className={styles.rotator}>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="70" viewBox="0 0 100 100">
            <g transform="translate(27 21.5)" fill-rule="evenodd">
              <path
                fill="#BFBFBF"
                d="M18 0h36a2 2 0 0 1 2 2v66a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm2 5v53h32V5H20z"
                transform="rotate(90 32.5 25.5)"
              />
              <path
                fill="#FFF"
                d="M31.989 34.496L26.7 29.148 24 32.054l7.989 7.613L48 23.928 45.336 21z"
                transform="matrix(0 0 0 0 23 25.334)"
              />
              <path
                fill="#FFF"
                d="M38.914 33.086L46 26l2.828 2.828-7.085 7.086 6.593 6.594-2.828 2.828-6.594-6.593-6.593 6.593-2.829-2.828 6.594-6.594L29 28.828 31.828 26l7.086 7.086z"
                transform="matrix(0 0 0 0 25.914 28.668)"
              />
            </g>
          </svg>
        </div>
      </FocusTrap>
    );
  }
}

export default Modal;
