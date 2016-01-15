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
  dispatchEvent = function(cls, type, moreInit, el) {
    var evt = document.createEvent(cls)
    evt.initEvent(type, true, true)
    if (typeof el === 'string') {
      el = testEl.querySelector(el)
    }
    if (typeof moreInit === 'function') {
      moreInit(el, evt)
    }
    el.dispatchEvent(evt)
    return evt
  },
  click = dispatchEvent.bind(null, 'MouseEvent', 'click', null),
  blur = dispatchEvent.bind(null, 'UIEvent', 'blur', null),
  type = function(el, chars) {
    return dispatchEvent('KeyboardEvent', 'keydown', function(el) {
      el.value = chars
    }, el)
  },
  keydown = function(el, key) {
    // Trying to "properly" create a KeyboardEvent is a huge bag of hurt
    return dispatchEvent('UIEvent', 'keydown', function(el, evt) {
      evt.keyCode = evt.code = typeof key === 'string' ? key.charCodeAt(0) : key
    }, el)
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
    after(function() {
      multiple = false
    })

    it('should render and update the list of string options given an observableArray', function() {
      testSetup({ options: colors, selected: selected })
      textNodesFor('.choose-dropdown ul li').should.deep.equal(['blue', 'brown', 'red'])

      colors.push('pink')
      textNodesFor('.choose-dropdown ul li').should.deep.equal(['blue', 'brown', 'red', 'pink'])
    })

    it('should render and update the list of string options when an observable is behind a property', function() {
      var viewModel = { selected: selected }

      Object.defineProperty(viewModel, 'options', {
        get: colors,
        set: colors,
        enumerable: true
      })
      testSetup(viewModel)
      textNodesFor('.choose-dropdown ul li').should.deep.equal(['blue', 'brown', 'red'])

      colors.push('pink')
      textNodesFor('.choose-dropdown ul li').should.deep.equal(['blue', 'brown', 'red', 'pink'])
    })

    it('should use the aria-listbox role', function() {
      testSetup()
      testEl.should.have.attribute('role', 'listbox')
      Array.prototype.forEach.call(testEl.querySelectorAll('li'), function(el) {
        el.should.have.attr('role', 'option')
      })
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
      testEl.should.have.class('choose-dropdown-open').and.have.class('choose-dropdown-opening')

      click('.choose-dropdown li:nth-child(2)')
      selected().should.equal('brown')
      matchEl.textContent.should.equal('brown')
      testEl.should.have.class('choose-dropdown-closing').and.not.class('choose-dropdown-open')

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

    !m && it('should initialize the selection to the first choice matching the selectProperty', function() {
      selected('Jane')
      testSetup('options: options, selected: selected, selectProperty: \'name\'', null,
        '<choose-match><span data-bind="text: $data ? $data.name + \' - \' + $data.age : \'nobody\'"></span></choose-match>\
        <choose-item><span data-bind="text: name + \' - \' + age"></span></choose-item>')
      matchEl.textContent.should.equal('Jane - 25')
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

    !m && it('should update selections when choosen via a keyboard', function() {
      testSetup({ selected: selected, options: colors })

      click(matchEl)
      keydown('.choose-dropdown li:nth-child(2)', 13 /* enter */)
      selected().should.equal('brown')
      matchEl.textContent.should.equal('brown')
    })

    m && it('should update selections when choosen via a keyboard', function() {
      testSetup({ selected: selected, options: colors })

      keydown('.choose-dropdown li:nth-child(2)', 13 /* enter */)
      selected().should.deep.equal(['brown'])
      matchEl.textContent.should.equal('brown')

      keydown('.choose-dropdown li:nth-child(3)', ' ')
      selected().should.deep.equal(['brown', 'red'])

      keydown('.choose-dropdown li:nth-child(2)', ' ')
      selected().should.deep.equal(['red'])
    })

    m && it('should initialize the selection to the choices contained in the initial selected', function() {
      selected(['Jane', 'Bob'])
      testSetup('options: options, selected: selected, selectProperty: \'name\'', null,
        '<choose-match><span data-bind="text: $root.namesAndAges($component.selected)"></span></choose-match>\
        <choose-item><span data-bind="text: name + \' - \' + age"></span></choose-item>')
      matchEl.textContent.should.equal('Jane - 25, Bob - 31')
    })

    it('should use the visible binding if knockout-css3-animation is not available', function() {
      var animationBinding = ko.bindingHandlers.animation
      delete ko.bindingHandlers.animation

      testSetup()
      testEl.style.display.should.equal('')
      dropdown.style.display.should.equal('none')

      click(matchEl)
      dropdown.style.display.should.equal('')

      ko.bindingHandlers.animation = animationBinding
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

    !m && it('should properly bind when options are falsy, setting choose-no-selection correctly', function() {
      testSetup({ options: [true, false, 0, null], selected: selected })
      matchEl.should.have.class('choose-no-selection')

      click(matchEl)
      click('.choose-dropdown li:nth-child(2)')
      matchEl.should.not.have.class('choose-no-selection')
      matchEl.should.have.text('false')

      click(matchEl)
      click('.choose-dropdown li:nth-child(3)')
      matchEl.should.not.have.class('choose-no-selection')
      matchEl.should.have.text('0')

      click(matchEl)
      click('.choose-dropdown li:nth-child(4)')
      matchEl.should.not.have.class('choose-no-selection')
    })

    !m && it('should update the value when the user chooses new object selections, updating dropdown classes', function() {
      testSetup(null, nameTemplates)
      testEl.should.not.have.class('choose-dropdown-open')

      click(matchEl)
      testEl.should.have.class('choose-dropdown-open').and.have.class('choose-dropdown-opening')

      click('.choose-dropdown li:nth-child(2)')
      selected().should.equal(jane)
      matchEl.textContent.should.equal('Jane')
      testEl.should.have.class('choose-dropdown-closing')

      click(matchEl)
      click('.choose-dropdown li:nth-child(4)')
      selected().should.equal(dwane)
      matchEl.textContent.should.equal('Dwane')
    })

    it('should close the dropdown when focus is lost on the choose element', function() {
      clock = sinon.useFakeTimers()
      testSetup()
      click(matchEl)
      testEl.should.have.class('choose-dropdown-open')
      blur(testEl)
      clock.tick(30)
      testEl.should.not.have.class('choose-dropdown-open')
    })

    it('should close the dropdown when focus is lost on a list item', function() {
      clock = sinon.useFakeTimers()
      testSetup()
      click(matchEl)
      testEl.should.have.class('choose-dropdown-open')

      var firstItem = testEl.querySelector('ul.choose-items li')
      firstItem.focus()
      testEl.should.have.class('choose-dropdown-open')

      blur(firstItem)
      clock.tick(30)
      testEl.should.not.have.class('choose-dropdown-open')
    })

    it('should not open the dropdown on focus or click when disabled', function() {
      var disabled = ko.observable(true)
      testSetup('options: options, selected: selected, disabled: disabled', {
        options: colors,
        selected: selected,
        disabled: disabled
      })

      testEl.should.have.attribute('aria-disabled', 'true')

      testEl.focus()
      testEl.should.not.have.class('choose-dropdown-open')

      click(matchEl)
      testEl.should.not.have.class('choose-dropdown-open')

      disabled(false)
      testEl.should.not.have.attribute('aria-disabled')

      click(matchEl)
      testEl.should.have.class('choose-dropdown-open')
    })

    !m && it('should not allow the selection to change when it is disabled', function() {
      var disabled = ko.observable(true)
      selected('blue')
      testSetup('options: options, selected: selected, disabled: disabled', {
        options: colors,
        selected: selected,
        disabled: disabled
      })

      click('li:nth-child(3)')
      selected().should.equal('blue')
    })

    it('should mark items from disabledItems as aria-disabled', function() {
      var disabledItems = ko.observableArray()
      testSetup('options: options, selected: selected, disabledItems: disabledItems', {
        options: colors,
        selected: selected,
        disabledItems: disabledItems
      })

      testEl.should.have.not.attribute('aria-disabled', 'true')
      click(matchEl)

      attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null])

      disabledItems.push('brown')
      attributesFor('li', 'aria-disabled').should.deep.equal([null, 'true', null])
    })

    it('should not allow selection of disabled items', function() {
      var disabledItems = [dwane, people()[0]]
      testSetup('options: options, selected: selected, disabledItems: disabledItems', {
        options: people,
        selected: selected,
        disabledItems: disabledItems
      }, nameTemplates)

      attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, null, 'true', null, null])

      click('li:nth-child(4)')
      chai.expect(selected()).to.deep.equal(multiple ? [] : undefined)

      click('li:nth-child(2)')
      selected().should.deep.equal(multiple ? [jane] : jane)

      click('li:first-child')
      selected().should.deep.equal(multiple ? [jane] : jane)
    })

    m && describe('max', function() {
      it('should disable unselected items when the maxiumum is reached', function() {
        testSetup('options: options, selected: selected, max: max', {
          options: people,
          selected: selected,
          max: ko.observable(3)
        }, nameTemplates)

        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null, null, null, null])

        click('li:nth-child(4)')
        click('li:first-child')
        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null, null, null, null])

        click('li:nth-child(2)')
        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, 'true', null, 'true', 'true'])
      })

      it('should disable unselected items initially if at or over the maxiumum', function() {
        selected = ko.observableArray([dwane, jane, people()[0], people()[4]])
        testSetup('options: options, selected: selected, max: 3', {
          options: people,
          selected: selected
        }, nameTemplates)

        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, 'true', null, null, 'true'])

        selected([dwane, jane, people()[4]])
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', null, null, 'true'])
      })

      it('should re-enable items after an item is deselected', function() {
        selected = ko.observableArray([dwane, jane])
        testSetup('options: options, selected: selected, max: 2', {
          options: people,
          selected: selected
        }, nameTemplates)

        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', null, 'true', 'true'])
        click('li:nth-child(2)')

        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null, null, null, null])
      })

      it('should re-enable items if the maxiumum changes when it is an observable', function() {
        selected = ko.observableArray([dwane, jane])
        var max = ko.observable(2)
        testSetup('options: options, selected: selected, max: max', {
          options: people,
          selected: selected,
          max: max
        }, nameTemplates)

        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', null, 'true', 'true'])

        max(4)

        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null, null, null, null])
      })

      it('should work in tandem with disabled items', function() {
        selected = ko.observableArray([dwane, jane])
        var disabledItems = ko.observableArray([dwane, people()[0]])
        testSetup('options: options, selected: selected, max: 3, disabledItems: disabledItems', {
          options: people,
          selected: selected,
          disabledItems: disabledItems
        }, nameTemplates)

        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, null, 'true', null, null])

        click('li:nth-child(5)')
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', 'true', null, 'true'])

        click('li:first-child')
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', 'true', null, 'true'])

        disabledItems([people()[0]])
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', null, null, 'true'])

        click('li:nth-child(2)')
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, null, null, null, null])
      })
    })
  })
  })

  function groupedColorsTest() {
    testSetup('options: options, selected: selected, showSearch: true', {
      options: {
        pastels: ['pink', 'mauve', 'baby blue'],
        earth: ['copper', 'brown', 'citron'],
        vibrant: ['cyan']
      },
      selected: selected
    })
  }

  function groupedPeopleTest() {
    selected = ko.observableArray()
    testSetup('options: options, selected: selected, showSearch: true, searchProps: [\'name\', \'eyeColor\'], multiple: true', {
      options: {
        managers: [{
          name: 'Tom',
          age: 25,
          eyeColor: 'brown'
        }, {
          name: 'Tori',
          age: 27,
          eyeColor: 'blue'
        }],
        employees: [dwane, jane],
      },
      selected: selected
    }, '<choose-match><span data-bind="text: $data && $data.name"></span></choose-match>\
    <choose-group-header><h3 data-bind="text: $data.group"></h3></choose-group-header>\
    <choose-item><span data-bind="text: $data.name.toLowerCase()"></span></choose-item>')
  }

  describe('groups', function() {
    it('should render an object of scalar arrays as groups with default templates', function() {
      groupedColorsTest()

      textNodesFor('.choose-dropdown > ul.choose-group > li span.choose-group-header')
        .should.deep.equal(['pastels', 'earth', 'vibrant'])
      textNodesFor('.choose-dropdown > ul.choose-group > li:first-child ul.choose-items span')
        .should.deep.equal(['pink', 'mauve', 'baby blue'])
      textNodesFor('.choose-dropdown > ul.choose-group > li:nth-child(2) ul.choose-items span')
        .should.deep.equal(['copper', 'brown', 'citron'])
      textNodesFor('.choose-dropdown > ul.choose-group > li:last-child ul.choose-items span')
        .should.deep.equal(['cyan'])
    })

    it('should should single select a sub item', function() {
      groupedColorsTest()

      click('.choose-dropdown li:first-child ul.choose-items li:nth-child(2)')
      selected().should.equal('mauve')
      testEl.querySelector('.choose-match span').textContent.should.equal('mauve')

      click('.choose-dropdown li:nth-child(2) ul.choose-items li:last-child')
      selected().should.equal('citron')
      testEl.querySelector('.choose-match span').textContent.should.equal('citron')
    })

    it('should do nothing when clicking a group header', function() {
      groupedColorsTest()

      click(matchEl)
      click('.choose-dropdown > ul > li:first-child .choose-group-header')
      should.not.exist(selected())
      testEl.should.have.class('choose-dropdown-open')
    })

    it('should render an object of object arrays as groups given templates', function() {
      groupedPeopleTest()

      textNodesFor('.choose-dropdown > ul > li h3')
        .should.deep.equal(['managers', 'employees'])
      textNodesFor('.choose-dropdown li:first-child ul.choose-items span')
        .should.deep.equal(['tom', 'tori'])
      textNodesFor('.choose-dropdown li:last-child ul.choose-items span')
        .should.deep.equal(['dwane', 'jane'])
    })

    it('should select multiple items from different groups', function() {
      groupedPeopleTest()

      click('.choose-dropdown li:first-child ul.choose-items li:nth-child(2)')
      selected()[0].name.should.equal('Tori')

      click('.choose-dropdown li:nth-child(2) ul.choose-items li:last-child')
      selected().map(function(i) { return i.name }).should.deep.equal(['Tori', 'Jane'])
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

    it('by default should only show when there are more than 10 items in all groups', function() {
      var options = ko.observable({
        one: ['a', 'b', 'c'],
        two: ['n', 'm', 'o']
      })
      searchTestSetup({
        options: options,
        selected: selected
      })
      searchWrapper.style.display.should.equal('none')

      options({
        one: ['a', 'b', 'c', 'd', 'e', 'f'],
        two: ['n', 'm', 'o', 'p', 'q', 'r']
      })
      searchWrapper.style.display.should.equal('')
    })

    it('should allow showSearch to be an observable', function() {
      var showSearch = ko.observable('yup')
      searchTestSetup('options: options, selected: selected, showSearch: showSearch', {
        options: colors,
        selected: selected,
        showSearch: showSearch
      })
      searchWrapper.style.display.should.equal('')

      showSearch(false)
      searchWrapper.style.display.should.equal('none')
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

    it('should fiter scalar items in groups by the search term, excluding groups without matches', function() {
      clock = sinon.useFakeTimers()
      groupedColorsTest()
      type(testEl.querySelector('.choose-search-wrapper input'), 'r')
      clock.tick(5)

      textNodesFor('.choose-dropdown > ul.choose-group > li span.choose-group-header')
        .should.deep.equal(['earth'])
      textNodesFor('.choose-dropdown > ul > li:first-child ul.choose-items span')
        .should.deep.equal(['copper', 'brown', 'citron'])

      type(testEl.querySelector('.choose-search-wrapper input'), 'v')
      clock.tick(5)

      textNodesFor('.choose-dropdown > ul > li span.choose-group-header')
        .should.deep.equal(['pastels'])
      textNodesFor('.choose-dropdown > ul > li:first-child ul.choose-items span')
        .should.deep.equal(['mauve'])
    })

    it('should fiter object items in groups by the search term, excluding groups without matches', function() {
      clock = sinon.useFakeTimers()
      groupedPeopleTest()

      type(testEl.querySelector('.choose-search-wrapper input'), 'blue')
      clock.tick(5)

      textNodesFor('.choose-dropdown > ul.choose-group > li h3')
        .should.deep.equal(['managers', 'employees'])
      textNodesFor('.choose-dropdown > ul > li:first-child ul.choose-items span')
        .should.deep.equal(['tori'])
      textNodesFor('.choose-dropdown > ul > li:nth-child(2) ul.choose-items span')
        .should.deep.equal(['jane'])

      type(testEl.querySelector('.choose-search-wrapper input'), 'To')
      clock.tick(5)

      textNodesFor('.choose-dropdown > ul > li h3')
        .should.deep.equal(['managers'])
      textNodesFor('.choose-dropdown > ul > li:first-child ul.choose-items span')
        .should.deep.equal(['tom', 'tori'])
    })

    it('should focus the first item in the list when arrow down is pressed', function() {
      searchTestSetup('options: options, selected: selected, showSearch: true', {
        options: colors,
        selected: selected
      })

      searchbox.focus()
      keydown(searchbox, 38).defaultPrevented.should.be.true

      document.activeElement.should.have.text('red')
    })

    it('should focus the searchbox when the choose element is focused', function(done) {
      searchTestSetup('options: options, selected: selected, showSearch: true', {
        options: colors,
        selected: selected
      })

      click(matchEl)
      testEl.focus()
      setTimeout(function() {
        document.activeElement.should.equal(searchbox)
        done()
      }, 100)
    })

    it('should close the dropdown when focus is lost from the searchbox', function() {
      clock = sinon.useFakeTimers()
      searchTestSetup('options: options, selected: selected, showSearch: true')

      click(matchEl)
      searchbox.focus()
      testEl.should.have.class('choose-dropdown-open')

      blur(searchbox)
      clock.tick(30)
      testEl.should.not.have.class('choose-dropdown-open')
    })

    it('should focus the last item in the list when arrow up is pressed', function() {
      searchTestSetup('options: options, selected: selected, showSearch: true', {
        options: colors,
        selected: selected
      })

      searchbox.focus()
      keydown(searchbox, 40).defaultPrevented.should.be.true

      document.activeElement.should.have.text('blue')
    })

    it('should focus the searchbox when arrow up is pressed on the top item', function(done) {
      searchTestSetup('options: options, selected: selected, showSearch: true', {
        options: colors,
        selected: selected
      })

      var firstItem = testEl.querySelector('li:first-child')
      firstItem.focus()
      keydown(firstItem, 38).defaultPrevented.should.be.true
      setTimeout(function() {
        document.activeElement.should.equal(searchbox)
        done()
      }, 150)
    })

    it('should focus the searchbox when arrow down is pressed on the last item', function(done) {
      searchTestSetup('options: options, selected: selected, showSearch: true', {
        options: colors,
        selected: selected
      })

      var lastItem = testEl.querySelector('li:last-child')
      lastItem.focus()
      keydown(lastItem, 40).defaultPrevented.should.be.true
      setTimeout(function() {
        document.activeElement.should.equal(searchbox)
        done()
      }, 150)
    })
  })
})