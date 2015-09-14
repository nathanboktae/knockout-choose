(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['knockout'], factory)
  } else if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory
  } else {
    factory(ko)
  }
})(function(ko) {

  return ko.components.register('choose', {
    viewModel: {
      createViewModel: function(params, componentInfo) {
        var itemTemplate = componentInfo.templateNodes.filter(function(n) {
          return n.tagName === 'CHOOSE-ITEM'
        })[0],
        matchTemplate = componentInfo.templateNodes.filter(function(n) {
          return n.tagName === 'CHOOSE-MATCH'
        })[0]

        var itemLi = document.createElement('li')
        itemLi.setAttribute('data-bind', 'click: $component.selectItem, attr: { "aria-selected": ' + (params.multiple ? '$component.selected().indexOf($data) !== -1 }' : '$data === $component.selected() }'))
        if (!itemTemplate) {
          itemTemplate = [document.createElement('span')]
          itemTemplate[0].setAttribute('data-bind', 'text: $data')
        } else {
          itemTemplate = itemTemplate.children
        }
        itemTemplate.forEach(function(n) {
          itemLi.appendChild(n)
        })

        if (!matchTemplate) {
          matchTemplate = [document.createElement('span')]
          matchTemplate[0].setAttribute('data-bind', params.multiple ?
              'text: $component.selected().length ? $component.selected().join(", ") : $component.caption' :
              'text: $component.selected() || $component.caption')
        }

        var
          searchTerm = params.searchTerm || ko.observable(),
          selected = params.selected,
          dropdownVisible = params.dropdownVisible || ko.observable(false)

        if (!ko.isObservable(selected)) {
          throw new Error('You must provide a selected (value) option as an observable, or observableArray for multiple selection')
        }

        return {
          searchTerm: searchTerm,
          selected: selected,
          itemTemplate: [itemLi],
          matchTemplate: matchTemplate,
          dropdownVisible: dropdownVisible,
          caption: params.caption || 'Choose...',
          searchPlaceholderText: params.searchPlaceholderText,

          toggleDropdown: function() {
            dropdownVisible(!dropdownVisible())
          },

          showSearch: function() {
            return 'showSearch' in params ?
              ko.unwrap(params.showSearch) :
              ko.unwrap(params.options).length > (params.showSearch || 10)
          },

          filteredItems: function() {
            var items = ko.unwrap(params.options)
            if (!searchTerm()) return items

            var searchTermUC = searchTerm().toUpperCase(),
                searchProps = ko.unwrap(params.searchProps)

            if (searchProps) {
              return items.filter(function(i) {
                return searchProps.any(function(prop) {
                  return i && i[prop] != null && i[prop].toString().toUpperCase().indexOf(searchTermUC) !== -1
                })
              })
            } else {
              return items.filter(function(i) {
                return i != null && i.toString().toUpperCase().indexOf(searchTermUC) !== -1
              })
            }
          },

          selectItem: function(item) {
            if (params.multiple) {
              var idx = selected().indexOf(item)
              idx === -1 ? selected.push(item) : selected.splice(idx, 1)
            } else {
              selected(item)
            }
          }
        }
      }
    },
    template: '<div class="choose-match" data-bind="template: { nodes: matchTemplate, data: selected }, click: toggleDropdown"></div>\
<div class="choose-dropdown" data-bind="visible: dropdownVisible">\
  <div class="choose-search-wrapper" data-bind="visible: showSearch"><input type="text" name="choose-search" data-bind="value: searchTerm, valueUpdate: \'afterkeydown\', attr: { placeholder: searchPlaceholderText }"></div>\
  <ul data-bind="template: { nodes: itemTemplate, foreach: filteredItems() }"></ul>\
</div>'
  })
})