var render = function(template, elem) {
  if (!elem) return;
  elem.innerHTML = typeof template === 'function' ? template() : template;
};

// Component Class  //
var Component = function(template, props, elem) {
  this.elem = elem;
  this.state = props;
  this.template = template;
};

// Component prototype methods //
Component.prototype = {
  constructor: Component,
  setState: function(props, cb) {
    // Shallow merge new properties into state object
    for (var key in props) {
      if (props.hasOwnProperty(key)) {
        this.state[key] = props[key];
      }
    }

    // Render the element
    this.render(this.template, this.elem, cb);

    // Return the elem for use elsewhere
    return this.elem;
  },
  //
  render: function() {
    if (!this.elem) return;
    this.elem.innerHTML = typeof this.template === 'function' ? this.template() : this.template;
  }
};

// Retrieves initial app state
var getInitialState = function() {
  // Default pomodoro duration & break duration settings //
  const defaultConfig = { duration: 1000 * 60 * 25, break: 1000 * 60 * 5 };
  // Cached settings from localStorage //
  const cachedConfig = JSON.parse(localStorage.getItem('config'));
  // checking for one or the other config options //
  const config = !cachedConfig ? defaultConfig : cachedConfig;

  // creating initial state object with settings //
  const state = {
    config: config,
    isBreak: false,
    isOn: false,
    remaining: config.duration,
    intervalId: ''
  };

  return state;
};

//# Stateless Templates
//##
//####

var startButton = function() {
  return `<i onclick=Clock.startClock() class="fas fa-play small"></i>`;
};

var pauseButton = function() {
  return `<i onClick=Clock.pauseClock(event) id="pause" class="fas fa-pause"></i>`;
};

var stopButton = function() {
  return `<i onClick=Clock.stopClock(event) class="fas fa-stop"></i>`;
};

var input = function(props) {
  return `
  		<form class="todo-input" onsubmit="ToDoList.addTask(event)">
            <input name="tagname" id="tag-input" placeholder="Tag" class="input is-large" />
            <span>
  	        <input
              id="task-input"
  	          placeholder="Add A Task"
  	          name="taskname"
  	          class="input is-large"
  	        />
            <input style="display:none" type="submit"></input>
          </span>
  	  </form>

      `;
};

function taskList(props) {
  const isActive = ToDoList.state.taskView;

  this.renderTasks = function(props) {
    var tasks = props.map(taskItem).join('');
    return `${tasks}`;
  };
  return `
    <div class="open-task-list">
      <nav class="panel">
        <p class="panel-tabs">
          <a class=${isActive === 'open' ? 'tab-active' : null} onClick=ToDoList.changeTaskView(event) id="open">Open</a>
          <a class=${isActive === 'closed' ? 'tab-active' : null} onClick=ToDoList.changeTaskView(event) id="closed">Closed</a>
          <a class=${isActive === 'all' ? 'tab-active' : null} onClick=ToDoList.changeTaskView(event) id="all">All</a>
        </p>
        ${this.renderTasks(props)}
      </nav>
    </div>`;
}

function taskItem(props) {
  const type = props.status;
  const status = props.status === 'Open' ? `<span class="tag is-primary">Open</span>` : `<span class="tag is-danger">Done</span>`;
  const action =
    props.status === 'Closed'
      ? `<a onClick=ToDoList.openTask(${props._id})><i class="fas fa-undo"></i></a>
           <a onClick=ToDoList.removeTask(${props._id},'${props.tag}')><i class="fas fa-trash-alt"></i></a>`
      : `<a onClick=ToDoList.closeTask(${props._id})><i class="fas fa-check"></i></a>
           <a onClick=ToDoList.removeTask(${props._id},'${props.tag}')><i class="fas fa-trash-alt"></i></a>`;

  return `<div class="panel-block">
          			<div class="pull-left">
                  ${status}
          				<span>${props.title}</span>
          			</div>
          			<div class="pull-right">
          				${action}
          			</div>
          		</div>`;
}

