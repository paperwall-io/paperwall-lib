// Define the initial state

import type { StoreCallback } from "../types";

// Export the state, setState, and subscribe functions
export default <T>(initialState: T) => {
  let state: T = initialState;

  // Define a list of subscribers
  let subscribers: StoreCallback[] = [];

  const notify = (newState: T) => {
    // Notify subscribers
    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      if (subscriber) {
        subscriber(newState);
      }
    }
  };

  // Define a function to update the state and notify subscribers
  function set(newState: T) {
    state = newState;
    notify(state);
    return state;
  }

  function update(newState: T) {
    state = {
      ...state,
      ...newState,
    };
    notify(state);
    return state;
  }

  // Define a function to subscribe to state changes
  function subscribe(callback: StoreCallback) {
    subscribers.push(callback);
    return () => {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  return {
    get: () => state,
    update,
    set,
    sub: subscribe,
  };
};
