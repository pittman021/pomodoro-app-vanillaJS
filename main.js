'use strict';

function editTime(time) {
  if (time < 10) {
    return `0${time}`;
  } else {
    return time;
  }
}

var utils = {
  showModal: function() {
    var config = pommzClock.state.config;
    var modalDiv = document.querySelector('#modal');
    modalDiv.innerHTML = modal(config, true);
  },
  hideModal: function() {
    var modal = document.querySelector('.modal');
    modal.setAttribute('class', 'modal');
  }
};

var modal = function(props, isActive) {
  var activeClass = isActive === true ? 'is-active' : '';
  var duration = (props.duration / 1000 / 60) % 60;
  var isBreak = (props.break / 1000 / 60) % 60;

  return `
  <div class="modal ${activeClass}">
    <div class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <h2>Settings</h2>
        <form onSubmit=pommzClock.changeSettings(event)>
          <div class="field">
            <label class="label">Duration</label>
            <div class="control">
              <input class="input" value='${duration}' name="duration" type="number" placeholder='${duration} minutes'>
            </div>
          </div>
          <div class="field">
            <label class="label">Break</label>
            <div class="control">
              <input class="input" value='${isBreak}' type="number" name="break" placeholder='${isBreak} minutes'>
            </div>
          </div>
            <input class="button" type="submit" value="Save">
          </div>
        </form>
      </div>
      <button onClick=utils.hideModal() class="modal-close is-large" aria-label="close"></button>
  </div>`;
};

var Config = function() {
  return `<div>
      <i onClick=utils.showModal() class="config-gear fas fa-cog"></i>
      `;
};

// Make public methods available on each module
// Call those public methods on each module to keep them in sync

// what is this??
var stats = (function() {
  var state = {};
  var elem = document.querySelector('#stats');
  var template = function() {
    return `<span>${state.Completed}</span>`;
  };

  // global render function. takes template literal and element and sets innerHTML.
  function render(template, elem) {
    if (!elem) return;
    elem.innerHTML = typeof template === 'function' ? template() : template;
  }

  // global setState function.
  // call this to update state and call render function.
  function setState(props, cb) {
    // Shallow merge new properties into state object
    for (var key in props) {
      if (props.hasOwnProperty(key)) {
        state[key] = props[key];
      }
    }

    // Render the element
    render(template, elem, cb);

    // Return the elem for use elsewhere
    return elem;
  }

  // grab tasks from localstorage and set closedTasks counter
  // return function
  function getInitialState() {
    var tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    var closedTasks = 0;

    tasks.forEach(function(task) {
      if (task.status === 'Closed') {
        closedTasks++;
      }
    });

    setState({
      Completed: closedTasks
    });
  }

  // evoke initial state function to kick-start project.
  getInitialState();

  return {
    getInitialState: getInitialState
  };
})();

var header = (function() {
  var elem = document.querySelector('#header');

  function Home() {}

  function render(template, elem) {
    if (!elem) return;
    elem.innerHTML = typeof template === 'function' ? template() : template;
  }
  var template = function() {
    return `<div>
      <span onClick=header.Home();>Home</span>
      <span>About</span>
      <span>Stats</span>`;
  };

  render(template, elem);

  return {
    Home: Home
  };
})();