function clearAll(taskView) {
  const clearLink =
    taskView === 'closed'
      ? `<div class='clear-all'>
          <a onClick=ToDoList.clearAll()>Clear All</a>
         </div>`
      : '';
  return clearLink;
}

function tagList(props) {
  this.renderTags = function(props) {
    var tags = props.map(tag).join('');
    return `${tags}`;
  };
  return `<div class="tags">
      ${this.renderTags(props)}
      </div>`;
}

function tag(props) {
  const color = props.isActive === true ? props.color : '#a7a7a7';
  return `<span
              style="background-color:${color}"
              id=${props.tag} onClick=ToDoList.changeTagView(event)
              class="tag">
                ${props.tag}
              </span>`;
}

//
// Components
//


// Configuration Modal template //
var modal = function(props) {
  // Setting up initial settings from state object //
  const duration = props.config.duration / 60 / 1000;
  const isBreak = props.config.break / 60 / 1000;
  const divClass = Clock.state.modalIsActive === true ? 'is-active' : '';
  return `
    <div class="modal ${divClass}">
      <div class="modal-background"></div>
        <div class="modal-content">
          <div class="box">
            <h2>Settings</h2>

          <form onSubmit=Clock.changeSettings(event)>
            <div class="field">
              <label class="label">Duration</label>
              <div class="control">
                <input class="input" name="duration" type="number" placeholder=${duration}>
              </div>
            </div>

            <div class="field">
              <label class="label">Break</label>
              <div class="control">
                <input class="input" type="number" name="break" placeholder=${isBreak}>
              </div>
            </div>
              <input class="button" type="submit" value="Save">
            </div>

          </form>
        </div>
        <button onClick=Clock.toggleView() class="modal-close is-large" aria-label="close"></button>
    </div>`;
};

var Config = function(props) {
  // Takes state props & passes to modal for updating
  return `<div>
      <i onClick=Clock.toggleView() class="config-gear fas fa-cog"></i>
      ${modal(props)}
      `;
};

