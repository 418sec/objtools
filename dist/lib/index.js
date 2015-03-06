"use strict";

exports.ObjectMask = require("./object-mask");

/**
 * General utility functions for manipulating object.
 *
 * @class objtools
*/

/**
 * Determines whether a value is considered a scalar or an object.  Currently,
 * primitives plus Date types plus undefined and null plus functions are considered scalar.
 *
 * @method isScalar
 * @static
 * @param {Mixed} o - Value to check
 * @return {Boolean}
 */
function isScalar(o) {
	return typeof o !== "object" || o instanceof Date || !o;
}
exports.isScalar = isScalar;

[].find();

/**
 * Checks for deep equality between two object or values.
 *
 * @method deepEquals
 * @static
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean}
 */
function deepEquals(a, b) {
	if (isScalar(a) && isScalar(b)) {
		return scalarEquals(a, b);
	}
	if (a === null || b === null || a === undefined || b === undefined) return a === b;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (var i = 0; i < a.length; i++) {
			if (!deepEquals(a[i], b[i])) return false;
		}
		return true;
	} else if (!Array.isArray(a) && !Array.isArray(b)) {
		for (var key in a) {
			if (!deepEquals(a[key], b[key])) return false;
		}
		for (var key in b) {
			if (!deepEquals(a[key], b[key])) return false;
		}
		return true;
	} else {
		return false;
	}
}
exports.deepEquals = deepEquals;

/**
 * Checks whether two scalar values (as determined by isScalar()) are equal.
 *
 * @method scalarEquals
 * @static
 * @param {Mixed} a1 - First value
 * @param {Mixed} a2 - Second value
 * @return {Boolean}
 */
function scalarEquals(a1, a2) {
	if (a1 instanceof Date && a2 instanceof Date) return a1.getTime() === a2.getTime();
	return a1 === a2;
}
exports.scalarEquals = scalarEquals;

/**
 * Returns a deep copy of the given value such that entities are not passed
 * by reference.
 *
 * @method deepCopy
 * @static
 * @param {Mixed} obj - The object or value to copy
 * @return {Mixed}
 */
function deepCopy(obj) {
	var res = undefined;
	var i = undefined;
	var key = undefined;
	if (isScalar(obj)) return obj;
	if (Array.isArray(obj)) {
		res = [];
		for (i = 0; i < obj.length; i++) {
			res.push(deepCopy(obj[i]));
		}
	} else {
		res = {};
		for (key in obj) {
			res[key] = deepCopy(obj[key]);
		}
	}
	return res;
}
exports.deepCopy = deepCopy;

/**
 * Given an object, converts it into a one-level-deep object where the keys are dot-separated
 * paths and the values are the values at those paths.
 *
 * @method collapseToDotted
 * @static
 * @param {Object} obj - The object to convert
 * @param {Boolean} [includeRedundantLevels] - If set to true, the returned object also includes
 * keys for internal objects.  By default, an object such as { foo: { bar: "baz"} } will be converted
 * into { "foo.bar": "baz" }.  If includeRedundantLevels is set, it will instead be converted
 * into { "foo": { bar: "baz" }, "foo.bar": "baz" } .
 * @param {Boolean} [stopAtArrays] - If set to true, the collapsing function will not descend into
 * arrays.
 * @example
 *   By default, an object such as { foo: [ "bar", "baz" ] } is converted
 *   into { "foo.0": "bar", "foo.1": "baz" }.  If stopAtArrays is set, this will instead be converted
 *   into { "foo": [ "bar", "baz" ] } .
 * @return {Object} - The result
 */
function collapseToDotted(obj, includeRedundantLevels, stopAtArrays) {
	var result = {};
	if (isScalar(obj)) return {};
	function addObj(obj, path) {
		var key = undefined;
		if (isScalar(obj) || Array.isArray(obj) && stopAtArrays) {
			result[path] = obj;
			return;
		}
		if (includeRedundantLevels) {
			result[path] = obj;
		}
		for (key in obj) {
			addObj(obj[key], path ? path + "." + key : key);
		}
	}
	addObj(obj, "");
	delete result[""];
	return result;
}
exports.collapseToDotted = collapseToDotted;

/**
 * Returns whether or not the given query fields (in dotted notation) match the document
 * (also in dotted notation).  The "queries" here are simple equality matches.
 *
 * @method matchDottedObject
 * @static
 * @param {Object} doc - The document to test
 * @param {Object} query - A one-layer-deep set of key/values to check doc for
 * @return {Boolean} - Whether or not the doc matches
 */
