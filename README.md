## knockout-choose

### A lightweight and powerful select alternative to let users choose items from many options as a modern Knockout component

[![Build Status](https://secure.travis-ci.org/nathanboktae/knockout-choose.png)](http://travis-ci.org/nathanboktae/knockout-choose)

[![SauceLabs Test Status](https://saucelabs.com/browser-matrix/knockout-choose.svg)](https://saucelabs.com/u/knockout-choose)

### Examples

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
    fruits: [{
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
  <choose-item><p data-bind="text: $data.name"></p> is <span data-bind="text: $data.age"></span></choose-item>
</choose>

<script>
  ko.applyBindings({
    fruits: [{
      name: 'Bob',
      age: 31
    }, {
      name: 'Jane',
      age: 25
    }, {
      name: 'Anne',
      age: 42
    }],
    selected: ko.observable(),

    selectionText: function(data) {
      return data.length ?
        data.length + ' people selected: ' + data.join(', ') :
        'Nobody selected'
    }
  })
</script>  
```


### API

Documentation to come, for now see [the tests](https://github.com/nathanboktae/knockout-choose/blob/master/tests/tests.js)

### Installation

via bower

```
bower install knockout-choose
```

or via npm

```
npm install knockout-choose
```