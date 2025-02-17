import { Observable } from '../Observable';
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { noop } from '../util/noop';
import { OperatorSubscriber } from './OperatorSubscriber';

/**
 * Buffers the source Observable values until `closingNotifier` emits.
 *
 * <span class="informal">Collects values from the past as an array, and emits
 * that array only when another Observable emits.</span>
 *
 * ![](buffer.png)
 *
 * Buffers the incoming Observable values until the given `closingNotifier`
 * Observable emits a value, at which point it emits the buffer on the output
 * Observable and starts a new buffer internally, awaiting the next time
 * `closingNotifier` emits.
 *
 * ## Example
 *
 * On every click, emit array of most recent interval events
 *
 * ```ts
 * import { fromEvent, interval, buffer } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const intervalEvents = interval(1000);
 * const buffered = intervalEvents.pipe(buffer(clicks));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link bufferCount}
 * @see {@link bufferTime}
 * @see {@link bufferToggle}
 * @see {@link bufferWhen}
 * @see {@link window}
 *
 * @param {Observable<any>} closingNotifier An Observable that signals the
 * buffer to be emitted on the output Observable.
 * @return A function that returns an Observable of buffers, which are arrays
 * of values.
 */
export function buffer<T>(closingNotifier: Observable<any>): OperatorFunction<T, T[]> {
  return operate((source, subscriber) => {
    // The current buffered values.
    let currentBuffer: T[] = [];

    // Subscribe to our source.
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        (value) => currentBuffer.push(value),
        () => {
          subscriber.next(currentBuffer);
          subscriber.complete();
        }
      )
    );

    // Subscribe to the closing notifier.
    closingNotifier.subscribe(
      new OperatorSubscriber(
        subscriber,
        () => {
          // Start a new buffer and emit the previous one.
          const b = currentBuffer;
          currentBuffer = [];
          subscriber.next(b);
        },
        noop
      )
    );

    return () => {
      // Ensure buffered values are released on teardown.
      currentBuffer = null!;
    };
  });
}
