import seq from './seq';
import Mock = jest.Mock;

const wait = () => new Promise(r => setTimeout(r, 100));

/**
 * Creates a wrapped async Jest mock function that counts the number of invocations
 */
function createFn<U extends any[] = []>() : [Mock<any, any>, (...args : U) => Promise<boolean>] {
	let fn = jest.fn();

	let f = seq(async (...args : U) => {
		fn();
		await wait();
		return true;
	});

	return [fn, f];
}

describe('simple function', () => {
	test('one invocation', async () => {
		let [fn, wrapped] = createFn();

		let a = wrapped();
		await expect(a).resolves.toStrictEqual(true);

		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('two invocations (sequential)', async () => {
		let [fn, wrapped] = createFn();

		let a = wrapped();
		let b = wrapped();
		await expect(a).resolves.toStrictEqual(true);
		await expect(b).resolves.toStrictEqual(true);

		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('two invocations (Promise.all)', async () => {
		let [fn, wrapped] = createFn();

		let a = Promise.all([wrapped(), wrapped()]);
		await expect(a).resolves.toStrictEqual([true, true]);

		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('multiple invocations with await', async () => {
		let [fn, wrapped] = createFn();

		let a = wrapped();
		let b = wrapped();
		await expect(a).resolves.toStrictEqual(true);
		await expect(b).resolves.toStrictEqual(true);

		let c = wrapped();
		await expect(c).resolves.toStrictEqual(true);

		let d = wrapped();
		let e = wrapped();
		let f = wrapped();
		await expect(Promise.all([d, e, f]))
			.resolves
			.toStrictEqual([true, true, true]);

		expect(fn).toHaveBeenCalledTimes(3);
	});
});

describe('one argument', () => {
	test('single value', async () => {
		let [fn, wrapped] = createFn<[string]>();

		let a = wrapped('foo');
		await expect(a).resolves.toStrictEqual(true);

		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('multiple values', async () => {
		let [fn, wrapped] = createFn<[string]>();

		let a = wrapped('foo'); // 1
		let b = wrapped('bar'); // 2
		let c = wrapped('baz'); // 3
		let d = wrapped('foo'); // 1
		let e = wrapped('baz'); // 3
		await expect(Promise.all([a, b, c, d, e]))
			.resolves
			.toStrictEqual([true, true, true, true, true]);

		expect(fn).toHaveBeenCalledTimes(3);
	});
});

describe('multiple arguments', () => {
	test('single value', async () => {
		let [fn, wrapped] = createFn<[string, number, object]>();

		let a = wrapped('foo', 1, { bool: true });
		await expect(a).resolves.toStrictEqual(true);

		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('multiple values', async () => {
		let [fn, wrapped] = createFn<[string, number, object]>();

		let a = wrapped('foo', 1, { bool: true }); // 1
		let b = wrapped('foo', 1, { bool: true }); // 1
		let c = wrapped('bar', 2, { bool: true }); // 2
		let d = wrapped('foo', 2, { bool: false }); // 3
		let e = wrapped('foo', 2, { bool: false }); // 3
		let f = wrapped('baz', 3, { bool: true }); // 4
		let g = wrapped('baz', 3, { bool: false }); // 5
		let h = wrapped('foo', 1, { bool: true }); // 1
		await expect(Promise.all([a, b, c, d, e, f, g, h]))
			.resolves
			.toStrictEqual([true, true, true, true, true, true, true, true]);

		expect(fn).toHaveBeenCalledTimes(5);
	});
});
