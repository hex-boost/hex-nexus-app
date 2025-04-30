import { Events } from '@wailsio/runtime';
import { useEffect } from 'react';

export function useEventListener<T>(eventName: string, handler: (data: T) => void) {
  useEffect(() => {
    console.log(`Setting up listener for ${eventName}`);

    const cancel = Events.On(eventName, (event) => {
      console.log(`${eventName}:`, event.data[0]);
      handler(event.data[0]);
    });

    return () => {
      cancel();
    };
  }, [eventName, handler]);
}
