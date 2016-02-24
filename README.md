## knockout-choose

### A lightweight and powerful select alternative to let users choose items from many options as a modern Knockout component

[![Build Status](https://secure.travis-ci.org/nathanboktae/knockout-choose.png)](http://travis-ci.org/nathanboktae/knockout-choose)

[![SauceLabs Test Status](https://saucelabs.com/browser-matrix/knockout-choose.svg)](https://saucelabs.com/u/knockout-choose)

### Examples

See all of these [examples live!](http://nathanboktae.github.io/knockout-choose/)

#### Single select of strings

```html
<choose params="options: fruits, selected: selected"></choose>
<script>
  ko.applyBindings({
    fruits: ['banana', 'apple', 'strawberry', 'pineapple'],
    selected: ko.observable()
  })
</script>
```

#### Single select of objects

```html
<choose params="options: people, selected: selected">
  <choose-match><span data-bind="text: $data ? name + ' is ' + age : 'Select a person'"></span></choose-match>
  <choose-item><!-- ko text: name --><!-- /ko --></choose-item>
</choose>

<script>
  ko.applyBindings({
    people: [{
      name: 'Bob',
      age: 31
    }, {
      name: 'Jane',
      age: 25
    }, {
      name: 'Anne',
      age: 42
    }],
    selected: ko.observable()
  })
</script>
```

#### Multiple select of objects

```html
<choose params="options: people, selected: selected, multiple: true">
  <choose-match><span data-bind="text: $root.selectionText($data)"></span></choose-match>
  <choose-item><span data-bind="text: $data.name"></span> is <span data-bind="text: $data.age"></span></choose-item>
</choose>

<script>
  ko.applyBindings({
    people: [{
      name: 'Bob',
      age: 31
    }, {
      name: 'Jane',
      age: 25
    }, {
      name: 'Anne',
      age: 42
    }],
    selected: ko.observableArray(),

    selectionText: function(data) {
      return data.length ?
        data.length + ' people selected: ' + data.map(p => p.name).join(', ') :
        'Nobody selected'
    }
  })
</script>
```


### API

- `options`: If an array or observable array (of any object), they are the items the user chooses from. If an object, grouping is enabled, by properties of the object that have array/observableArray values as options.
- `selected`: A writable observable for the selected item, or `observableArray` for multiselect mode.
- `selectProperty`: The property of the selected object to bind to the `selected` observable. For example, in the above example with people object as choices, if `selectProperty` was `name`, the `selected` observable would be the string matching the `name` property of the object that was selected.
- `disabled`: An expression, observable, or scalar that if is truthy, disables the dropdown, disallowing selection changes or the dropdown to open.
- `disabledItems`: An expression, observable, or scalar of an array of items that are shown (marked with `aria-disabled`) but cannot be selected.

#### Options only for multiple selection

- `max`: An expression or observable number of the maximum items that can be selected. It will not proactively remove items that exceed the max, but disable additional selections until the number of selected items are less than the max.
- `unshift`: A boolean or observable boolean to put selected items to unshift items to the front of the array rather then push them on the end.

See [the tests](https://github.com/nathanboktae/knockout-choose/blob/master/tests/tests.js) for more specifics.

### Installation

via bower

```
bower install knockout-choose
```

or via npm

```
npm install knockout-choose
```

An optional and highly recommended dependency is [`knockout-css3-animation`](https://github.com/nathanboktae/knockout-css3-animation/) for animating the dropdown.