let expect = require('chai').expect;
let _ = require('lodash');
let objtools = require('../lib');

const falsey = [ '', 0, false, NaN, null, undefined ];

describe('Base Functions', function() {

	describe('isScalar()', function() {

		it('should return true for scalar values', function(done) {
			expect(objtools.isScalar(true)).to.be.true;
			expect(objtools.isScalar(false)).to.be.true;
			expect(objtools.isScalar(new Date())).to.be.true;
			expect(objtools.isScalar(123)).to.be.true;
			expect(objtools.isScalar(null)).to.be.true;
			expect(objtools.isScalar(undefined)).to.be.true;
			expect(objtools.isScalar(function() {})).to.be.true;
			done();
		});

		it('should return false for non-scalar values', function(done) {
			expect(objtools.isScalar({})).to.be.false;
			expect(objtools.isScalar([])).to.be.false;
			expect(objtools.isScalar(new Error())).to.be.false;
			done();
		});

	});

	describe('scalarEquals', function() {

		let date1 = new Date('2014-01-01T00:00:00Z');
		let date2 = new Date('2014-01-01T00:00:00Z');
		let date3 = new Date('2014-01-01T00:00:01Z');

		it('should handle dates', function(done) {
			expect(objtools.scalarEquals(date1, date2)).to.be.true;
			expect(objtools.scalarEquals(date2, date3)).to.be.false;
			done();
		});

		it('should handle other types', function(done) {
			let func = function() {};
			let obj = {};
			expect(objtools.scalarEquals(2, 2)).to.be.true;
			expect(objtools.scalarEquals(true, true)).to.be.true;
			expect(objtools.scalarEquals(null, null)).to.be.true;
			expect(objtools.scalarEquals(undefined, undefined)).to.be.true;
			expect(objtools.scalarEquals(0, null)).to.be.false;
			expect(objtools.scalarEquals(obj, obj)).to.be.true;
			expect(objtools.scalarEquals(func, func)).to.be.true;
			expect(objtools.scalarEquals(obj, func)).to.be.false;
			expect(objtools.scalarEquals({}, {})).to.be.false;
			done();
		});

	});

	describe('deepEquals()', function() {

		let date1 = new Date('2014-01-01T00:00:00Z');
		let date2 = new Date('2014-01-01T00:00:00Z');
		let date3 = new Date('2014-01-01T00:00:01Z');

		let obj1 = { foo: { bar: 'baz', biz: [ 1, 2 ] } };
		let obj2 = { foo: { bar: 'baz', biz: [ 1, 2 ] } };
		let obj3 = { foo: { bar: 'biz' }, biz: [ 1, 2 ] };
		let obj4 = { foo: { bar: 'biz' }, biz: [ 1 ] };

		it('should handle dates correctly', function(done) {
			expect(objtools.deepEquals(date1, date2)).to.be.true;
			expect(objtools.deepEquals(date2, date3)).to.be.false;
			expect(objtools.deepEquals({ d: date1 }, { d: date2 })).to.be.true;
			done();
		});

		it('should handle objects correctly', function(done) {
			expect(objtools.deepEquals(obj1, obj2)).to.be.true;
			expect(objtools.deepEquals(obj2, obj3)).to.be.false;
			expect(objtools.deepEquals(obj3, obj4)).to.be.false;
			done();
		});

		it('should not coerce types', function(done) {
			expect(objtools.deepEquals({ a: null }, { a: null })).to.be.true;
			expect(objtools.deepEquals({ a: undefined }, { a: undefined })).to.be.true;
			expect(objtools.deepEquals({ a: null }, { a: undefined })).to.be.false;
			expect(objtools.deepEquals({ a: 0 }, { a: null })).to.be.false;
			done();
		});

	});

	describe('deepCopy()', function() {

		let obj1 = {
			foo: 'bar',
			fuzz: 123,
			biz: { dat: new Date('2014-01-01T00:00:00Z'), n: null, u: undefined },
			arr: [ 1, 2 ]
		};

		it('should correctly copy objects', function(done) {
			let copy = objtools.deepCopy(obj1);
			expect(copy).to.deep.equal(obj1);
			expect(null).to.not.deep.equal(undefined);	// make sure chai does what we want it to
			done();
		});

		it('should not maintain references to objects', function(done) {
			let copy = objtools.deepCopy(obj1);
			expect(copy).to.deep.equal(obj1);
			copy.biz.dat = 123;
			expect(copy).to.not.deep.equal(obj1);
			done();
		});

	});

	describe('collapseToDotted()', function() {

		let obj1 = {
			foo: 123,
			bar: { biz: 12, baz: { buz: 1 } },
			arr: [ 1, 2, { foo: 3 } ]
		};

		it('should correctly collapse objects to dotted form', function(done) {
			let dotted = objtools.collapseToDotted(obj1);
			expect(dotted).to.deep.equal({
				foo: 123,
				'bar.biz': 12,
				'bar.baz.buz': 1,
				'arr.0': 1,
				'arr.1': 2,
				'arr.2.foo': 3
			});
			done();
		});

		it('should obey includeRedundantLevels', function(done) {
			let dotted = objtools.collapseToDotted(obj1, true);
			expect(dotted).to.deep.equal({
				foo: 123,
				bar: obj1.bar,
				'bar.biz': 12,
				'bar.baz': obj1.bar.baz,
				'bar.baz.buz': 1,
				'arr': obj1.arr,
				'arr.0': 1,
				'arr.1': 2,
				'arr.2.foo': 3,
				'arr.2': obj1.arr[2]
			});
			// check for referential equality
			expect(dotted.bar).to.equal(obj1.bar);
			expect(dotted.bar.baz).to.equal(obj1.bar.baz);
			done();
		});

		it('should obey stopAtArrays', function(done) {
			let dotted = objtools.collapseToDotted(obj1, false, true);
			expect(dotted).to.deep.equal({
				foo: 123,
				'bar.biz': 12,
				'bar.baz.buz': 1,
				'arr': obj1.arr
			});
			expect(dotted.arr).to.equal(obj1.arr);
			done();
		});

	});

	describe('match functions', function() {

		it('matchObject()', function(done) {
			expect(objtools.matchObject({
				foo: 'foo',
				bar: { biz: 12 },
				zip: [ 4, 5 ]
			}, {
				foo: 'foo',
				'bar.biz': 12,
				'zip.1': 5
			})).to.be.true;
			expect(objtools.matchObject({
				foo: 'foo',
				bar: { biz: 12 },
				zip: [ 4, 5 ]
			}, {
				foo: 'foo',
				'bar.biz': 12,
				'zip.2': 5
			})).to.be.false;
			done();
		});

		it('matchDottedObject()', function(done) {
			expect(objtools.matchDottedObject({
				foo: 'foo',
				bar: { biz: 12 },
				zip: [ 4, 5 ]
			}, {
				foo: 'foo',
				'bar': { biz: 12 },
				'zip': [ 4, 5 ]
			})).to.be.true;
			expect(objtools.matchDottedObject({
				foo: 'foo',
				bar: { biz: 12 },
				zip: [ 4, 5 ]
			}, {
				foo: 'foo',
				'bar': { biz: 12 },
				'zip': [ 4, 2 ]
			})).to.be.false;
			done();
		});

	});

	describe('syncObject()', function() {

		it('should copy an object to the destination', function() {
			let fromObj = {
				foo: 'bar',
				baz: {
					qux: [
						{
							zip: 'zap',
							bam: new Date('2014-01-01T00:00:00Z')
						},
						{
							bip: 'boop'
						}
					]
				},
				foop: {
					flap: 'flip'
				}
			};
			let toObj = {
				foo: 'bip',
				zap: 'zip',
				qux: {
					boom: 123
				},
				foop: {
					flap: 'flop'
				}
			};
			let origFoop = toObj.foop;
			objtools.syncObject(toObj, fromObj);
			expect(toObj).to.deep.equal(fromObj);
			// make sure it didn't modify fromObj
			expect(fromObj).to.deep.equal({
				foo: 'bar',
				baz: {
					qux: [
						{
							zip: 'zap',
							bam: new Date('2014-01-01T00:00:00Z')
						},
						{
							bip: 'boop'
						}
					]
				},
				foop: {
					flap: 'flip'
				}
			});
			// make sure it didn't change the internal object reference
			expect(toObj.foop).to.equal(origFoop);
		});

		it('should skip fields when the onField hook returns false', function() {
			let fromObj = {
				foo: 'bar',
				baz: {
					qux: [
						{
							zip: 'zap',
							bam: new Date('2014-01-01T00:00:00Z')
						},
						{
							bip: 'boop'
						}
					]
				},
				foop: {
					flap: 'flip'
				}
			};
			let toObj = {
				foo: 'bip',
				zap: 'zip',
				baz: {
					qux: 123
				},
				qux: {
					boom: 123
				},
				foop: {
					flap: 'flop'
				}
			};
			objtools.syncObject(toObj, fromObj, {
				onField(field) {
					return (field !== 'baz.qux');
				}
			});
			expect(toObj).to.deep.equal({
				foo: 'bar',
				baz: {
					qux: 123
				},
				foop: {
					flap: 'flip'
				}
			});
		});

		it('should call onChange for changed fields', function() {
			let fromObj = {
				foo: 'bar',
				baz: {
					qux: [
						{
							zip: 'zap',
							bam: new Date('2014-01-01T00:00:00Z')
						},
						{
							bip: 'boop'
						}
					]
				},
				foop: {
					flap: 'flip'
				},
				zap: 4
			};
			let toObj = {
				foo: 'bip',
				zoop: 'zip',
				baz: {
					qux: 123
				},
				qux: {
					boom: 123
				},
				foop: {
					flap: 'flop'
				},
				zap: 4
			};
			let changed = [];
			objtools.syncObject(toObj, fromObj, {
				onChange(field) {
					changed.push(field);
				}
			});
			expect(toObj).to.deep.equal(fromObj);
			expect(changed.sort()).to.deep.equal([
				'foo',
				'zoop',
				'baz.qux',
				'qux',
				'foop.flap'
			].sort());
		});

	});

	describe('path functions', function() {

		let obj1 = {
			foo: 'bar',
			baz: {
				biz: 'buz',
				arr: [ 1, 2, { zip: 3 } ],
				arr2: [ { zip: 4 } ]
			}
		};

		let getPath = objtools.getPath;
		let deletePath = objtools.deletePath;
		let setPath = objtools.setPath;

		it('getPath should fetch basic object paths', function(done) {
			expect(getPath(obj1, 'foo')).equals(obj1.foo);
			expect(getPath(obj1, 'baz')).equals(obj1.baz);
			expect(getPath(obj1, 'baz.biz')).equals(obj1.baz.biz);
			expect(getPath(obj1, 'baz.arr2.zip')).equals(undefined);
			expect(getPath(obj1, 'baz.arr.1')).equals(2);
			expect(getPath(obj1, 'baz.arr.2.zip')).equals(3);
			done();
		});

		it('getPath should obey allowSkipArrays', function(done) {
			expect(getPath(obj1, 'foo', true)).equals(obj1.foo);
			expect(getPath(obj1, 'baz', true)).equals(obj1.baz);
			expect(getPath(obj1, 'baz.biz', true)).equals(obj1.baz.biz);
			expect(getPath(obj1, 'baz.arr2.zip', true)).equals(4);
			expect(getPath(obj1, 'baz.arr.1', true)).equals(2);
			expect(getPath(obj1, 'baz.arr.2.zip', true)).equals(3);
			done();
		});

		it('getPath should handle root path', function(done) {
			expect(getPath(obj1, null)).to.deep.equal(obj1);
			done();
		});

		it('setPath should set various paths', function(done) {
			setPath(obj1, 'foo', 'biz');
			expect(obj1.foo).to.equal('biz');
			setPath(obj1, 'baz.arr.1', 8);
			expect(obj1.baz.arr[1]).to.equal(8);
			done();
		});

		it('setPath should create parent objects as necessary', function(done) {
			setPath(obj1, 'bar.biz.baz.buz', 10);
			expect(obj1.bar).to.deep.equal({ biz: { baz: { buz: 10 } } });
			done();
		});

		it('setPath should overwrite parent object on conflicting type', function(done) {
			setPath(obj1, 'baz.arr.1.buz', 11);
			expect(obj1.baz.arr[1]).to.deep.equal({ buz: 11 });
			done();
		});

		it('deletePath should delete paths', function(done) {
			deletePath(obj1, 'baz.arr');
			expect(obj1.baz.arr).to.equal(undefined);
			done();
		});

	});

	describe('merge()', function() {
		it('should pass thru falsey `object` values', function() {
			let actual = _.map(falsey, value => objtools.merge(value));
			expect(actual).to.deep.equal(falsey);
		});

		it('should not error when `object` is nullish and source objects are provided', function() {
			let expected = _.times(2, _.constant(true));
			let actual = _.map([ null, undefined ], value => _.isEqual(objtools.merge(value, { 'a': 1 }), value));
			expect(actual).to.deep.equal(expected);
		});

		it('should work as an iteratee for methods like `_.reduce`', function() {
			let array = [ { 'a': 1 }, { 'b': 2 }, { 'c': 3 } ];
			let expected = { 'a': 1, 'b': 2, 'c': 3 };
			let actual = _.reduce(array, objtools.merge, { 'a': 0 });
			expect(actual).to.deep.equal(expected);
		});

		it('should provide the correct `customizer` arguments', function() {
			let object = { 'a': 1 };
			let source = { 'a': 2 };
			let args, expected = [ 1, 2, 'a', _.cloneDeep(object), _.cloneDeep(source) ];
			objtools.merge(_.cloneDeep(object), _.cloneDeep(source), function() {
				args = _.toArray(_.cloneDeep(arguments));
			});
			expect(args).to.deep.equal(expected, 'primitive property values');

			args = null;
			object = { 'a': 1 };
			source = { 'b': 2 };
			expected = [ undefined, 2, 'b', object, source ];
			objtools.merge(_.cloneDeep(object), _.cloneDeep(source), function() {
				args = _.toArray(_.cloneDeep(arguments));
			});
			expect(args).to.deep.equal(expected, 'missing destination property');

			args = [];
			let objectValue = [ 1, 2 ];
			let sourceValue = { 'b': 2 };
			object = { 'a': objectValue };
			source = { 'a': sourceValue };
			expected = [
				[ objectValue, sourceValue, 'a', object, source ],
				// note: this differs from the lodash test bc that test is wrong
				[ undefined, 2, 'b', objectValue, sourceValue ]
			];
			objtools.merge(_.cloneDeep(object), _.cloneDeep(source), function() {
				args.push(_.toArray(_.cloneDeep(arguments)));
			});
			expect(args).to.deep.equal(expected, 'non-primitive property values');
		});

		it('should not treat the second argument as a `customizer` callback', function() {
			function callback() {}
			callback.b = 2;
			let actual = objtools.merge({ 'a': 1 }, callback);
			expect(actual).to.deep.equal({ 'a': 1, 'b': 2 });
			actual = objtools.merge({ 'a': 1 }, callback, { 'c': 3 });
			expect(actual).to.deep.equal({ 'a': 1, 'b': 2, 'c': 3 });
		});

		it('should not assign the `customizer` result if it is the same as the destination value', function() {
			_.each([ 'a', [ 'a' ], { 'a': 1 }, NaN ], function(value) {
				let object = {};
				let pass = true;
				Object.defineProperty(object, 'a', {
					'get': _.constant(value),
					'set': function() { pass = false; }
				});
				objtools.merge(object, { 'a': value }, _.identity);
				expect(pass).to.be.true;
			});
		});

		it('should merge `source` into the destination object', function() {
			const names = { 'characters': [ { 'name': 'barney' }, { 'name': 'fred' } ] };
			const ages = { 'characters': [ { 'age': 36 }, { 'age': 40 } ] };
			const heights = { 'characters': [ { 'height': '5\'4"' }, { 'height': '5\'5"' } ] };
			const expected = { 'characters': [
				{ 'name': 'barney', 'age': 36, 'height': '5\'4"' },
				{ 'name': 'fred', 'age': 40, 'height': '5\'5"' }
			] };
			expect(objtools.merge(names, ages, heights)).to.deep.equal(expected);
		});

		it('should work with four arguments', function() {
			let expected = { 'a': 4 };
			let actual = objtools.merge({ 'a': 1 }, { 'a': 2 }, { 'a': 3 }, expected);
			expect(actual).to.deep.equal(expected);
		});

		it('should assign `null` values', function() {
			let actual = objtools.merge({ 'a': 1 }, { 'a': null });
			expect(actual.a).to.equal(null);
		});

		it('should not assign `undefined` values', function() {
			let actual = objtools.merge({ 'a': 1 }, { 'a': undefined, 'b': undefined });
			expect(actual).to.deep.equal({ 'a': 1 });
		});

		it('should convert values to an array when merging with arrays of `source`', function() {
			let object = { 'a': { '1': 'y', 'b': 'z', 'length': 2 } };
			let actual = objtools.merge(object, { 'a': [ 'x' ] });
			expect(actual).to.deep.equal({ 'a': [ 'x', 'y' ] });
			actual = objtools.merge({ 'a': {} }, { 'a': [] });
			expect(actual).to.deep.equal({ 'a': [] });
		});

		it('should work with a function `object` value', function() {
			function Foo() {}
			let source = { 'a': 1 };
			let actual = objtools.merge(Foo, source);
			expect(actual === Foo);
			expect(Foo.a === 1);
		});

		it('should pass thru primitive `object` values', function() {
			let values = [ true, 1, '1' ];
			let actual = _.map(values, value => objtools.merge(value, { 'a': 1 }));
			expect(actual).to.deep.equal( values);
		});

		it('should handle merging if `customizer` returns `undefined`', function() {
			let actual = objtools.merge({ 'a': { 'b': [ 1, 1 ] } }, { 'a': { 'b': [ 0 ] } }, _.noop);
			expect(actual).to.deep.equal({ 'a': { 'b': [ 0, 1 ] } });
			actual = objtools.merge([], [ undefined ], _.identity);
			expect(actual).to.deep.equal([ undefined ]);
		});

		it('should defer to `customizer` when it returns a value other than `undefined`', function() {
			const customizer = (a, b) => (_.isArray(a) ? a.concat(b) : undefined);
			let actual = objtools.merge({ 'a': { 'b': [ 0, 1 ] } }, { 'a': { 'b': [ 2 ] } }, customizer);
			expect(actual).to.deep.equal({ 'a': { 'b': [ 0, 1, 2 ] } });
		});

	});

	describe('diffObjects()', function() {
		const a = {
			a: 'b', // value the same in all objects
			c: 'd', // value exists in all objects with different values
			e: 'f', // value only exists in some objects
			g: 'h', // value is a scalar in some objects and non-scalar in others
			i: { j: 'k' }, // value is a collection with non-overlapping fields across objects
			l: { m: 'n', o: { p: 'q' } } // value is a collection with some overlapping fields across objects
		};
		const b = {
			a: 'b',
			c: 1,
			e: 'f',
			g: { h: true },
			i: { k: 'j' },
			l: { m: 'nop' }
		};
		const c = {
			a: 'b',
			c: false,
			i: { jk: true },
			l: { m: 'no', p: 'q' }
		};
		const aScalar = 'scalar';

		it('diffs two objects', function() {
			const result = objtools.diffObjects(a, b);
			const expected = {
				c: [ 'd', 1 ],
				g: [ 'h', { h: true } ],
				i: [ { j: 'k' }, { k: 'j' } ],
				l: {
					m: [ 'n', 'nop' ],
					o: [ { p: 'q' }, null ]
				}
			};

			expect(result).to.deep.equal(expected);
		});

		it('diffs n objects', function() {
			let result = objtools.diffObjects(a, b, c);
			let expected = {
				c: [ 'd', 1, false ],
				e: [ 'f', 'f', null ],
				g: [ 'h', { h: true }, null ],
				i: [ { j: 'k' }, { k: 'j' }, { jk: true } ],
				l: {
					m: [ 'n', 'nop', 'no' ],
					o: [ { p: 'q' }, null, null ],
					p: [ null, null, 'q' ]
				}
			};
			expect(result).to.deep.equal(expected);
		});

		it('handles scalars', function() {
			let result = objtools.diffObjects(a, b, aScalar);
			let expected = _.extend([ null, null, aScalar ], {
				a: [ 'b', 'b', null ],
				c: [ 'd', 1, null ],
				e: [ 'f', 'f', null ],
				g: [ 'h', { h: true }, null ],
				i: [ { j: 'k' }, { k: 'j' }, null ],
				l: {
					m: [ 'n', 'nop', null ],
					o: [ { p: 'q' }, null, null ]
				}
			});
			expect(result).to.deep.equal(expected);
		});
	});

	describe('dottedDiff()', function() {
		const a = { a: { b: 'c', d: { e: 'f' } } };
		const b = { a: { b: 'c', d: true }, d: 'e', f: 'g' };

		it('diffs two objects', function() {
			let result = objtools.dottedDiff(a, b);
			let expected = [ 'a.d', 'd', 'f' ];
			expect(result).to.deep.equal(expected);
		});
	});
});