// Clock Component //
var Clock = new Component(
  function(props) {
    // Need to remove this to a higher component state //
    this.toggleView = function() {
      this.setState({
        modalIsActive: !this.state.modalIsActive
      });
    };

    // Changes clock configuration //
    this.changeSettings = function(props) {
      // Input values from settings changes
      const duration = event.target.elements.duration.value;
      const breakTime = event.target.elements.break.value;

      const obj = {
        duration: duration * 1000 * 60,
        break: breakTime * 1000 * 60
      };

      this.setState({
        config: obj
      });
      localStorage.setItem('config', JSON.stringify(obj));
    };

    // Plays alarm when pomodoro ends //
    this.playMusic = function() {
      const music = document.querySelector('#music');
      music.play();
    };

    // Starts the pomodoro clock when play is pressed //
    this.startClock = function() {
      // Check whether the clock is already running
      if (this.state.intervalId) return;

      // get the time remaining. use duration if remaining is not set
      const timeRemaining = Clock.state.remaining > 0 ? Clock.state.remaining : Clock.state.config.duration;
      // get time the clock was started or resumed
      const startTime = new Date();
      // get the new endtime.
      const endTime = startTime.getTime() + timeRemaining;

      this.ticker(endTime);
    };

    this.endClock = function() {
      // Utility function to get a new day //
      function getDay(date) {
        return Math.floor(Date.parse(date) / (1000 * 24 * 24 * 60));
      }

      if (this.state.isBreak) {
        // Clear timer intervalId
        clearInterval(this.state.intervalId);

        // Restart timer completely
        this.setState({
          isOn: false,
          remaining: 0,
          intervalId: '',
          modalIsAcive: false
        });
      } else {
        // Check whether clock is starting from scratch
        // play ending sound //
        this.playMusic();

        // clear the timer interval  //
        clearInterval(this.state.intervalId);

        // Change the remaining time to break
        // Set break to true
        // Reset clear IntervalId
        this.setState({
          remaining: this.state.config.break,
          isBreak: true,
          intervalId: null
        });
      }
    };

    this.ticker = function(endTime) {
      // Update state every second
      const intervalId = setInterval(() => {
        // Find time remaining by taking static end time minus current time
        const remaining = endTime - Date.parse(new Date());

        // If there is time remaining
        if (remaining < 0) {
          // End the timer if there
          this.endClock();
        } else {
          const minutes = Math.floor((remaining / 1000 / 60) % 60).toString();
          const seconds = Math.floor((remaining / 1000) % 60).toString();
          document.title = `Pommz - ${minutes}:${seconds}`;
          Clock.setState({
            remaining: remaining,
            isOn: true,
            intervalId: intervalId
          });
        }
      }, 1000);
    };

    this.renderClockButtons = function() {
      // check if timer is off. if so, return start & stop button.
      if (!this.state.isOn) return `${startButton()} ${stopButton()}`;
      else
        // if timer if on. return start & pause button //
        return `${startButton()} ${pauseButton()}`;
    };

    this.stopClock = function() {
      const duration = this.state.config.duration;
      const minutes = Math.floor((duration / 1000 / 60) % 60).toString();
      const seconds = Math.floor((duration / 1000) % 60).toString();
      clearInterval(this.state.intervalId);
      this.setState({
        isOn: false,
        remaining: 0,
        intervalId: null
      });
      document.title = `${minutes} + ':' + ${seconds}`;
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

    return `
      <nav class="navbar is-fixed-top">
      <div class="timer">
        <div class="timer-time">
          <span class="minutes">${Math.floor((this.state.remaining / 1000 / 60) % 60).toString()}</span>:
          <span class="seconds">${Math.floor((this.state.remaining / 1000) % 60).toString()}</span>
        </div>
        <div class="timer-control">
          ${this.renderClockButtons()}
        </div>

      </div>
      </nav>
      `;
  },
  getInitialState(),
  document.querySelector('#clock')
);

var ToDoList = new Component(
  function() {
    this.renderTasks = function() {
      var that = this;
      const tagFilter = [];

      // Check actively selected tasks. For each one find all tasks matching it
      this.state.tagView.forEach(view => {
        // check if the tag is active. If not, return.
        if (view.isActive !== true) return;
        else
          // For an active tag, find tasks with matching tag & add to array
          that.state.tasks.forEach(task => {
            if (view.tag === task.tag) tagFilter.push(task);
          });
      });

      // Return all tasks
      if (this.state.taskView === 'all') return tagFilter;

      // Return all open tasks
      if (this.state.taskView === 'open')
        return tagFilter.filter(task => {
          return task['status'] !== 'Closed';
        });

      // Return all closed tasks
      if (this.state.taskView === 'closed')
        return tagFilter.filter(task => {
          return task['status'] !== 'Open';
        });
    };

    this.changeTaskView = function(event) {
      const taskId = event.target.id;
      this.setState({
        taskView: taskId
      });
    };

    this.openTask = function(task) {
      // Cache state & find index of task
      const state = this.state.tasks;
      const index = state.findIndex(existingTask => {
        return existingTask['_id'] === task;
      });

      // change task status
      state[index].status = 'Open';

      // set new task state
      this.setState({
        tasks: state,
        taskView: 'open'
      });
      // save locally
      localStorage.setItem('tasks', JSON.stringify(state));
    };

    this.closeTask = function(task) {
      // cache state find task index
      const state = this.state.tasks;
      const index = state.findIndex(existingTask => {
        return existingTask['_id'] === task;
      });
      state[index].status = 'Closed';
      state[index].completed = new Date();

      this.setState({
        tasks: state
      });
      localStorage.setItem('tasks', JSON.stringify(state));
    };

    this.addTask = function(event) {
      event.preventDefault();
      const colors = [
        '#C13D31',
        '#AAFAC2',
        '#218C8D',
        '#6CCECB',
        '#C3E8CF',
        '#F9E559',
        '#8EDC9D',
        '#E3C990',
        '#A64D3C',
        '#91F1CC',
        '#FAFAFA',
        '#1DF3FD',
        '#FF8400',
        '#168A8E',
        '#1EE3E3',
        '#750808',
        '#FFEF41',
        '#133A44',
        '#FF7C03',
        '#191231'
      ];

      const task = event.target.elements.taskname.value;
      const tag = event.target.elements.tagname.value;

      const tasks = ToDoList.state.tasks;
      const tagView = ToDoList.state.tagView;
      const id = Date.now();

      const newTask = {
        _id: id,
        title: task,
        status: 'Open',
        created: new Date(),
        tag: tag,
        completed: false
      };
      tasks.push(newTask);

      // check for a new tag. May want to refactor this... //
      const index = tagView
        .map(function(e) {
          return e.tag;
        })
        .indexOf(tag);

      // if it exists, get a color & create tag //
      if (index === -1) {
        const number = Math.floor(Math.random() * 20);
        tagView.push({
          tag: tag,
          isActive: true,
          color: colors[number],
          tasks: [id]
        });
      } else {
        tagView[index].tasks.push(id);
      }

      ToDoList.setState({
        tasks: tasks,
        taskView: 'open',
        tagView: tagView
      });

      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('tagView', JSON.stringify(tagView));
    };

    this.clearAll = function() {
      // cached state & filtering closed tasks
      const state = ToDoList.state.tasks;
      const newState = state.filter(function(existingTask) {
        return existingTask.status != 'Closed';
      });

      ToDoList.setState({
        tasks: newState,
        taskView: 'open'
      });
      localStorage.setItem('tasks', JSON.stringify(newState));
    };

    this.changeTagView = function(event) {
      // tag item & cached tag state
      const item = event.target.id;
      const tagState = this.state.tagView;

      // Search for clicked tag. Once found reverse state
      tagState.forEach(obj => {
        if (obj.tag != item) return;
        else obj.isActive = !obj.isActive;
      });

      this.setState({
        tagView: tagState
      });

      localStorage.setItem('tagView', JSON.stringify(tagState));
    };

    this.removeTask = function(task, tag) {
      const taskState = ToDoList.state.tasks;
      let tagState = ToDoList.state.tagView;

      // remove the task. simple. //
      const newTaskState = taskState.filter(function(existingTask) {
        return existingTask['_id'] !== task;
      });

      // remove the task from the tag and remove it if theres no other tasks //

      // get the index of the tag //
      const tagIndex = tagState
        .map(function(e) {
          return e.tag;
        })
        .indexOf(tag);

      const taskIndex = tagState[tagIndex].tasks
        .map(function(e) {
          return e;
        })
        .indexOf(task);

      // if theres only 1 task on the tag, remove the tag entirely //
      const tagTasks = tagState[tagIndex].tasks.length;

      if (tagTasks === 1) {
        tagState = tagState.filter(function(e) {
          return e.tag !== tag;
        });
      } else {
        tagState[tagIndex].tasks.splice(taskIndex, 1);
      }

      ToDoList.setState({
        tasks: newTaskState,
        tagView: tagState
      });
      localStorage.setItem('tasks', JSON.stringify(newTaskState));
      localStorage.setItem('tagView', JSON.stringify(tagState));
    };

    return `<div class="todo">

  		${input()}
      ${tagList(this.state.tagView)}
  		${taskList(this.renderTasks())}
      ${clearAll(this.state.taskView)}
  		</div>`;
  },
  {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    taskView: 'open',
    tagView: JSON.parse(localStorage.getItem('tagView')) || []
  },
  document.querySelector('#todo')
);

Clock.render();
ToDoList.render();
