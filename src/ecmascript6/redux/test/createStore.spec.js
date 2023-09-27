import expect from 'expect'
import { createStore, combineReducers } from '../src/index'
import { addTodo, dispatchInMiddle, throwError, unknownAction } from './helpers/actionCreators'
import * as reducers from './helpers/reducers'

describe('createStore', () => {
  it('exposes the public API', () => {
    const store = createStore(combineReducers(reducers))
    const methods = Object.keys(store)

    expect(methods.length).toBe(4)
    expect(methods).toContain('subscribe')
    expect(methods).toContain('dispatch')
    expect(methods).toContain('getState')
    expect(methods).toContain('replaceReducer')
  })

  it('requires a reducer function', () => {
    expect(() =>
      createStore()
    ).toThrow()

    expect(() =>
      createStore('test')
    ).toThrow()

    expect(() =>
      createStore({})
    ).toThrow()

    expect(() =>
      createStore(() => {})
    ).toNotThrow()
  })

  it('passes the initial action and the initial state', () => {
    const store = createStore(reducers.todos, [
      {
        id: 1,
        text: 'Hello'
      }
    ])
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello'
      }
    ])
  })

  it('applies the reducer to the previous state', () => {
    const store = createStore(reducers.todos)
    expect(store.getState()).toEqual([])

    store.dispatch(unknownAction())
    expect(store.getState()).toEqual([])

    store.dispatch(addTodo('Hello'))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello'
      }
    ])

    store.dispatch(addTodo('World'))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello'
      }, {
        id: 2,
        text: 'World'
      }
    ])
  })

  it('applies the reducer to the initial state', () => {
    const store = createStore(reducers.todos, [
      {
        id: 1,
        text: 'Hello'
      }
    ])
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello'
      }
    ])

    store.dispatch(unknownAction())
    expect(store.getState()).toEqual([ 
      {
        id: 1,
        text: 'Hello'
      }
    ])

    store.dispatch(addTodo('World'))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello'
      }, {
        id: 2,
        text: 'World'
      }
    ])
  })

  it('preserves the state when replacing a reducer', () => {
    const store = createStore(reducers.todos)
    store.dispatch(addTodo('Hello'))
    store.dispatch(addTodo('World'))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello'
      },
      {
        id: 2,
        text: 'World'
      }
    ])

    store.replaceReducer(reducers.todosReverse)
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello'
      }, {
        id: 2,
        text: 'World'
      }
    ])

    store.dispatch(addTodo('Perhaps'))
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: 'Perhaps'
      }, 
      {
        id: 1,
        text: 'Hello'
      }, 
      {
        id: 2,
        text: 'World'
      }
    ])

    store.replaceReducer(reducers.todos)
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: 'Perhaps'
      }, 
      {
        id: 1,
        text: 'Hello'
      }, 
      {
        id: 2,
        text: 'World'
      }
    ])

    store.dispatch(addTodo('Surely'))
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: 'Perhaps'
      }, 
      {
        id: 1,
        text: 'Hello'
      }, 
      {
        id: 2,
        text: 'World'
      }, 
      {
        id: 4,
        text: 'Surely'
      }
    ])
  })

  it('supports multiple subscriptions', () => {
    const store = createStore(reducers.todos)
    const listenerA = expect.createSpy(() => {})
    const listenerB = expect.createSpy(() => {})

    let unsubscribeA = store.subscribe(listenerA)
    store.dispatch(unknownAction())
    expect(listenerA.calls.length).toBe(1)
    expect(listenerB.calls.length).toBe(0)

    store.dispatch(unknownAction())
    expect(listenerA.calls.length).toBe(2)
    expect(listenerB.calls.length).toBe(0)

    const unsubscribeB = store.subscribe(listenerB)
    expect(listenerA.calls.length).toBe(2)
    expect(listenerB.calls.length).toBe(0)

    store.dispatch(unknownAction())
    expect(listenerA.calls.length).toBe(3)
    expect(listenerB.calls.length).toBe(1)

    unsubscribeA()
    expect(listenerA.calls.length).toBe(3)
    expect(listenerB.calls.length).toBe(1)

    store.dispatch(unknownAction())
    expect(listenerA.calls.length).toBe(3)
    expect(listenerB.calls.length).toBe(2)

    unsubscribeB()
    expect(listenerA.calls.length).toBe(3)
    expect(listenerB.calls.length).toBe(2)

    store.dispatch(unknownAction())
    expect(listenerA.calls.length).toBe(3)
    expect(listenerB.calls.length).toBe(2)

    unsubscribeA = store.subscribe(listenerA)
    expect(listenerA.calls.length).toBe(3)
    expect(listenerB.calls.length).toBe(2)

    store.dispatch(unknownAction())
    expect(listenerA.calls.length).toBe(4)
    expect(listenerB.calls.length).toBe(2)
  })

  it('only removes listener once when unsubscribe is called', () => {
    const store = createStore(reducers.todos)
    const listenerA = expect.createSpy(() => {})
    const listenerB = expect.createSpy(() => {})

    const unsubscribeA = store.subscribe(listenerA)
    store.subscribe(listenerB)

    unsubscribeA()
    unsubscribeA()

    store.dispatch(unknownAction())
    expect(listenerA.calls.length).toBe(0)
    expect(listenerB.calls.length).toBe(1)
  })

  it('only removes relevant listener when unsubscribe is called', () => {
    const store = createStore(reducers.todos)
    const listener = expect.createSpy(() => {})

    store.subscribe(listener)
    const unsubscribeSecond = store.subscribe(listener)

    unsubscribeSecond()
    unsubscribeSecond()

    store.dispatch(unknownAction())
    expect(listener.calls.length).toBe(1)
  })

  it('supports removing a subscription within a subscription', () => {
    const store = createStore(reducers.todos)
    const listenerA = expect.createSpy(() => {})
    const listenerB = expect.createSpy(() => {})
    const listenerC = expect.createSpy(() => {})

    store.subscribe(listenerA)
    const unSubB = store.subscribe(() => {
      listenerB()
      unSubB()
    })
    store.subscribe(listenerC)

    store.dispatch(unknownAction())
    store.dispatch(unknownAction())

    expect(listenerA.calls.length).toBe(2)
    expect(listenerB.calls.length).toBe(1)
    expect(listenerC.calls.length).toBe(2)
  })

  it('provides an up-to-date state when a subscriber is notified', done => {
    const store = createStore(reducers.todos)
    store.subscribe(() => {
      expect(store.getState()).toEqual([
        {
          id: 1,
          text: 'Hello'
        }
      ])
      done()
    })
    store.dispatch(addTodo('Hello'))
  })

  it('only accepts plain object actions', () => {
    const store = createStore(reducers.todos)
    expect(() =>
      store.dispatch(unknownAction())
    ).toNotThrow()

    function AwesomeMap() { }
    [ null, undefined, 42, 'hey', new AwesomeMap() ].forEach(nonObject =>
      expect(() =>
        store.dispatch(nonObject)
      ).toThrow(/plain/)
    )
  })

  it('handles nested dispatches gracefully', () => {
    function foo(state = 0, action) {
      return action.type === 'foo' ? 1 : state
    }

    function bar(state = 0, action) {
      return action.type === 'bar' ? 2 : state
    }

    const store = createStore(combineReducers({ foo, bar }))

    store.subscribe(function kindaComponentDidUpdate() {
      const state = store.getState()
      if (state.bar === 0) {
        store.dispatch({ type: 'bar' })
      }
    })

    store.dispatch({ type: 'foo' })
    expect(store.getState()).toEqual({
      foo: 1,
      bar: 2
    })
  })

  it('does not allow dispatch() from within a reducer', () => {
    const store = createStore(reducers.dispatchInTheMiddleOfReducer)

    expect(() =>
      store.dispatch(dispatchInMiddle(store.dispatch.bind(store, unknownAction())))
    ).toThrow(/may not dispatch/)
  })

  it('recovers from an error within a reducer', () => {
    const store = createStore(reducers.errorThrowingReducer)
    expect(() =>
      store.dispatch(throwError())
    ).toThrow()

    expect(() =>
      store.dispatch(unknownAction())
    ).toNotThrow()
  })

  it('throws if action type is missing', () => {
    const store = createStore(reducers.todos)
    expect(() =>
      store.dispatch({})
    ).toThrow(/Actions may not have an undefined "type" property/)
  })

  it('throws if action type is undefined', () => {
    const store = createStore(reducers.todos)
    expect(() =>
      store.dispatch({ type: undefined })
    ).toThrow(/Actions may not have an undefined "type" property/)
  })

  it('does not throw if action type is falsy', () => {
    const store = createStore(reducers.todos)
    expect(() =>
      store.dispatch({ type: false })
    ).toNotThrow()
    expect(() =>
      store.dispatch({ type: 0 })
    ).toNotThrow()
    expect(() =>
      store.dispatch({ type: null })
    ).toNotThrow()
    expect(() =>
      store.dispatch({ type: '' })
    ).toNotThrow()
  })
})
