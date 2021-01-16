import Deferred from '@woubuc/deferred';

/**
 * Wraps an async (or other Promise returning) function to prevent it being
 * executed in parallel
 *
 * When the wrapped function is called for the first time, the original function
 * is called and the wrapper keeps track of the original promise. Any subsequent
 * calls to the function before the original promise has resolved, will return
 * the same original promise. Once the original promise resolves, the next call
 * to the wrapped function will invoke the original function again.
 *
 * The inner function can optionally take any number of arguments, in which case
 * parallel execution will be blocked only for calls with the same arguments. So
 * two calls to `wrapped('foo')` will only result in the inner function being
 * called once, but calls to `wrapped('foo')` and `wrapped('bar')` will both
 * call the original function.
 *
 * NOTE: Argument matching currently happens by `JSON.stringify()`-ing the arguments
 * array and comparing the strings. This may impact performance somewhat when using
 * complex arguments (many arguments or large objects). Try to keep your function
 * signatures short and focused.
 *
 * @example
 * ```javascript
 * // Create a wrapped function
 * const wrapped = seq(async () => {
 *    let result = await fetch(...);
 *    return result.json();
 * });
 *
 * // Call the wrapped function. This will call the original function and keep
 * // track of the promise that is returned.
 * wrapped();
 *
 * // Call the wrapped function a second time. The original function is not
 * // called again because a promise is already pending.
 * wrapped();
 *
 * // Await the promise returned from the original function. As before, this
 * // will not call the original function because the promise is still not
 * // completed.
 * await wrapped();
 *
 * // At this point, the previous promise has resolved. Calling the wrapped
 * // function again now will result in a new call to the original function.
 * wrapped();
 * ```
 *
 * @param fn - The function to wrap
 *
 * @returns the wrapped function
 */
export default function seq<T, U extends any[]>(fn : (...args : U) => Promise<T>) : (...args : U) => Promise<T> {
	let pending = new Map<string, Deferred<T>>();

	return async function wrapped(...args : U) : Promise<T> {
		let argStr = JSON.stringify(args);

		let p = pending.get(argStr);

		if (p !== undefined) {
			// If a deferred promise already exists, we can simply return it
			// and call it a day.
			return p;
		}

		// If no promise exists for this value yet, create a new deferred
		// promise and store it in the map
		p = new Deferred();
		pending.set(argStr, p);

		// As soon as the inner function has completed, resolve the deferred
		// promise with the returned value.
		try {
			let result = await fn.apply(undefined, args);
			p.resolve(result);

			// Delete the deferred promise from the pending map, then return
			// the result from this promise. This should finish all handling
			// of this inner function invocation.
			pending.delete(argStr);
			return result;
		} catch (err) {
			// If the inner function errors, reject the deferred promise
			p.reject(err);

			// Regardless of whether the inner function was successful, we
			// still need to delete the deferred promise from the pending
			// map.
			pending.delete(argStr);

			// Lastly we re-throw the error to keep the behaviour of async
			// functions consistent, as throwing in an async function is the
			// same as rejecting a promise.
			throw err;
		}
	};
}