function matchDottedObject(doc, query) {
	var queryKey = undefined;
	if (query === true) return doc === true;
	if (isScalar(query) || isScalar(doc)) return deepEquals(query, doc);
	for (queryKey in query) {
		if (!deepEquals(doc[queryKey], query[queryKey])) {
			return false;
		}
	}
	return true;
}
exports.matchDottedObject = matchDottedObject;

/**
 * Same as matchDottedObject, but allows for non-dotted objects and queries.
 *
 * @method matchObject
 * @static
 * @param {Object} doc - Object to match against, in structured (not dotted) form
 * @param {Object} query - Set of fields (either dotted or structured) to match
 * @return {Boolean} - Whether or not the object matches
 */
function matchObject(doc, query) {
	return matchDottedObject(exports.collapseToDotted(doc), exports.collapseToDotted(query));
}
exports.matchObject = matchObject;

/**
 * Sets the value at a given path in an object.
 *
 * @method setPath
 * @static
 * @param {Object} obj - The object
 * @param {String} path - The path, dot-separated
 * @param {Mixed} value - Value to set
 * @return {Object} - The same object
 */
function setPath(obj, path, value) {
	var cur = obj;
	var parts = path.split(".");
	for (var i = 0; i < parts.length; i++) {
		if (i === parts.length - 1) {
			cur[parts[i]] = value;
		} else {
			if (isScalar(cur[parts[i]])) cur[parts[i]] = {};
			cur = cur[parts[i]];
		}
	}
	return obj;
}
exports.setPath = setPath;

/**
 * Deletes the value at a given path in an object.
 *
 * @method deletePath
 * @static
 * @param {Object} obj
 * @param {String} path
 * @return {Object} - The object that was passed in
 */
function deletePath(obj, path) {
	var cur = obj;
	var parts = path.split(".");
	for (var i = 0; i < parts.length; i++) {
		if (i === parts.length - 1) {
			delete cur[parts[i]];
		} else {
			if (isScalar(cur[parts[i]])) {
				return obj;
			}
			cur = cur[parts[i]];
		}
	}
	return obj;
}
exports.deletePath = deletePath;

/**
 * Gets the value at a given path in an object.
 *
 * @method getPath
 * @static
 * @param {Object} obj - The object
 * @param {String} path - The path, dot-separated
 * @param {Boolean} allowSkipArrays - If true: If a field in an object is an array and the
 * path key is non-numeric, and the array has exactly 1 element, then the first element
 * of the array is used.
 * @return {Mixed} - The value at the path
 */
