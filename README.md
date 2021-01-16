# seq
Wraps an async (or other Promise returning) function to prevent it being
executed in parallel.

[![npm](https://img.shields.io/npm/v/@woubuc/seq)](https://www.npmjs.com/package/@woubuc/seq)
[![MIT licensed](https://img.shields.io/badge/license-MIT-green)](https://github.com/woubuc/seq/blob/master/LICENSE.txt)
[![install size](https://packagephobia.com/badge?p=@woubuc/seq)](https://packagephobia.com/result?p=@woubuc/seq)
![Typescript type definitions included](https://img.shields.io/npm/types/@woubuc/seq)

## How it works
1. When the wrapped function is called for the first time, the original function
   is called and the wrapper keeps track of the original promise.
2. Any subsequent calls to the wrapped function before the original promise has
   completed, will return the same original promise.
3. Once the original promise resolves, the next call to the wrapped function
   will invoke the original function again.

### Arguments
The inner function can optionally take any number of arguments. Parallel
execution will be blocked **only** for calls with the same arguments. So two
calls to `wrapped('foo')` will only result in the inner function being called
once, but calls to `wrapped('foo')` and `wrapped('bar')` will both call the
original function.

##### A note on performance
Because the entire arguments array needs to be matched, using complex function
signatures (e.g. many arguments or large objects) may impact performance
somewhat. Try to keep your function signatures short and focused.

## Installation
```
yarn add @woubuc/seq
```

The library is written in Typescript so types are included.

## Usage
```typescript
const wrapped = seq(async () => {
  let result = await fetch(...);
  return result.json();
});

// You can now call the wrapped function multiple times, but
// only one `fetch` request will occur at any time. Each call
// to `wrapped()` below will resolve with the same data.
wrapped();
wrapped();
wrapped();
```

### With arguments
```typescript
const wrapped = seq(async (id : number) => {
	let result = await fetch(...);
	return result.json();
});

// Just like before, these first two calls will only invoke
// the inner function once and so only one `fetch` request
// will occur with ID `1`.
wrapped(1);
wrapped(1);

// However, the calls below will cause a second `fetch`
// request to occur because the wrapped function is called
// with a different value.
wrapped(2);
wrapped(2);
```