// Actual Pomodoro Timer containing button controls and config.
var pommzClock = (function() {
  // App state & vars //
  var state = {};
  var elem = document.querySelector('#clock');
  var startButton = function() {
    return `<i onclick=pommzClock.startClock() class="fas fa-play small"></i>`;
  };
  var pauseButton = function() {
    return `<i onClick=pommzClock.pauseClock(event) id="pause" class="fas fa-pause"></i>`;
  };
  var stopButton = function() {
    return `<i onClick=pommzClock.stopClock(event) class="fas fa-stop"></i>`;
  };
  var template = function() {
    const seconds = editTime(Math.floor((state.remaining / 1000) % 60).toString());
    const minutes = editTime(Math.floor((state.remaining / 1000 / 60) % 60).toString());

    return `
        <div class="timer">
          <div class="timer-time">
            <span class="minutes">${minutes}</span>:
            <span class="seconds">${seconds}</span>
          </div>
          <div class="timer-control">
            ${renderClockButtons()}
            ${Config()}
          </div>
        </div>
        `;
  };

  // Initialize state!
  getInitialState();

  //
  // Render Method
  //
  function render(template, elem) {
    if (!elem) return;
    elem.innerHTML = typeof template === 'function' ? template() : template;
  }

  function setState(props, cb) {
    // Shallow merge new properties into state object
    for (var key in props) {
      if (props.hasOwnProperty(key)) {
        state[key] = props[key];
      }
    }

    // Render the element
    render(template, elem, cb);

    // Return the elem for use elsewhere
    return elem;
  }

  //
  // Get Initial App State //
  function getInitialState() {
    // Default pomodoro duration & break duration settings //
    const defaultConfig = { duration: 1000 * 60 * 25, break: 1000 * 60 * 5 };
    // Cached settings from localStorage //
    const cachedConfig = JSON.parse(localStorage.getItem('config'));
    // checking for one or the other config options //
    const config = !cachedConfig ? defaultConfig : cachedConfig;

    const remaining = config.duration;

    // creating initial state object with settings //
    const state = {
      config: config,
      isBreak: false,
      isOn: false,
      remaining: remaining,
      intervalId: ''
    };

    setState(state);
  }

  function changeSettings(props) {
    // Input values from settings changes
    const duration = event.target.elements.duration.value;
    const breakTime = event.target.elements.break.value;

    const obj = {
      duration: duration * 1000 * 60,
      break: breakTime * 1000 * 60
    };

    setState({
      config: obj
    });
    localStorage.setItem('config', JSON.stringify(obj));
  }

  // Plays alarm when pomodoro ends //
  function playMusic() {
    const music = document.querySelector('#music');
    music.play();
  }

  // Starts the pomodoro clock when play is pressed //
  function startClock() {
    // Check whether the clock is already running
    if (state.intervalId) return;

    // get the time remaining. use duration if remaining is not set
    const timeRemaining = state.remaining > 0 ? state.remaining : state.config.duration;
    // get time the clock was started or resumed
    const startTime = new Date();
    // get the new endtime.
    const endTime = startTime.getTime() + timeRemaining;

    ticker(endTime);
  }

  function endClock() {
    // Utility function to get a new day //
    function getDay(date) {
      return Math.floor(Date.parse(date) / (1000 * 24 * 24 * 60));
    }

    // if it is a break, restart completely //
    if (state.isBreak) {
      // Clear timer intervalId
      clearInterval(state.intervalId);

      // Restart timer completely
      stopClock();
    } else {
      // clear timer interval //
      clearInterval(state.intervalId);
      // play ending sound //
      playMusic();

      // refresh clock //
      setState({
        isOn: false,
        isBreak: true,
        remaining: state.config.break,
        intervalId: ''
      });
      document.title = `Pommz - Break Time`;
    }
  }

  function ticker(endTime) {
    // Update state every second
    const intervalId = setInterval(() => {
      // Find time remaining by taking static end time minus current time
      const remaining = endTime - Date.parse(new Date());

      // If there is time remaining
      if (remaining < 0) {
        // End the timer if there
        endClock();
      } else {
        const minutes = editTime(Math.floor((remaining / 1000 / 60) % 60).toString());
        const seconds = editTime(Math.floor((remaining / 1000) % 60).toString());
        document.title = `Pommz - ${minutes}:${seconds}`;
        setState({
          remaining: remaining,
          isOn: true,
          intervalId: intervalId
        });
      }
    }, 1000);
  }

  // Timer Controls //
  function renderClockButtons() {
    // check if timer is off. if so, return start & stop button.
    if (!state.isOn) return `${startButton()} ${stopButton()}`;
    else
      // if timer if on. return start & pause button //
      return `${startButton()} ${pauseButton()}`;
  }

  function stopClock() {
    const duration = state.config.duration;
    const minutes = Math.floor((duration / 1000 / 60) % 60).toString();
    const seconds = Math.floor((duration / 1000) % 60).toString();
    clearInterval(state.intervalId);
    setState({
      isOn: false,
      remaining: duration,
      intervalId: null
    });
    document.title = `Pommz - Start Clock`;
  }

  function pauseClock() {
    clearInterval(state.intervalId);
    const remaining = state.endTime - Date.parse(new Date());
    setState({
      duration: remaining,
      intervalId: null,
      isOn: false
    });
  }

  // Templates //
  return {
    startClock,
    stopClock,
    pauseClock,
    changeSettings,
    state
  };
})();

