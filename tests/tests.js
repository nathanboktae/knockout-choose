describe('knockout choose', function() {
  var testEl, matchEl, dropdown, multiple, clock,
  people, nameTemplates, colors, selected, jane, dwane,
  testSetup = function(params, viewModel, innerHTML) {
    if (typeof params !== 'string') {
      innerHTML = viewModel
      viewModel = params
      params = 'options: options, selected: selected'
    }
    if (!viewModel) {
      viewModel = { options: people, selected: selected }
    }
    if (multiple) {
      params += ', multiple: true'
      viewModel.names = function() {
        return selected().map(function(i) {
          return i.name
        }).join(', ')
      }
      viewModel.namesAndAges = function(s) {
        return s().map(function(i) {
          return i.name + ' - ' + i.age
        }).join(', ')
      }
    }

    testEl = document.createElement('choose')
    testEl.setAttribute('params', params)
    testEl.innerHTML = innerHTML
    document.body.appendChild(testEl)
    ko.applyBindings(viewModel, testEl)

    matchEl = testEl.querySelector('.choose-match')
    dropdown = testEl.querySelector('.choose-dropdown')
  },
  click = function(el) {
    var evt = document.createEvent('MouseEvents')
    evt.initEvent('click', true, true)
    if (typeof el === 'string') {
      el = document.querySelector(el)
    }
    el.dispatchEvent(evt)
  },
  type = function(el, chars) {
    var evt = document.createEvent('KeyboardEvent')
    evt.initEvent('keydown', true, true)
    if (typeof el === 'string') {
      el = document.querySelector(el)
    }
    el.value = chars
    el.dispatchEvent(evt)
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
    selected = multiple ? ko.observableArray() : ko.observable()
    jane = {
      name: 'Jane',
      age: 25,
      eyeColor: 'blue'
    }
    dwane = {
      name: 'Dwane',
      age: 21,
      eyeColor: 'green'
    }
    people = ko.observableArray([{
      name: 'Bob',
      age: 31,
      eyeColor: 'brown'
    }, jane, {
      name: 'Anne',
      age: 37,
      eyeColor: 'blue'
    }, dwane, {
      name: 'Tom',
      age: 25,
      eyeColor: 'brown'
    }, {
      name: 'Tori',
      age: 27,
      eyeColor: 'brown'
    }])
    colors = ko.observableArray(['blue', 'brown', 'red'])
    nameTemplates = '<choose-match><span data-bind="text: ' +
      (multiple ? "$root.names()" : 'name')
      + '"></span></choose-match>'

    nameTemplates += '<choose-item><span data-bind="text: name + \' - \' + age"></span></choose-item>'
  })
  afterEach(function() {
    testEl && document.body.removeChild(testEl)
    testEl = null
    clock && clock.restore()
  });

  [false, true].forEach(function(m) {
  describe(m ? 'multiple' : 'single', function() {
    before(function() {
      multiple = m
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
      matchEl.textContent.should.equal('Choose...')
    })

    it('should show a user-defined placeholder if there is no initial value', function() {
      testSetup('options: options, selected: selected, placeholder: "Pick a color"')
      matchEl.textContent.should.equal('Pick a color')
    })

    it('should render the initial value if one exists', function() {
      selected(multiple ? ['blue'] : 'blue')
      testSetup({ selected: selected, options: colors })
      matchEl.textContent.should.equal('blue')
    })

    !m && it('should update the value when the user chooses new scalar selections, updating dropdown classes', function() {
      testSetup({ selected: selected, options: colors })
      testEl.should.not.have.class('choose-dropdown-open')

      click(matchEl)
      testEl.should.have.class('choose-dropdown-open')

      click('.choose-dropdown li:nth-child(2)')
      selected().should.equal('brown')
      matchEl.textContent.should.equal('brown')
      testEl.should.have.class('choose-dropdown-open').and.class('choose-dropdown-closing')

      click(matchEl)
      click('.choose-dropdown li:nth-child(1)')
      selected().should.equal('blue')
      matchEl.textContent.should.equal('blue')
    })

    !m && it('should update the value to the property of selectProperty if specified', function() {
      testSetup('options: options, selected: selected, selectProperty: \'name\'', null,
        '<choose-match><span data-bind="text: $data ? $data.name + \' - \' + $data.age : \'nobody\'"></span></choose-match>\
        <choose-item><span data-bind="text: name + \' - \' + age"></span></choose-item>')
      click(matchEl)
      textNodesFor('.choose-dropdown ul li').slice(0,3).should.deep.equal(
        ['Bob - 31', 'Jane - 25', 'Anne - 37'])

      click('.choose-dropdown li:nth-child(2)')
      selected().should.equal('Jane')
      matchEl.textContent.should.equal('Jane - 25')

      click(matchEl)
      click('.choose-dropdown li:nth-child(1)')
      selected().should.equal('Bob')
      matchEl.textContent.should.equal('Bob - 31')
    })

    m && it('should update the value to an array of properties of selectProperty if specified', function() {
      testSetup('options: options, selected: selected, selectProperty: \'name\'', null,
        '<choose-match><span data-bind="text: $root.namesAndAges($component.selected)"></span></choose-match>\
        <choose-item><span data-bind="text: name + \' - \' + age"></span></choose-item>')
      click(matchEl)
      textNodesFor('.choose-dropdown ul li').slice(0,3).should.deep.equal(
        ['Bob - 31', 'Jane - 25', 'Anne - 37'])

      click('.choose-dropdown li:nth-child(2)')
      selected().should.deep.equal(['Jane'])
      matchEl.textContent.should.equal('Jane - 25')

      click('.choose-dropdown li:nth-child(1)')
      selected().should.deep.equal(['Jane', 'Bob'])
      matchEl.textContent.should.equal('Jane - 25, Bob - 31')
    })

    window.requestAnimationFrame && it('should remove dropdown open and closing classes after an animation ends', function(done) {
      try {
        document.styleSheets[0].insertRule(
        '@keyframes fade {\
          0% { opacity: 1; }\
          100% { opacity: 0; }\
        }', 1);
      } catch(e) {
        done() // some browser that doesn't support keyframes
        return
      }

      document.styleSheets[0].insertRule('.choose-dropdown-closing { color: blue; animation: fade 20ms linear; }', 1);
      testSetup({ selected: selected, options: colors })
      testEl.should.not.have.class('choose-dropdown-open')
      testEl.should.not.have.class('choose-dropdown-closing')

      click(matchEl)
      testEl.should.have.class('choose-dropdown-open')
      testEl.should.not.have.class('choose-dropdown-closing')

      click(matchEl)
      testEl.should.have.class('choose-dropdown-open').and.class('choose-dropdown-closing')
      setTimeout(function() {
        document.styleSheets[0].deleteRule(1)
        testEl.should.not.have.class('choose-dropdown-open')
        testEl.should.not.have.class('choose-dropdown-closing')
        done()
      }, 200)
    })

    it('should provide some default templates if none are specified', function() {
      selected(multiple ? [jane, dwane] : jane)
      testSetup()

      matchEl.textContent.should.equal(multiple ? '[object Object], [object Object]' : '[object Object]')
      click(matchEl)
      textNodesFor('.choose-dropdown ul li')[0].should.equal('[object Object]')
    })

    it('should render the item template for each option when provided', function() {
      selected(multiple ? [jane, dwane] : jane)
      testSetup(null, nameTemplates)

      matchEl.textContent.should.equal(multiple ? 'Jane, Dwane' : 'Jane')
      click(matchEl)
      textNodesFor('.choose-dropdown ul li').slice(0,3).should.deep.equal(
        ['Bob - 31', 'Jane - 25', 'Anne - 37'])
    })

    it('should support virtual elements for templates', function() {
      selected(multiple ? [jane, dwane] : jane)
      testSetup(null, '<choose-match><!-- ko text: ' + (multiple ? "$root.names()" : 'name') + ' --><!-- /ko --></choose-match>')

      matchEl.textContent.should.equal(multiple ? 'Jane, Dwane' : 'Jane')
    })

    it('should have a choose-no-selection class on choose-match when there is nothing selected', function() {
      testSetup()
      matchEl.should.have.class('choose-no-selection')

      click(matchEl)
      click('.choose-dropdown li:nth-child(2)')
      matchEl.should.not.have.class('choose-no-selection')
    })

    !m && it('should update the value when the user chooses new object selections, updating dropdown classes', function() {
      testSetup(null, nameTemplates)
      testEl.should.not.have.class('choose-dropdown-open')

      click(matchEl)
      testEl.should.have.class('choose-dropdown-open')

      click('.choose-dropdown li:nth-child(2)')
      selected().should.equal(jane)
      matchEl.textContent.should.equal('Jane')
      testEl.should.have.class('choose-dropdown-open').and.class('choose-dropdown-closing')

      click(matchEl)
      click('.choose-dropdown li:nth-child(4)')
      selected().should.equal(dwane)
      matchEl.textContent.should.equal('Dwane')
    })
  })
  })

  describe('search', function() {
    var searchbox, searchWrapper,
    searchTestSetup = function() {
      testSetup.apply(null, arguments)
      searchWrapper = testEl.querySelector('.choose-search-wrapper')
      searchbox = testEl.querySelector('.choose-search-wrapper input')
    }
    it('by default should only show when there are more than 10 items', function() {
      searchTestSetup({ options: colors, selected: selected })
      searchWrapper.style.display.should.equal('none')

      colors(colors().concat(['pink', 'red', 'blue', 'crimson', 'rebeccapurple', 'iris', 'seagreen', 'pumpkin']))
      searchWrapper.style.display.should.equal('')
    })

    it('should call the showSearch function if provided to determine weather to show the searchbox', function() {
      var showSearch = sinon.spy(function() {
        return colors().length > 5
      })
      searchTestSetup('options: options, selected: selected, showSearch: showSearch', {
        options: colors,
        selected: selected,
        showSearch: showSearch
      })
      showSearch.should.have.been.calledOnce
      searchWrapper.style.display.should.equal('none')

      colors(colors().concat(['pink', 'red', 'blue']))
      showSearch.should.have.been.calledTwice
      searchWrapper.style.display.should.equal('')
    })

    it('should filter scalar items to choose from as the user types', function() {
      clock = sinon.useFakeTimers()
      searchTestSetup({ options: colors, selected: selected })
      click(matchEl)
      type(searchbox, 'b')
      clock.tick(5)

      textNodesFor('.choose-dropdown li').should.deep.equal(['blue', 'brown'])
    })

    it('should filter object items by searching properties defined in searchProps', function() {
      clock = sinon.useFakeTimers()
      searchTestSetup('options: options, selected: selected, searchProps: ["name"]', {
        options: people,
        selected: selected
      }, nameTemplates)

      click(matchEl)
      type(searchbox, 'an')
      clock.tick(5)

      textNodesFor('.choose-dropdown li').should.deep.equal(['Jane - 25', 'Anne - 37', 'Dwane - 21'])

      type(searchbox, '2')
      clock.tick(5)

      textNodesFor('.choose-dropdown li').should.be.empty
    })
  })
})