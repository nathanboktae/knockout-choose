(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['knockout', 'aria-listbox'], factory)
  } else if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory(require('knockout'), require('aria-listbox'))
  } else {
    factory(ko, ariaListbox)
  }
})(function(ko, ariaListbox) {

  return ko.components.register('choose', {
    viewModel: {
      createViewModel: function(params, componentInfo) {
        var chooseEl = componentInfo.element,
        disposables = [],
        itemTemplate = componentInfo.templateNodes.filter(function(n) {
          return n.tagName === 'CHOOSE-ITEM'
        })[0],
        matchTemplate = componentInfo.templateNodes.filter(function(n) {
          return n.tagName === 'CHOOSE-MATCH'
        })[0],
        itemLi = document.createElement('li')

        itemLi.setAttribute('role', 'option')
        itemLi.setAttribute('data-bind', 'event: { blur: $component.closeOnBlur }, attr: { "aria-selected": ' +
          (params.multiple ? '$component.selected().indexOf($data) !== -1' : '$data === $component.selected()') +
          (params.disabledItems ? ', "aria-disabled": ko.unwrap($component.disabledItems).indexOf($data) !== -1' : '') + ' }')

        if (!itemTemplate) {
          itemTemplate = [document.createElement('span')]
          itemTemplate[0].setAttribute('data-bind', 'text: $data')
        } else {
          itemTemplate = Array.prototype.slice.call(itemTemplate.childNodes)
        }

        if (!Array.isArray(ko.unwrap(params.options))) {
          var groupHeaderTemplate = componentInfo.templateNodes.filter(function(n) {
            return n.tagName === 'CHOOSE-GROUP-HEADER'
          })[0]

          if (!groupHeaderTemplate) {
            groupHeaderTemplate = [document.createElement('span')]
            groupHeaderTemplate[0].setAttribute('data-bind', 'text: $data.group')
            groupHeaderTemplate[0].className = 'choose-group-header'
          } else {
            groupHeaderTemplate = Array.prototype.slice.call(groupHeaderTemplate.childNodes)
          }

          var outerLi = document.createElement('li'),
              groupUl = document.createElement('ul')
          groupUl.className = 'choose-items'
          groupUl.setAttribute('data-bind', 'foreach: $data.items()')
          groupUl.appendChild(itemLi)

          groupHeaderTemplate.forEach(function(n) {
            outerLi.appendChild(n)
          })
          outerLi.appendChild(groupUl)

          var options = ko.computed(function() {
            var groupedOptions = ko.unwrap(params.$raw.options()) || {}
            return Object.keys(groupedOptions).map(function(groupName) {
              return {
                group: groupName,
                // we're returning a function here to have more granular dependency chains
                items: function() { return ko.unwrap(groupedOptions[groupName]) }
              }
            })
          }, null, { disposeWhenNodeIsRemoved: chooseEl })
        } else {
          options = function() {
            return ko.unwrap(params.$raw.options()) || []
          }
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
          dropdownVisible = params.dropdownVisible || ko.observable(false),
          lastFocusedAt = new Date(1, 1, 1980),
          selected = params.selected

        if (params.selectProperty) {
          var initialSelected, initalSelectValue = ko.unwrap(params.selected)
          if (params.multiple) {
            if (Array.isArray(initalSelectValue) && initalSelectValue.length) {
              var opts = options(), initialSelected = []
              initalSelectValue.forEach(function(v) {
                var match = opts.filter(function(o) {
                  return o[params.selectProperty] === v
                })[0]
                match && initialSelected.push(match)
              })
            }
            selected = ko.observableArray(initialSelected)
          } else {
            if (initalSelectValue) {
              initialSelected = options().filter(function(o) {
                return o[params.selectProperty] === initalSelectValue
              })[0]
            }
            selected = ko.observable(initialSelected)
          }
        }

        if (!ko.isWritableObservable(params.selected)) {
          throw new Error('You must provide a `selected` (value) option as a writable observable')
        } else if (params.multiple && typeof selected.push !== 'function') {
          throw new Error('You must provide a `selected` (value) option as an observableArray for multiple selection')
        }

        if (!chooseEl.attributes.tabindex) {
          chooseEl.setAttribute('tabindex', '0')
        }
        var pendingBlur = false
        chooseEl.addEventListener('focus', function(e) {
          if (ko.unwrap(params.disabled)) return
          if (!dropdownVisible()) {
            lastFocusedAt = new Date()
          }
          pendingBlur = false
          dropdownVisible(true)
          setTimeout(function() {
            chooseEl.querySelector('[name="choose-search"]').focus()
            pendingBlur = false
          }, 10)
        })

        var closeOnBlur = function(_, e) {
          if (!e.relatedTarget || !chooseEl.contains(e.relatedTarget)) {
            // unfortunately due to poor browser support of relatedTarget, we need to delay this to see if
            // the focus really was one of our elements
            pendingBlur = true
            setTimeout(function() {
              if (pendingBlur) {
                dropdownVisible(false)
              }
            }, 20)
          }
        }
        chooseEl.addEventListener('blur', closeOnBlur.bind(null, null))

        if (ko.bindingHandlers.animation) {
          ko.bindingHandlers.animation.init(chooseEl, function() {
            return {
              when: dropdownVisible,
              class: 'choose-dropdown-open',
              enter: 'choose-dropdown-opening',
              exit: 'choose-dropdown-closing'
            }
          })
        } else {
          disposables.push(ko.computed(function() {
            ko.bindingHandlers.visible.update(chooseEl.querySelector('.choose-dropdown'), dropdownVisible)
          }))
        }

        if (params.multiple) {
          chooseEl.setAttribute('aria-multiselect', 'true')
        }
        ariaListbox(chooseEl, params.ariaListbox)

        disposables.push(ko.computed(function() {
          if (ko.unwrap(params.disabled)) {
            chooseEl.setAttribute('aria-disabled', 'true')
          } else {
            chooseEl.removeAttribute('aria-disabled')
          }
        }))

        function select(item) {
          if (ko.unwrap(params.disabled)) return
          if (params.disabledItems && ko.unwrap(params.disabledItems).indexOf(item) !== -1) return

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
            chooseEl.focus()
            dropdownVisible(false)
          }
        }

        chooseEl.addEventListener('selection-changed', function(e) {
          select(ko.contextFor(e.added || e.removed || e.selection).$data)
        })

        chooseEl.addEventListener('keydown', function(e) {
          var code = e.code || e.keyCode || e.which,
              isInput = e.target.tagName === 'INPUT' || e.target === chooseEl,
              isOption = e.target.getAttribute('role') === 'option',
              firstOption
          if (code === 38 /*up arrow*/) {
            e.preventDefault()
            e.stopPropagation()
            if (isInput) {
              var options = chooseEl.querySelectorAll('[role="option"]')
              if (options.length) {
                options[options.length - 1].setAttribute('tabindex', '0')
                options[options.length - 1].focus()
              }
            } else if (isOption && !e.target.previousElementSibling) {
              chooseEl.focus()
            }
          } else if (code === 40 /* down arrow */) {
            e.preventDefault()
            e.stopPropagation()
            if (isInput) {
              firstOption = chooseEl.querySelector('[role="option"]')
              if (firstOption) {
                firstOption.setAttribute('tabindex', '0')
                firstOption.focus()
              }
            } else if (isOption && !e.target.nextElementSibling) {
              chooseEl.focus()
            }
          } else if (code === 13 && isInput) {
            firstOption = chooseEl.querySelector('[role="option"]')
            if (firstOption) {
              select(ko.contextFor(firstOption).$data)
            }
          }
        })

        return {
          searchTerm: searchTerm,
          selected: selected,
          outerUlClass: outerLi ? 'choose-group' : 'choose-items',
          itemTemplate: [outerLi || itemLi],
          matchTemplate: matchTemplate,
          dropdownVisible: dropdownVisible,
          placeholder: params.placeholder || 'Choose...',
          searchPlaceholder: params.searchPlaceholder,
          closeOnBlur: closeOnBlur,
          disabledItems: params.disabledItems,

          toggleDropdown: function() {
            if (ko.unwrap(params.disabled)) return
            if (new Date() - lastFocusedAt > (params.focusDebounce || 200)) {
              dropdownVisible(!dropdownVisible())
            }
          },

          hasSelection: function() {
            return params.multiple ? !!selected().length : selected() !== undefined
          },

          showSearch: function() {
            if ('showSearch' in params) {
              var show = ko.unwrap(params.showSearch)
              return typeof show === 'function' ? show() : !!show
            } else {
              if (outerLi) {
                var opts = options()
                return Object.keys(opts).reduce(function(total, key) {
                  return total + opts[key].items().length
                }, 0) > 10
              } else {
                return options().length > 10
              }
            }
          },

          filteredItems: function() {
            var items = options()
            if (!searchTerm()) return items

            var searchTermUC = searchTerm().toUpperCase(),
                searchProps = ko.unwrap(params.searchProps),

            predicate = searchProps ?
              function(i) {
                return searchProps.some(function(prop) {
                  return i && i[prop] != null && i[prop].toString().toUpperCase().indexOf(searchTermUC) !== -1
                })
              }
            :
              function(i) {
                return i != null && i.toString().toUpperCase().indexOf(searchTermUC) !== -1
              }

            if (groupUl) {
              return items.map(function(group) {
                var filteredChildren = group.items().filter(predicate)
                if (filteredChildren.length) {
                  return {
                    group: group.group,
                    items: function() { return filteredChildren }
                  }
                }
              }).filter(function(g) { return !!g })
            } else {
              return items.filter(predicate)
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
  <ul data-bind="template: { nodes: itemTemplate, foreach: filteredItems() }, css: outerUlClass"></ul>\
</div>',
    synchronous: true
  })
})