///
/// To Do List Component
///

var todoList = (function() {
  // module variables //
  var state = {};
  var elem = document.querySelector('#todo');
  var template = function() {
    return `<div class="todo">
               ${input()}
               ${tagList()}
               ${taskList()}
               ${clearAllLink()}
    </div>`;
  };

  var clearAllLink = function() {
    const clearLink =
      state.taskView === 'closed'
        ? `<div class='clear-all'>
                <a onClick=todoList.clearAll()>Clear All</a>
               </div>`
        : '';
    return clearLink;
  };

  var tagList = function() {
    var stateTags = state.tagView;
    var renderTags = function(stateTags) {
      var tags = stateTags.map(tag).join('');
      return `${tags}`;
    };
    return `<div class="tags">
            ${renderTags(stateTags)}
            </div>`;
  };

  var tag = function(props) {
    const color = props.isActive === true ? props.color : '#a7a7a7';
    return `<span
                style="background-color:${color}"
                id=${props.tag} onClick=todoList.changeTagView(event)
                class="tag">
                  ${props.tag}
                </span>`;
  };

  var input = function(props) {
    return `
	    <form class="todo-input" onsubmit="todoList.addTask(event)">
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
  </form>`;
  };

  var taskList = function() {
    const isActive = state.taskView;
    var tasks = renderTasks();
    var renderTaskItems = function(props) {
      var tasks = props.map(taskItem).join('');
      return `${tasks}`;
    };
    return `
          <div class="open-task-list">
            <nav class="panel">
              <p class="panel-tabs">
                <a class=${isActive === 'open' ? 'tab-active' : null} onClick=todoList.changeTaskView(event) id="open">Open</a>
                <a class=${isActive === 'closed' ? 'tab-active' : null} onClick=todoList.changeTaskView(event) id="closed">Closed</a>
                <a class=${isActive === 'all' ? 'tab-active' : null} onClick=todoList.changeTaskView(event) id="all">All</a>
              </p>
              ${renderTaskItems(tasks)}
            </nav>
          </div>`;
  };

  var taskItem = function(props) {
    const type = props.status;

    const status = props.status === 'Open' ? `<span class="tag is-primary">Open</span>` : `<span class="tag is-danger">Done</span>`;
    const action =
      props.status === 'Closed'
        ? `<a onClick=todoList.openTask(${props._id})>
                <i class="fas fa-undo"></i>
              </a>
              <a onClick=todoList.removeTask(${props._id},'${props.tag}')>
                <i class="fas fa-trash-alt"></i>
              </a>`
        : `<a onClick=todoList.closeTask(${props._id})><i class="fas fa-check"></i></a>
                 <a onClick=todoList.removeTask(${props._id},'${props.tag}')><i class="fas fa-trash-alt"></i></a>`;

    return `<div class="panel-block task-item">
                			<div class="pull-left">
                        ${status}
                				<span>${props.title}</span>
                			</div>
                			<div class="pull-right">
                				${action}
                			</div>
                		</div>`;
  };

  function getInitialState() {
    setState({
      tasks: JSON.parse(localStorage.getItem('tasks')) || [],
      taskView: 'open',
      tagView: JSON.parse(localStorage.getItem('tagView')) || []
    });
  }

  getInitialState();

  //
  // Render Method
  //
  function render(template, elem) {
    if (!elem) return;
    elem.innerHTML = typeof template === 'function' ? template() : template;
  }

  function setState(props, cb) {
    // Shallow merge new properties into state object
    for (var key in props) {
      if (props.hasOwnProperty(key)) {
        state[key] = props[key];
      }
    }

    // Render the element
    render(template, elem, cb);

    // Return the elem for use elsewhere
    return elem;
  }

  function renderTasks() {
    const tagFilter = [];

    // Check actively selected tasks. For each one find all tasks matching it
    state.tagView.forEach(view => {
      // check if the tag is active. If not, return.
      if (view.isActive !== true) return;
      else
        // For an active tag, find tasks with matching tag & add to array
        state.tasks.forEach(task => {
          if (view.tag === task.tag) tagFilter.push(task);
        });
    });

    // Return all tasks
    if (state.taskView === 'all') return tagFilter;

    // Return all open tasks
    if (state.taskView === 'open')
      return tagFilter.filter(task => {
        return task['status'] !== 'Closed';
      });

    // Return all closed tasks
    if (state.taskView === 'closed')
      return tagFilter.filter(task => {
        return task['status'] !== 'Open';
      });
  }

  function changeTaskView(event) {
    const taskId = event.target.id;
    setState({
      taskView: taskId
    });
  }

  function openTask(task) {
    // Cache state & find index of task
    const newState = state.tasks;
    const index = newState.findIndex(existingTask => {
      return existingTask['_id'] === task;
    });

    // change task status
    newState[index].status = 'Open';

    // set new task state
    setState({
      tasks: newState,
      taskView: 'open'
    });
    // save locally
    localStorage.setItem('tasks', JSON.stringify(newState));
  }

  function closeTask(task) {
    // cache state find task index
    const newState = state.tasks;
    const index = newState.findIndex(existingTask => {
      return existingTask['_id'] === task;
    });
    newState[index].status = 'Closed';
    newState[index].completed = new Date();

    setState({
      tasks: newState
    });
    localStorage.setItem('tasks', JSON.stringify(newState));
    stats.getInitialState();
  }

  function addTask(event) {
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
    const tasks = state.tasks;
    const tagView = state.tagView;
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

    setState({
      tasks: tasks,
      taskView: 'open',
      tagView: tagView
    });

    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('tagView', JSON.stringify(tagView));
  }

  function clearAll() {
    // cached state & filtering closed tasks
    const taskState = state.tasks;
    const newState = taskState.filter(function(existingTask) {
      return existingTask.status != 'Closed';
    });

    setState({
      tasks: newState,
      taskView: 'open'
    });
    localStorage.setItem('tasks', JSON.stringify(newState));
  }

  function changeTagView(event) {
    // tag item & cached tag state
    const item = event.target.id;
    const tagState = state.tagView;

    // Search for clicked tag. Once found reverse state
    tagState.forEach(obj => {
      if (obj.tag != item) return;
      else obj.isActive = !obj.isActive;
    });

    setState({
      tagView: tagState
    });

    localStorage.setItem('tagView', JSON.stringify(tagState));
  }

  function removeTask(task, tag) {
    const taskState = state.tasks;
    let tagState = state.tagView;

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

    setState({
      tasks: newTaskState,
      tagView: tagState
    });
    localStorage.setItem('tasks', JSON.stringify(newTaskState));
    localStorage.setItem('tagView', JSON.stringify(tagState));
  }

  return {
    openTask,
    closeTask,
    removeTask,
    addTask,
    changeTagView,
    changeTaskView,
    clearAll
  };
})();
