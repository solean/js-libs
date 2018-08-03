// Copyright 2015-2018 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import { MediateType } from '../types';
import { padU32 } from '../util/pad';

const TYPES: MediateType[] = ['raw', 'prefixed', 'fixedArray', 'array'];

type RawValue = number | string;
type ArrayValue = RawValue[] | Mediate[];
type MediateValue = RawValue | ArrayValue;

class Mediate {
  private _type: MediateType;
  private _value: MediateValue;

  constructor(type: MediateType, value: MediateValue) {
    Mediate.validateType(type);

    this._type = type;
    this._value = value;
  }

  static offsetFor(mediates: Mediate[], position: number) {
    if (position < 0 || position >= mediates.length) {
      throw new Error(
        `Invalid position ${position} specified for Mediate.offsetFor`
      );
    }

    const initLength = mediates.reduce((total, mediate) => {
      return total + mediate.initLength();
    }, 0);

    return mediates.slice(0, position).reduce((total, mediate) => {
      return total + mediate.closingLength();
    }, initLength);
  }

  static validateType(type: MediateType) {
    if (TYPES.filter(_type => type === _type).length) {
      return true;
    }

    throw new Error(`Invalid type ${type} received for Mediate.validateType`);
  }

  initLength(): number {
    switch (this._type) {
      case 'raw':
        return (this._value as string).length / 2;

      case 'array':
      case 'prefixed':
        return 32;

      case 'fixedArray':
        return (this._value as Mediate[]).reduce((total, mediate) => {
          return total + mediate.initLength();
        }, 0);
    }
  }

  closingLength(): number {
    switch (this._type) {
      case 'raw':
        return 0;

      case 'prefixed':
        return (this._value as string).length / 2;

      case 'array':
        return (this._value as Mediate[]).reduce((total, mediate) => {
          return total + mediate.initLength();
        }, 32);

      case 'fixedArray':
        return (this._value as Mediate[]).reduce((total, mediate) => {
          return total + mediate.initLength() + mediate.closingLength();
        }, 0);
    }
  }

  init(suffixOffset: number): string {
    switch (this._type) {
      case 'raw':
        return this._value as string;

      case 'fixedArray':
        return (this._value as Mediate[])
          .map((mediate, index) =>
            // @ts-ignore TODO Not sure if toString(16) is relevant, maybe toString() is enough
            mediate
              .init(Mediate.offsetFor(this._value as Mediate[], index))
              .toString(16)
          )
          .join('');

      case 'prefixed':
      case 'array':
        return padU32(suffixOffset);
    }
  }

  closing(offset: number): string {
    switch (this._type) {
      case 'raw':
        return '';

      case 'prefixed':
        return this._value as string;

      case 'fixedArray':
        return (this._value as Mediate[])
          .map((mediate: Mediate, index: number) =>
            // @ts-ignore TODO Not sure if toString(16) is relevant, maybe toString() is enough
            mediate
              .closing(Mediate.offsetFor(this._value as Mediate[], index))
              .toString(16)
          )
          .join('');

      case 'array':
        const prefix = padU32((this._value as Mediate[]).length);
        const inits = (this._value as Mediate[])
          .map((mediate: Mediate, index: number) =>
            // @ts-ignore TODO Not sure if toString(16) is relevant, maybe toString() is enough
            mediate
              .init(
                offset + Mediate.offsetFor(this._value as Mediate[], index) + 32
              )
              .toString(16)
          )
          .join('');
        const closings = (this._value as Mediate[])
          .map((mediate: Mediate, index: number) =>
            // @ts-ignore TODO Not sure if toString(16) is relevant, maybe toString() is enough
            mediate
              .closing(
                offset + Mediate.offsetFor(this._value as Mediate[], index)
              )
              .toString(16)
          )
          .join('');

        return `${prefix}${inits}${closings}`;
    }
  }

  get type() {
    return this._type;
  }

  get value() {
    return this._value;
  }
}

export default Mediate;
