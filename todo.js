// TEMPATES //

var ToDoList = new Component(
  function() {
    this.getInitialState = function() {
      return JSON.parse(localStorage.getItem('tasks')) || '';
    };

    this.renderTasks = function() {
      if (this.state.taskView === 'all') {
        return this.state.tasks;
      }
      if (this.state.taskView === 'open') {
        return this.state.tasks.filter(function(task) {
          return task['status'] !== 'Closed';
        });
      }
      if (this.state.taskView === 'closed') {
        return this.state.tasks.filter(function(task) {
          return task['status'] !== 'Open';
        });
      }
    };

    this.changeTaskView = function(event) {
      const taskId = event.target.id;
      this.setState({
        taskView: taskId
      });
    };

    this.openTask = function(task) {
      const state = this.state.tasks;
      const index = state.findIndex(function(existingTask) {
        return existingTask['_id'] === task;
      });

      state[index].status = 'Open';
      this.setState({
        tasks: state,
        taskView: 'open'
      });
      localStorage.setItem('tasks', JSON.stringify(state));
    };

    this.closeTask = function(task) {
      const state = this.state.tasks;
      const index = state.findIndex(function(existingTask) {
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
      const task = event.target.elements.taskname.value;
      const tasks = ToDoList.state.tasks;
      const id = Date.now();
      const newTask = {
        _id: id,
        title: task,
        status: 'Open',
        created: new Date(),
        completed: null
      };
      tasks.push(newTask);
      ToDoList.setState({
        tasks: tasks,
        taskView: 'open'
      });
      localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    this.clearAll = function() {
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

    this.removeTask = function(task) {
      const state = ToDoList.state.tasks;

      const newState = state.filter(function(existingTask) {
        return existingTask['_id'] !== task;
      });
      ToDoList.setState({
        tasks: newState
      });
      localStorage.setItem('tasks', JSON.stringify(newState));
    };

    return `<div class="todo">
		${input()}
		${taskList(this.renderTasks())}
    ${clearAll(this.state.taskView)}
		</div>`;
  },
  {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    taskView: 'open',
    user: ''
  },
  document.querySelector('#todo')
);

var input = function(props) {
  return `
		<form class="is-gapless field is-horizontal" onSubmit=ToDoList.addTask(event)>
	    <div class="column">
	      <p class="field-body">
	        <input
	          placeholder="Add A Task"
	          name="taskname"
	          class="input is-large"
	        />
	      </p>
	    </div>
	  </form>`;
};

function taskList(props) {
  this.renderTasks = function(props) {
    var tasks = props.map(taskItem).join('');
    return `<ul>${tasks}</ul>`;
  };
  return `
  <div class="open-task-list">
    <nav class="panel">
      <p class="panel-tabs">
        <a onClick=ToDoList.changeTaskView(event) id="open">Open</a>
        <a onClick=ToDoList.changeTaskView(event) id="closed">Closed</a>
        <a onClick=ToDoList.changeTaskView(event) id="all">All</a>
      </p>
      ${this.renderTasks(props)}
    </nav>
  </div>`;
}

function taskItem(props) {
  const type = props.status;
  const status = props.status === 'Open' ? `<span class="tag is-success">Open</span>` : `<span class="tag is-danger">Done</span>`;
  const action =
    props.status === 'Closed'
      ? `<a onClick=ToDoList.openTask(${props._id})><i class="fas fa-undo"></i></a>
         <a onClick=ToDoList.removeTask(${props._id})><i class="fas fa-trash-alt"></i></a>`
      : `<a onClick=ToDoList.closeTask(${props._id})><i class="fas fa-check"></i></a>
         <a onClick=ToDoList.removeTask(${props._id})><i class="fas fa-trash-alt"></i></a>`;

  return `<div>
        		<div class="panel-block">
        			<div class="pull-left">
                ${status}
        				<span>${props.title}</span>
        			</div>
        			<div class="pull-right">
        				${action}
        			</div>
        		</div>
          </div>`;
}

function clearAll(taskView) {
  const clearLink =
    taskView === 'closed'
      ? `<div class='clear-all'>
  <a onClick=ToDoList.clearAll()>Clear All</a></div>`
      : '';
  return clearLink;
}

ToDoList.render();
