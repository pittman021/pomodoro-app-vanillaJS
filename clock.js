// clock templating //

// clock state //

var Clock = new Component(
  function(props) {
    this.startClock = function() {
      // get the time remaining. use duration if remaining is not set
      const timeRemaining = Clock.state.remaining > 0 ? Clock.state.remaining : Clock.state.duration;
      // get time the clock was started or resumed
      const startTime = new Date();
      // get the new endtime.
      const endTime = startTime.getTime() + timeRemaining;

      this.ticker(endTime);
    };

    this.endClock = function() {
      function getDay(date) {
        const day = Math.floor(Date.parse(date) / (1000 * 24 * 24 * 60));
        return day;
      }

      if (!this.state.isBreak) {
        // play ending sound //
        // this.playMusic();

        // clearInterval //
        clearInterval(this.state.intervalId);

        this.setState({
          minutes: 5,
          remaining: 1000 * 60 * 5,
          seconds: '00',
          break: true
        });
      } else {
        clearInterval(this.state.intervalId);
        this.setState({
          isOn: false,
          duration: 1000 * 60 * 25,
          remaining: 0,
          minutes: 25,
          seconds: '00',
          intervalId: ''
        });
      }
    };

    this.ticker = function(endTime) {
      const intervalId = setInterval(() => {
        const remaining = endTime - Date.parse(new Date());
        if (remaining >= 0) {
          const minutes = Math.floor((remaining / 1000 / 60) % 60).toString();
          const seconds = Math.floor((remaining / 1000) % 60).toString();
          document.title = `Pomz - ${minutes}:${seconds}`;
          Clock.setState({
            remaining: remaining,
            isOn: true,
            seconds: seconds.toString(),
            minutes: minutes.toString(),
            intervalId: intervalId
          });
        } else {
          this.endClock();
        }
      }, 1000);
    };

    this.renderClockButtons = function() {
      if (this.state.isOn === false) {
        `return <div>${addButton()}</div>`;
      } else {
        `return <div>${pauseButton()}</div>`;
      }
    };

    this.pauseClock = function() {
      clearInterval(Clock.state.intervalId);
      const remaining = Clock.state.endTime - Date.parse(new Date());
      this.setState({
        duration: remaining,
        intervalId: null,
        isOn: false
      });
    };

    return `<div class="timer column">
      <div class="timer-time">
        <span class="minutes">${this.state.minutes}</span>:
        <span class="seconds">${this.state.seconds}</span>
      <div>
      <div class="timer-control">
  			${!this.state.isOn ? startButton() : pauseButton()}
      </div>
    </div>`;
  },
  {
    isBreak: false,
    isOn: false,
    duration: 1000 * 60 * 25,
    remaining: 0,
    minutes: 25,
    seconds: '00',
    intervalId: ''
  },
  document.querySelector('#clock')
);

startButton = function() {
  return `<button class="button" onClick=Clock.startClock()>Start</button>`;
};

pauseButton = function() {
  return `<button class="button" onClick=Clock.pauseClock(event) id="pause">Pause</button`;
};

Clock.render();

// Event Listeners //
