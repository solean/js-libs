// Copyright 2015-2018 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

const BigNumber = require('bignumber.js');

const Event = require('./event');
const EventParam = require('./eventParam');
const DecodedLogParam = require('./decodedLogParam');
const ParamType = require('../paramType');
const Token = require('../../token');

describe('spec/event/Event', () => {
  const inputArr = [{ name: 'a', type: 'bool' }, { name: 'b', type: 'uint', indexed: true }];
  const inputs = [new EventParam('a', 'bool', false), new EventParam('b', 'uint', true)];
  const event = new Event({ name: 'test', inputs: inputArr, anonymous: true });

  describe('constructor', () => {
    it('stores the parameters as received', () => {
      expect(event.name).toEqual('test');
      expect(event.inputs).to.deep.equal(inputs);
      expect(event.anonymous).toBe.true;
    });

    it('matches empty inputs with []', () => {
      expect(new Event({ name: 'test' }).inputs).to.deep.equal([]);
    });

    it('sets the event signature', () => {
      expect(new Event({ name: 'baz' }).signature)
        .toEqual('a7916fac4f538170f7cd12c148552e2cba9fcd72329a2dd5b07a6fa906488ddf');
    });
  });

  describe('inputParamTypes', () => {
    it('returns all the types', () => {
      expect(event.inputParamTypes()).to.deep.equal([new ParamType('bool'), new ParamType('uint', null, 256, true)]);
    });
  });

  describe('inputParamNames', () => {
    it('returns all the names', () => {
      expect(event.inputParamNames()).to.deep.equal(['a', 'b']);
    });
  });

  describe('indexedParams', () => {
    it('returns all indexed parameters (indexed)', () => {
      expect(event.indexedParams(true)).to.deep.equal([inputs[1]]);
    });

    it('returns all indexed parameters (non-indexed)', () => {
      expect(event.indexedParams(false)).to.deep.equal([inputs[0]]);
    });
  });

  describe('decodeLog', () => {
    it('decodes an event', () => {
      const event = new Event({
        name: 'foo',
        inputs: [
          { name: 'a', type: 'int' },
          { name: 'b', type: 'int', indexed: true },
          { name: 'c', type: 'address' },
          { name: 'd', type: 'address', indexed: true }
        ]
      });
      const decoded = event.decodeLog([
        '0000000000000000000000004444444444444444444444444444444444444444',
        '0000000000000000000000000000000000000000000000000000000000000002',
        '0000000000000000000000001111111111111111111111111111111111111111'
      ],
      '00000000000000000000000000000000000000000000000000000000000000030000000000000000000000002222222222222222222222222222222222222222');

      expect(decoded.address).toEqual('0x4444444444444444444444444444444444444444');
      expect(decoded.params).to.deep.equal([
        new DecodedLogParam('a', new ParamType('int', null, 256), new Token('int', new BigNumber(3))),
        new DecodedLogParam('b', new ParamType('int', null, 256, true), new Token('int', new BigNumber(2))),
        new DecodedLogParam('c', new ParamType('address'), new Token('address', '0x2222222222222222222222222222222222222222')),
        new DecodedLogParam('d', new ParamType('address', null, 0, true), new Token('address', '0x1111111111111111111111111111111111111111'))
      ]);
    });

    it('decodes an anonymous event', () => {
      const event = new Event({ name: 'foo', inputs: [{ name: 'a', type: 'int' }], anonymous: true });
      const decoded = event.decodeLog([], '0000000000000000000000000000000000000000000000000000000000000003');

      expect(decoded.address).to.not.be.ok;
      expect(decoded.params).to.deep.equal([
        new DecodedLogParam('a', new ParamType('int', null, 256), new Token('int', new BigNumber(3)))
      ]);
    });

    it('throws on invalid topics', () => {
      const event = new Event({ name: 'foo', inputs: [{ name: 'a', type: 'int' }], anonymous: true });

      expect(() => event.decodeLog(['0000000000000000000000004444444444444444444444444444444444444444'], '0000000000000000000000000000000000000000000000000000000000000003')).to.throw(/Invalid/);
    });
  });

  describe('getters', () => {
    it('has the anonymous flag', () => {
      expect(event.anonymous).toBe.true;
    });

    it('has the id', () => {
      expect(event.id).toEqual('test(bool,uint256)');
    });

    it('has the inputs', () => {
      expect(event.inputs).to.deep.equal(EventParam.toEventParams(inputArr));
    });

    it('has the name', () => {
      expect(event.name).toEqual('test');
    });

    it('has the signature', () => {
      expect(event.signature).toEqual('c6a64c1fca84a416d1cb4ffc520e996e959fdf982da96a0e5449b17c9532ed4e');
    });
  });
});