function getPath(obj, path, allowSkipArrays) {
	if (path === null || path === undefined) return obj;
	var cur = obj;
	var parts = path.split(".");
	for (var i = 0; i < parts.length; i++) {
		if (isScalar(cur)) return undefined;
		if (Array.isArray(cur) && allowSkipArrays && !/^[0-9]+$/.test(parts[i]) && cur.length === 1) {
			cur = cur[0];
			i--;
		} else {
			cur = cur[parts[i]];
		}
	}
	return cur;
}
exports.getPath = getPath;
//# sourceMappingURL=data:application/json;base64,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LE9BQU8sQ0FBQyIsImZpbGUiOiJsaWIvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnRzLk9iamVjdE1hc2sgPSByZXF1aXJlKCcuL29iamVjdC1tYXNrJyk7XG5cbi8qKlxuICogR2VuZXJhbCB1dGlsaXR5IGZ1bmN0aW9ucyBmb3IgbWFuaXB1bGF0aW5nIG9iamVjdC5cbiAqXG4gKiBAY2xhc3Mgb2JqdG9vbHNcbiovXG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgdmFsdWUgaXMgY29uc2lkZXJlZCBhIHNjYWxhciBvciBhbiBvYmplY3QuICBDdXJyZW50bHksXG4gKiBwcmltaXRpdmVzIHBsdXMgRGF0ZSB0eXBlcyBwbHVzIHVuZGVmaW5lZCBhbmQgbnVsbCBwbHVzIGZ1bmN0aW9ucyBhcmUgY29uc2lkZXJlZCBzY2FsYXIuXG4gKlxuICogQG1ldGhvZCBpc1NjYWxhclxuICogQHN0YXRpY1xuICogQHBhcmFtIHtNaXhlZH0gbyAtIFZhbHVlIHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBpc1NjYWxhcihvKSB7XG5cdHJldHVybiB0eXBlb2YgbyAhPT0gJ29iamVjdCcgfHwgKG8gaW5zdGFuY2VvZiBEYXRlKSB8fCAhbztcbn1cbmV4cG9ydHMuaXNTY2FsYXIgPSBpc1NjYWxhcjtcblxuW10uZmluZCgpO1xuXG4vKipcbiAqIENoZWNrcyBmb3IgZGVlcCBlcXVhbGl0eSBiZXR3ZWVuIHR3byBvYmplY3Qgb3IgdmFsdWVzLlxuICpcbiAqIEBtZXRob2QgZGVlcEVxdWFsc1xuICogQHN0YXRpY1xuICogQHBhcmFtIHtNaXhlZH0gYVxuICogQHBhcmFtIHtNaXhlZH0gYlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gZGVlcEVxdWFscyhhLCBiKSB7XG5cdGlmIChpc1NjYWxhcihhKSAmJiBpc1NjYWxhcihiKSkge1xuXHRcdHJldHVybiBzY2FsYXJFcXVhbHMoYSwgYik7XG5cdH1cblx0aWYgKGEgPT09IG51bGwgfHwgYiA9PT0gbnVsbCB8fCBhID09PSB1bmRlZmluZWQgfHwgYiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gYSA9PT0gYjtcblx0aWYgKEFycmF5LmlzQXJyYXkoYSkgJiYgQXJyYXkuaXNBcnJheShiKSkge1xuXHRcdGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICghZGVlcEVxdWFscyhhW2ldLCBiW2ldKSkgcmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShhKSAmJiAhQXJyYXkuaXNBcnJheShiKSkge1xuXHRcdGZvciAobGV0IGtleSBpbiBhKSB7XG5cdFx0XHRpZiAoIWRlZXBFcXVhbHMoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdGZvciAobGV0IGtleSBpbiBiKSB7XG5cdFx0XHRpZiAoIWRlZXBFcXVhbHMoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuZXhwb3J0cy5kZWVwRXF1YWxzID0gZGVlcEVxdWFscztcblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0d28gc2NhbGFyIHZhbHVlcyAoYXMgZGV0ZXJtaW5lZCBieSBpc1NjYWxhcigpKSBhcmUgZXF1YWwuXG4gKlxuICogQG1ldGhvZCBzY2FsYXJFcXVhbHNcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7TWl4ZWR9IGExIC0gRmlyc3QgdmFsdWVcbiAqIEBwYXJhbSB7TWl4ZWR9IGEyIC0gU2Vjb25kIHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBzY2FsYXJFcXVhbHMoYTEsIGEyKSB7XG5cdGlmIChhMSBpbnN0YW5jZW9mIERhdGUgJiYgYTIgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gKGExLmdldFRpbWUoKSA9PT0gYTIuZ2V0VGltZSgpKTtcblx0cmV0dXJuIGExID09PSBhMjtcbn1cbmV4cG9ydHMuc2NhbGFyRXF1YWxzID0gc2NhbGFyRXF1YWxzO1xuXG4vKipcbiAqIFJldHVybnMgYSBkZWVwIGNvcHkgb2YgdGhlIGdpdmVuIHZhbHVlIHN1Y2ggdGhhdCBlbnRpdGllcyBhcmUgbm90IHBhc3NlZFxuICogYnkgcmVmZXJlbmNlLlxuICpcbiAqIEBtZXRob2QgZGVlcENvcHlcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7TWl4ZWR9IG9iaiAtIFRoZSBvYmplY3Qgb3IgdmFsdWUgdG8gY29weVxuICogQHJldHVybiB7TWl4ZWR9XG4gKi9cbmZ1bmN0aW9uIGRlZXBDb3B5KG9iaikge1xuXHRsZXQgcmVzO1xuXHRsZXQgaTtcblx0bGV0IGtleTtcblx0aWYgKGlzU2NhbGFyKG9iaikpIHJldHVybiBvYmo7XG5cdGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcblx0XHRyZXMgPSBbXTtcblx0XHRmb3IgKGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRyZXMucHVzaChkZWVwQ29weShvYmpbaV0pKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVzID0ge307XG5cdFx0Zm9yIChrZXkgaW4gb2JqKSB7XG5cdFx0XHRyZXNba2V5XSA9IGRlZXBDb3B5KG9ialtrZXldKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlcztcbn1cbmV4cG9ydHMuZGVlcENvcHkgPSBkZWVwQ29weTtcblxuLyoqXG4gKiBHaXZlbiBhbiBvYmplY3QsIGNvbnZlcnRzIGl0IGludG8gYSBvbmUtbGV2ZWwtZGVlcCBvYmplY3Qgd2hlcmUgdGhlIGtleXMgYXJlIGRvdC1zZXBhcmF0ZWRcbiAqIHBhdGhzIGFuZCB0aGUgdmFsdWVzIGFyZSB0aGUgdmFsdWVzIGF0IHRob3NlIHBhdGhzLlxuICpcbiAqIEBtZXRob2QgY29sbGFwc2VUb0RvdHRlZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtPYmplY3R9IG9iaiAtIFRoZSBvYmplY3QgdG8gY29udmVydFxuICogQHBhcmFtIHtCb29sZWFufSBbaW5jbHVkZVJlZHVuZGFudExldmVsc10gLSBJZiBzZXQgdG8gdHJ1ZSwgdGhlIHJldHVybmVkIG9iamVjdCBhbHNvIGluY2x1ZGVzXG4gKiBrZXlzIGZvciBpbnRlcm5hbCBvYmplY3RzLiAgQnkgZGVmYXVsdCwgYW4gb2JqZWN0IHN1Y2ggYXMgeyBmb286IHsgYmFyOiBcImJhelwifSB9IHdpbGwgYmUgY29udmVydGVkXG4gKiBpbnRvIHsgXCJmb28uYmFyXCI6IFwiYmF6XCIgfS4gIElmIGluY2x1ZGVSZWR1bmRhbnRMZXZlbHMgaXMgc2V0LCBpdCB3aWxsIGluc3RlYWQgYmUgY29udmVydGVkXG4gKiBpbnRvIHsgXCJmb29cIjogeyBiYXI6IFwiYmF6XCIgfSwgXCJmb28uYmFyXCI6IFwiYmF6XCIgfSAuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtzdG9wQXRBcnJheXNdIC0gSWYgc2V0IHRvIHRydWUsIHRoZSBjb2xsYXBzaW5nIGZ1bmN0aW9uIHdpbGwgbm90IGRlc2NlbmQgaW50b1xuICogYXJyYXlzLlxuICogQGV4YW1wbGVcbiAqICAgQnkgZGVmYXVsdCwgYW4gb2JqZWN0IHN1Y2ggYXMgeyBmb286IFsgXCJiYXJcIiwgXCJiYXpcIiBdIH0gaXMgY29udmVydGVkXG4gKiAgIGludG8geyBcImZvby4wXCI6IFwiYmFyXCIsIFwiZm9vLjFcIjogXCJiYXpcIiB9LiAgSWYgc3RvcEF0QXJyYXlzIGlzIHNldCwgdGhpcyB3aWxsIGluc3RlYWQgYmUgY29udmVydGVkXG4gKiAgIGludG8geyBcImZvb1wiOiBbIFwiYmFyXCIsIFwiYmF6XCIgXSB9IC5cbiAqIEByZXR1cm4ge09iamVjdH0gLSBUaGUgcmVzdWx0XG4gKi9cbmZ1bmN0aW9uIGNvbGxhcHNlVG9Eb3R0ZWQob2JqLCBpbmNsdWRlUmVkdW5kYW50TGV2ZWxzLCBzdG9wQXRBcnJheXMpIHtcblx0bGV0IHJlc3VsdCA9IHt9O1xuXHRpZiAoaXNTY2FsYXIob2JqKSkgcmV0dXJuIHt9O1xuXHRmdW5jdGlvbiBhZGRPYmoob2JqLCBwYXRoKSB7XG5cdFx0bGV0IGtleTtcblx0XHRpZiAoaXNTY2FsYXIob2JqKSB8fCAoQXJyYXkuaXNBcnJheShvYmopICYmIHN0b3BBdEFycmF5cykpIHtcblx0XHRcdHJlc3VsdFtwYXRoXSA9IG9iajtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKGluY2x1ZGVSZWR1bmRhbnRMZXZlbHMpIHtcblx0XHRcdHJlc3VsdFtwYXRoXSA9IG9iajtcblx0XHR9XG5cdFx0Zm9yIChrZXkgaW4gb2JqKSB7XG5cdFx0XHRhZGRPYmoob2JqW2tleV0sIHBhdGggPyAocGF0aCArICcuJyArIGtleSkgOiBrZXkpO1xuXHRcdH1cblx0fVxuXHRhZGRPYmoob2JqLCAnJyk7XG5cdGRlbGV0ZSByZXN1bHRbJyddO1xuXHRyZXR1cm4gcmVzdWx0O1xufVxuZXhwb3J0cy5jb2xsYXBzZVRvRG90dGVkID0gY29sbGFwc2VUb0RvdHRlZDtcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBxdWVyeSBmaWVsZHMgKGluIGRvdHRlZCBub3RhdGlvbikgbWF0Y2ggdGhlIGRvY3VtZW50XG4gKiAoYWxzbyBpbiBkb3R0ZWQgbm90YXRpb24pLiAgVGhlIFwicXVlcmllc1wiIGhlcmUgYXJlIHNpbXBsZSBlcXVhbGl0eSBtYXRjaGVzLlxuICpcbiAqIEBtZXRob2QgbWF0Y2hEb3R0ZWRPYmplY3RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkb2MgLSBUaGUgZG9jdW1lbnQgdG8gdGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHF1ZXJ5IC0gQSBvbmUtbGF5ZXItZGVlcCBzZXQgb2Yga2V5L3ZhbHVlcyB0byBjaGVjayBkb2MgZm9yXG4gKiBAcmV0dXJuIHtCb29sZWFufSAtIFdoZXRoZXIgb3Igbm90IHRoZSBkb2MgbWF0Y2hlc1xuICovXG5mdW5jdGlvbiBtYXRjaERvdHRlZE9iamVjdChkb2MsIHF1ZXJ5KSB7XG5cdGxldCBxdWVyeUtleTtcblx0aWYgKHF1ZXJ5ID09PSB0cnVlKSByZXR1cm4gZG9jID09PSB0cnVlO1xuXHRpZiAoaXNTY2FsYXIocXVlcnkpIHx8IGlzU2NhbGFyKGRvYykpIHJldHVybiBkZWVwRXF1YWxzKHF1ZXJ5LCBkb2MpO1xuXHRmb3IgKHF1ZXJ5S2V5IGluIHF1ZXJ5KSB7XG5cdFx0aWYgKCFkZWVwRXF1YWxzKGRvY1txdWVyeUtleV0sIHF1ZXJ5W3F1ZXJ5S2V5XSkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRydWU7XG59XG5leHBvcnRzLm1hdGNoRG90dGVkT2JqZWN0ID0gbWF0Y2hEb3R0ZWRPYmplY3Q7XG5cbi8qKlxuICogU2FtZSBhcyBtYXRjaERvdHRlZE9iamVjdCwgYnV0IGFsbG93cyBmb3Igbm9uLWRvdHRlZCBvYmplY3RzIGFuZCBxdWVyaWVzLlxuICpcbiAqIEBtZXRob2QgbWF0Y2hPYmplY3RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkb2MgLSBPYmplY3QgdG8gbWF0Y2ggYWdhaW5zdCwgaW4gc3RydWN0dXJlZCAobm90IGRvdHRlZCkgZm9ybVxuICogQHBhcmFtIHtPYmplY3R9IHF1ZXJ5IC0gU2V0IG9mIGZpZWxkcyAoZWl0aGVyIGRvdHRlZCBvciBzdHJ1Y3R1cmVkKSB0byBtYXRjaFxuICogQHJldHVybiB7Qm9vbGVhbn0gLSBXaGV0aGVyIG9yIG5vdCB0aGUgb2JqZWN0IG1hdGNoZXNcbiAqL1xuZnVuY3Rpb24gbWF0Y2hPYmplY3QoZG9jLCBxdWVyeSkge1xuXHRyZXR1cm4gbWF0Y2hEb3R0ZWRPYmplY3QoZXhwb3J0cy5jb2xsYXBzZVRvRG90dGVkKGRvYyksIGV4cG9ydHMuY29sbGFwc2VUb0RvdHRlZChxdWVyeSkpO1xufVxuZXhwb3J0cy5tYXRjaE9iamVjdCA9IG1hdGNoT2JqZWN0O1xuXG4vKipcbiAqIFNldHMgdGhlIHZhbHVlIGF0IGEgZ2l2ZW4gcGF0aCBpbiBhbiBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBzZXRQYXRoXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIC0gVGhlIG9iamVjdFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBUaGUgcGF0aCwgZG90LXNlcGFyYXRlZFxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgLSBWYWx1ZSB0byBzZXRcbiAqIEByZXR1cm4ge09iamVjdH0gLSBUaGUgc2FtZSBvYmplY3RcbiAqL1xuZnVuY3Rpb24gc2V0UGF0aChvYmosIHBhdGgsIHZhbHVlKSB7XG5cdGxldCBjdXIgPSBvYmo7XG5cdGxldCBwYXJ0cyA9IHBhdGguc3BsaXQoJy4nKTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChpID09PSBwYXJ0cy5sZW5ndGggLSAxKSB7XG5cdFx0XHRjdXJbcGFydHNbaV1dID0gdmFsdWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChpc1NjYWxhcihjdXJbcGFydHNbaV1dKSkgY3VyW3BhcnRzW2ldXSA9IHt9O1xuXHRcdFx0Y3VyID0gY3VyW3BhcnRzW2ldXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG9iajtcbn1cbmV4cG9ydHMuc2V0UGF0aCA9IHNldFBhdGg7XG5cbi8qKlxuICogRGVsZXRlcyB0aGUgdmFsdWUgYXQgYSBnaXZlbiBwYXRoIGluIGFuIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIGRlbGV0ZVBhdGhcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gKiBAcmV0dXJuIHtPYmplY3R9IC0gVGhlIG9iamVjdCB0aGF0IHdhcyBwYXNzZWQgaW5cbiAqL1xuZnVuY3Rpb24gZGVsZXRlUGF0aChvYmosIHBhdGgpIHtcblx0bGV0IGN1ciA9IG9iajtcblx0bGV0IHBhcnRzID0gcGF0aC5zcGxpdCgnLicpO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKGkgPT09IHBhcnRzLmxlbmd0aCAtIDEpIHtcblx0XHRcdGRlbGV0ZSBjdXJbcGFydHNbaV1dO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoaXNTY2FsYXIoY3VyW3BhcnRzW2ldXSkpIHtcblx0XHRcdFx0cmV0dXJuIG9iajtcblx0XHRcdH1cblx0XHRcdGN1ciA9IGN1cltwYXJ0c1tpXV07XG5cdFx0fVxuXHR9XG5cdHJldHVybiBvYmo7XG59XG5leHBvcnRzLmRlbGV0ZVBhdGggPSBkZWxldGVQYXRoO1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIGF0IGEgZ2l2ZW4gcGF0aCBpbiBhbiBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBnZXRQYXRoXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIC0gVGhlIG9iamVjdFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBUaGUgcGF0aCwgZG90LXNlcGFyYXRlZFxuICogQHBhcmFtIHtCb29sZWFufSBhbGxvd1NraXBBcnJheXMgLSBJZiB0cnVlOiBJZiBhIGZpZWxkIGluIGFuIG9iamVjdCBpcyBhbiBhcnJheSBhbmQgdGhlXG4gKiBwYXRoIGtleSBpcyBub24tbnVtZXJpYywgYW5kIHRoZSBhcnJheSBoYXMgZXhhY3RseSAxIGVsZW1lbnQsIHRoZW4gdGhlIGZpcnN0IGVsZW1lbnRcbiAqIG9mIHRoZSBhcnJheSBpcyB1c2VkLlxuICogQHJldHVybiB7TWl4ZWR9IC0gVGhlIHZhbHVlIGF0IHRoZSBwYXRoXG4gKi9cbmZ1bmN0aW9uIGdldFBhdGgob2JqLCBwYXRoLCBhbGxvd1NraXBBcnJheXMpIHtcblx0aWYgKHBhdGggPT09IG51bGwgfHwgcGF0aCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gb2JqO1xuXHRsZXQgY3VyID0gb2JqO1xuXHRsZXQgcGFydHMgPSBwYXRoLnNwbGl0KCcuJyk7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAoaXNTY2FsYXIoY3VyKSkgcmV0dXJuIHVuZGVmaW5lZDtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShjdXIpICYmIGFsbG93U2tpcEFycmF5cyAmJiAhKC9eWzAtOV0rJC8udGVzdChwYXJ0c1tpXSkpICYmIGN1ci5sZW5ndGggPT09IDEpIHtcblx0XHRcdGN1ciA9IGN1clswXTtcblx0XHRcdGktLTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y3VyID0gY3VyW3BhcnRzW2ldXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGN1cjtcbn1cbmV4cG9ydHMuZ2V0UGF0aCA9IGdldFBhdGg7XG5cbiJdfQ==