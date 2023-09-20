import { Button, Icon, Slider } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Tooltip2 } from '@blueprintjs/popover2';
import React from 'react';
import { type AnimatedCurve } from '../../bundles/curve/types';
import AutoLoopSwitch from '../common/auto_loop_switch';
import { BP_TAB_BUTTON_MARGIN, BP_TEXT_MARGIN, CANVAS_MAX_WIDTH } from '../common/css_constants';
import PlayButton from '../common/play_button';
import WebGLCanvas from '../common/web_gl_canvas';

type Props = {
  animation: AnimatedCurve;
};

type State = {
  /** Timestamp of the animation */
  animTimestamp: number;

  /** Boolean value indicating if the animation is playing */
  isPlaying: boolean;

  /** Previous value of `isPlaying` */
  wasPlaying: boolean;

  /** Whether auto loop is enabled */
  isAutoLooping: boolean;

  /** Curve angle in radians */
  displayAngle: number;
};

/**
 * Canvas to animate 3D Curves. A combination of Canvas3dCurve and
 * AnimationCanvas.
 *
 * Uses WebGLCanvas internally.
 */
export default class AnimationCanvas3dCurve extends React.Component<
Props,
State
> {
  private canvas: HTMLCanvasElement | null;

  /**
   * The duration of one frame in milliseconds
   */
  private readonly frameDuration: number;

  /**
   * The duration of the entire animation
   */
  private readonly animationDuration: number;

  /**
   * Last timestamp since the previous `requestAnimationFrame` call
   */
  private callbackTimestamp: number | null;

  constructor(props: Props | Readonly<Props>) {
    super(props);

    this.state = {
      animTimestamp: 0,
      isPlaying: false,
      wasPlaying: false,
      isAutoLooping: true,
      displayAngle: 0,
    };

    this.canvas = null;
    this.frameDuration = 1000 / props.animation.fps;
    this.animationDuration = Math.round(props.animation.duration * 1000);
    this.callbackTimestamp = null;
  }

  /**
   * Call this to actually draw a frame onto the canvas
   */
  private drawFrame = () => {
    if (this.canvas) {
      const frame = this.props.animation.getFrame(
        this.state.animTimestamp / 1000,
      );
      frame.draw(this.canvas);
    }
  };

  private reqFrame = () => requestAnimationFrame(this.animationCallback);

  /**
   * Callback to use with `requestAnimationFrame`
   */
  private animationCallback = (timeInMs: number) => {
    if (!this.canvas || !this.state.isPlaying) return;

    if (!this.callbackTimestamp) {
      this.callbackTimestamp = timeInMs;
      this.drawFrame();
      this.reqFrame();
      return;
    }

    const currentFrame = timeInMs - this.callbackTimestamp;

    if (currentFrame < this.frameDuration) {
      // Not time to draw a new frame yet
      this.reqFrame();
      return;
    }

    this.callbackTimestamp = timeInMs;
    if (this.state.animTimestamp >= this.animationDuration) {
      // Animation has ended
      if (this.state.isAutoLooping) {
        // If auto loop is active, restart the animation
        this.setState(
          {
            animTimestamp: 0,
          },
          this.reqFrame,
        );
      } else {
        // Otherwise, stop the animation
        this.setState(
          {
            isPlaying: false,
          },
          () => {
            this.callbackTimestamp = null;
          },
        );
      }
    } else {
      // Animation hasn't ended, so just draw the next frame
      this.drawFrame();
      this.setState(
        (prev) => ({
          animTimestamp: prev.animTimestamp + currentFrame,
        }),
        this.reqFrame,
      );
    }
  };

  /**
   * Play button click handler
   */
  private onPlayButtonClick = () => {
    if (this.state.isPlaying) {
      this.setState(
        { isPlaying: false },
        () => {
          this.callbackTimestamp = null;
        },
      );
    } else {
      this.setState(
        { isPlaying: true },
        this.reqFrame,
      );
    }
  };

  /**
   * Reset button click handler
   */
  private onResetButtonClick = () => {
    this.setState(
      { animTimestamp: 0 },
      () => {
        if (this.state.isPlaying) {
          // Force stop
          this.onPlayButtonClick();
        }

        this.drawFrame();
      },
    );
  };

  /**
   * Slider value change handler
   * @param newValue New value of the slider
   */
  private onTimeSliderChange = (newValue: number) => {
    this.callbackTimestamp = null;
    this.setState(
      (prev) => ({
        wasPlaying: prev.isPlaying,
        isPlaying: false,
        animTimestamp: newValue,
      }),
      this.drawFrame,
    );
  };

  /**
   * Handler triggered when the slider is clicked off
   */
  private onTimeSliderRelease = () => {
    this.setState(
      (prev) => ({
        isPlaying: prev.wasPlaying,
      }),
      () => {
        if (!this.state.isPlaying) {
          this.callbackTimestamp = null;
        } else {
          this.reqFrame();
        }
      },
    );
  };

  private onAngleSliderChange = (newAngle: number) => {
    this.setState(
      {
        displayAngle: newAngle,
      },
      () => {
        this.props.animation.angle = newAngle;
        if (this.state.isPlaying) this.reqFrame();
        else this.drawFrame();
      },
    );
  };

  /**
   * Auto loop switch onChange callback
   */
  private onSwitchChange = () => {
    this.setState((prev) => ({
      isAutoLooping: !prev.isAutoLooping,
    }));
  };

  public componentDidMount() {
    this.drawFrame();
  }

  public render() {
    return <div
      style={{
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: BP_TAB_BUTTON_MARGIN,

            width: '100%',
            maxWidth: CANVAS_MAX_WIDTH,

            paddingTop: BP_TEXT_MARGIN,
            paddingBottom: BP_TEXT_MARGIN,
          }}
        >
          <PlayButton
            isPlaying={ this.state.isPlaying }
            onClickCallback={ this.onPlayButtonClick }
          />
          <Tooltip2
            content="Reset"
            placement="top"
          >
            <Button onClick={ this.onResetButtonClick }>
              <Icon icon={ IconNames.RESET } />
            </Button>
          </Tooltip2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: BP_TEXT_MARGIN,

              width: '100%',
            }}
          >
            <Slider
              value={ this.state.animTimestamp }
              min={ 0 }
              max={ this.animationDuration }
              stepSize={ 1 }

              labelRenderer={ false }

              onChange={ this.onTimeSliderChange }
              onRelease={ this.onTimeSliderRelease }
            />
            <Tooltip2
              content="Display Angle"
              placement="top"
            >
              <Slider
                value={ this.state.displayAngle }
                min={ 0 }
                max={ 2 * Math.PI }
                stepSize={ 0.01 }

                labelRenderer={ false }

                onChange={ this.onAngleSliderChange }
              />
            </Tooltip2>
          </div>
          <AutoLoopSwitch
            isAutoLooping={ this.state.isAutoLooping }
            onChangeCallback={ this.onSwitchChange }
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <WebGLCanvas
          ref={(r) => {
            this.canvas = r;
          }}
        />
      </div>
    </div>;
  }
}