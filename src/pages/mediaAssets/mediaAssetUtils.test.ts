import { describe, expect, it } from 'vitest';
import {
    countMediaUsages,
    parseRecordTags,
    parseTagsInput,
    removeMediaReferenceFromArray,
    stringifyTags,
} from './mediaAssetUtils';

describe('mediaAssetUtils', () => {
    it('parses tags input into normalized array', () => {
        expect(parseTagsInput('hero, sale,  social  ,')).toEqual(['hero', 'sale', 'social']);
    });

    it('parses record tags from JSON string', () => {
        expect(parseRecordTags('["one","two"]')).toEqual(['one', 'two']);
    });

    it('parses record tags from plain string fallback', () => {
        expect(parseRecordTags('alpha, beta')).toEqual(['alpha', 'beta']);
    });

    it('stringifies tags for storage', () => {
        expect(stringifyTags(['a', 'b'])).toBe('["a","b"]');
    });

    it('removes media reference from relation arrays', () => {
        expect(removeMediaReferenceFromArray(['m1', 'm2', 'm1'], 'm1')).toEqual(['m2']);
    });

    it('counts references across related collections', () => {
        const total = countMediaUsages({
            brands: [{ id: 'b1' }],
            customers: [{ id: 'c1' }, { id: 'c2' }],
            masterContents: [{ id: 'mc1' }],
            platformVariants: [],
        });
        expect(total).toBe(4);
    });
});
