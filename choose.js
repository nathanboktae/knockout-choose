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
          itemTemplate = Array.prototype.slice.call(itemTemplate.childNodes)
        }
        itemTemplate.forEach(function(n) {
          itemLi.appendChild(n)
        })

        if (!matchTemplate) {
          matchTemplate = [document.createElement('span')]
          matchTemplate[0].setAttribute('data-bind', params.multiple ?
              'text: $component.selected().length ? $component.selected().join(", ") : $component.placeholder' :
              'text: $component.selected() != null ? $component.selected() : $component.placeholder')
        } else {
          matchTemplate = Array.prototype.slice.call(matchTemplate.childNodes)
        }

        var
          searchTerm = params.searchTerm || ko.observable(),
          selected = params.selectProperty ? ko[params.multiple ? 'observableArray' : 'observable']() : params.selected,
          dropdownVisible = params.dropdownVisible || ko.observable(false),
          disposables = [],
          lastFocusedAt = new Date(1, 1, 1980)

        if (!ko.isWritableObservable(params.selected)) {
          throw new Error('You must provide a `selected` (value) option as a writable observable')
        } else if (params.multiple && typeof selected.push !== 'function') {
          throw new Error('You must provide a `selected` (value) option as an observableArray for multiple selection')
        }

        if (!componentInfo.element.attributes.tabindex) {
          componentInfo.element.setAttribute('tabindex', '0')
        }
        componentInfo.element.addEventListener('focus', function(e) {
          dropdownVisible(true)
          lastFocusedAt = new Date()
        })

        var closeOnBlur = function(e) {
          if (!e.relatedTarget || !componentInfo.element.contains(e.relatedTarget)) {
            dropdownVisible(false)
          }
        }
        componentInfo.element.addEventListener('blur', closeOnBlur)

        disposables.push(dropdownVisible.subscribe(function(val) {
          if (val) {
            componentInfo.element.classList.add('choose-dropdown-open')
            componentInfo.element.classList.remove('choose-dropdown-closing')
          } else {
            componentInfo.element.classList.add('choose-dropdown-closing')
          }
        }))
        componentInfo.element.addEventListener('animationend', function() {
          componentInfo.element.classList.remove('choose-dropdown-closing')
          componentInfo.element.classList.toggle('choose-dropdown-open', dropdownVisible())
        })

        return {
          searchTerm: searchTerm,
          selected: selected,
          itemTemplate: [itemLi],
          matchTemplate: matchTemplate,
          dropdownVisible: dropdownVisible,
          placeholder: params.placeholder || 'Choose...',
          searchPlaceholder: params.searchPlaceholder,
          closeOnBlur: closeOnBlur,

          toggleDropdown: function() {
            if (new Date() - lastFocusedAt > 120) {
              dropdownVisible(!dropdownVisible())
            }
          },

          hasSelection: function() {
            return params.multiple ? !!selected().length : !!selected()
          },

          showSearch: function() {
            return 'showSearch' in params ?
              ko.unwrap(params.showSearch)() :
              ko.unwrap(params.$raw.options()).length > 10
          },

          filteredItems: function() {
            var items = ko.unwrap(params.$raw.options())
            if (!searchTerm()) return items

            var searchTermUC = searchTerm().toUpperCase(),
                searchProps = ko.unwrap(params.searchProps)

            if (searchProps) {
              if (!Array.isArray(searchProps)) {
                searchProps = [searchProps]
              }
              return items.filter(function(i) {
                return searchProps.some(function(prop) {
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
              if (params.selectProperty) {
                params.selected(selected().map(function(i) { return i[params.selectProperty] }))
              }
            } else {
              selected(item)
              if (params.selectProperty) {
                params.selected(item[params.selectProperty])
              }
              dropdownVisible(false)
            }
          },

          dispose: function() {
            disposables.forEach(function(d) {
              d.dispose()
            })
          }
        }
      }
    },
    template: '<div class="choose-match" data-bind="template: { nodes: matchTemplate, data: selected }, click: toggleDropdown, css: { \'choose-no-selection\': !hasSelection() }"></div>\
<div class="choose-dropdown">\
  <div class="choose-search-wrapper" data-bind="visible: showSearch()"><input type="text" name="choose-search" data-bind="value: searchTerm, valueUpdate: \'afterkeydown\', attr: { placeholder: searchPlaceholder }, event: { blur: closeOnBlur }"></div>\
  <ul data-bind="template: { nodes: itemTemplate, foreach: filteredItems() }"></ul>\
</div>',
    synchronous: true
  })
})