var Component = function(template, props, elem) {
  this.elem = elem;
  this.state = props;
  this.template = template;
};

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
  render: function() {
    if (!this.elem) return;
    this.elem.innerHTML = typeof this.template === 'function' ? this.template() : this.template;
  }
};
