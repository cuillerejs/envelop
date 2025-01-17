import { useLogger, enableIf } from '@envelop/core';
import { createTestkit, createSpiedPlugin } from '@envelop/testing';
import { getIntrospectionQuery, parse } from 'graphql';
import { isIntrospectionDocument } from '../src/utils.js';
import { query, schema } from './common.js';

describe('Utils', () => {
  describe('isIntrospectionDocument', () => {
    it('Should return false on non-introspection', () => {
      const doc = `query test { f }`;

      expect(isIntrospectionDocument(parse(doc))).toBeFalsy();
    });
    const introspectionFields = ['__schema', '__type'];
    introspectionFields.forEach(introspectionFieldName => {
      it(`Should detect ${introspectionFieldName} original introspection query`, () => {
        const doc = getIntrospectionQuery();

        expect(isIntrospectionDocument(parse(doc))).toBeTruthy();
      });

      it('Should detect minimal introspection', () => {
        const doc = `query { ${introspectionFieldName} { test }}`;

        expect(isIntrospectionDocument(parse(doc))).toBeTruthy();
      });

      it('Should detect alias tricks', () => {
        const doc = `query { test: ${introspectionFieldName} { test }}`;

        expect(isIntrospectionDocument(parse(doc))).toBeTruthy();
      });

      it('Should detect inline fragment tricks', () => {
        const doc = `query { ... on Query { ${introspectionFieldName} { test } } }`;

        expect(isIntrospectionDocument(parse(doc))).toBeTruthy();
      });

      it('should detect fragment spread tricks', () => {
        const doc = `fragment Fragment on Query { ${introspectionFieldName} } query { ...Fragment }`;

        expect(isIntrospectionDocument(parse(doc))).toBeTruthy();
      });
    });
  });

  describe('enableIf', () => {
    it('Should return a plugin', () => {
      const plugin = enableIf(true, useLogger());
      expect(plugin).toBeTruthy();
    });

    it('Should return null', () => {
      const plugin = enableIf(false, useLogger());
      expect(plugin).toBeFalsy();
    });

    it('Should not init plugin', async () => {
      const spiedPlugin = createSpiedPlugin();
      const testkit = createTestkit([enableIf(false, spiedPlugin.plugin)], schema);
      await testkit.execute(query);
      expect(spiedPlugin.spies.beforeExecute).not.toHaveBeenCalled();
    });

    it('Should init plugin', async () => {
      const spiedPlugin = createSpiedPlugin();
      const testkit = createTestkit([enableIf(true, spiedPlugin.plugin)], schema);
      await testkit.execute(query);
      expect(spiedPlugin.spies.beforeExecute).toHaveBeenCalled();
    });
  });
});
