const assert = require('assert');
const mergeWith = require('lodash.mergewith');
const isNil = require('lodash.isnil');
const isArray = require('lodash.isarray');
const uniq = require('lodash.uniq');
const isPlainObject = require('lodash.isplainobject');

/**
 * @fileOverview utils
 * @module lib/utils
 */

const generateSchema = require('generate-schema');
/**
 *
 * @param o
 */
module.exports.sortObject = o => {
  const sorted = {};
  let key;
  const a = [];
  for (key in o) {
    if (o.hasOwnProperty(key)) {
      a.push(key);
    }
  }
  a.sort();
  for (key = 0; key < a.length; key += 1) {
    sorted[a[key]] = o[a[key]];
  }
  return sorted;
};

/**
 *
 * @param obj
 * @returns {string}
 */
module.exports.getType = obj => {
  if ([true, false, 'true', 'false'].indexOf(obj) !== -1) {
    return 'boolean';
  }

  if (isNaN(obj)) {
    return {}.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  }

  if (`${obj}`.indexOf('.') !== -1) {
    return 'float';
  }

  return 'integer';
};

/**
 *
 * @param schema
 * @param vals
 */
const fillExamples = (schema, vals) => {
  for (const prop in schema.properties) {
    if (schema.properties[prop].type === 'object') {
      fillExamples(schema.properties[prop], vals[prop]);
    } else if (schema.properties[prop].type === 'array') {
      schema.properties[prop].example = [vals[prop][0]];
    } else {
      schema.properties[prop].example = prop === 'password' ? '******' : vals[prop];
    }
  }
};

/**
 *
 * @param json
 * @returns {{$schema}}
 */
module.exports.getSchema = json => {
  const schema = generateSchema.json(json);
  delete schema.$schema;
  fillExamples(schema, json);
  return schema;
};

module.exports.mergeSchemas = (jsonSchemas) => {
  assert(isArray(jsonSchemas) && jsonSchemas.length >= 1, 'Must merge at least 1 JSON schema.');
  return mergeWith({}, ...jsonSchemas, (mergedValue, newValue, key) => {
    if (isNil(mergedValue)) {
      return;
    }
    if (key === 'required') {
      return uniq(mergedValue.concat(newValue));
    }
    if (isPlainObject(mergedValue)) {
      if (!isPlainObject(newValue)) {
        throw new Error(`Failed to merge schemas because "${key}" has different values.`);
      }
      return;
    }
    assert.deepEqual(mergedValue, newValue, `Failed to merge schemas because "${key}" has different values: ${JSON.stringify(mergedValue)} and ${JSON.stringify(newValue)}.`);
  });
}