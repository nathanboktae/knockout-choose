describe('knockout choose', function() {
  var testEl, fruits, colors, selected,
  testSetup = function(params, viewModel, innerHTML) {
    if (typeof params !== 'string') {
      innerHTML = viewModel
      viewModel = params
      params = 'options: options, selected: selected'
    }
    if (!viewModel) {
      viewModel = { options: fruits, selected: selected }
    }

    testEl = document.createElement('choose')
    testEl.setAttribute('params', params)
    testEl.innerHTML = innerHTML
    document.body.appendChild(testEl)
    ko.applyBindings(viewModel, testEl)
  },
  textNodesFor = function(selector) {
    return Array.prototype.map.call(testEl.querySelectorAll(selector), function(el) {
      return el.textContent.trim()
    })
  },
  attributesFor = function(selector, attr) {
    return Array.prototype.map.call(testEl.querySelectorAll(selector), function(el) {
      return el.getAttribute(attr)
    })
  }

  beforeEach(function() {
    selected = ko.observable()
    fruits = ko.observableArray([{
      name: 'Bob',
      age: 31,
      eyeColor: 'brown'
    }, {
      name: 'Jane',
      age: 25,
      eyeColor: 'blue'
    }, {
      name: 'Anne',
      age: 37,
      eyeColor: 'blue'
    }, {
      name: 'Dwane',
      age: 21,
      eyeColor: 'green'
    }, {
      name: 'Tom',
      age: 25,
      eyeColor: 'brown'
    }, {
      name: 'Tori',
      age: 27,
      eyeColor: 'brown'
    }])
    colors = ko.observableArray(['blue', 'brown', 'red'])
  })
  afterEach(function() {
    testEl && document.body.removeChild(testEl)
    testEl = null
  })

  it('should render and update the list of string options given an observableArray', function() {
    testSetup({ options: colors, selected: selected })
    textNodesFor('.choose-dropdown ul li').should.deep.equal(['blue', 'brown', 'red'])

    colors.push('pink')
    textNodesFor('.choose-dropdown ul li').should.deep.equal(['blue', 'brown', 'red', 'pink'])
  })

  xit('should render and update the list of string options when an observable is behind a property', function() {
    var viewModel = { selected: selected }
    
    Object.defineProperty(viewModel, 'options', {
      get: colors,
      set: colors,
      enumerable: true
    })
    testSetup(viewModel)
    textNodesFor('.choose-dropdown ul li').should.deep.equal(['blue', 'brown', 'red'])

    viewModel.options.push('pink')
    textNodesFor('.choose-dropdown ul li').should.deep.equal(['blue', 'brown', 'red', 'pink'])
  })

  it('should show a placeholder if there is no initial value', function() {
    testSetup({ selected: selected, options: colors })
    testEl.querySelector('.choose-match').textContent.should.equal('Choose...')
  })

  it('should show a user-defined placeholder if there is no initial value', function() {
    testSetup('options: options, selected: selected, placeholder: "Pick a color"')
    testEl.querySelector('.choose-match').textContent.should.equal('Pick a color')
  })

  it('should render the initial value', function() {
    selected('blue')
    testSetup({ selected: selected, options: colors })
    testEl.querySelector('.choose-match').textContent.should.equal('blue')
  })
})