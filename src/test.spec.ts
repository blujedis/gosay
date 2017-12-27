import * as chai from 'chai';
import * as mocha from 'mocha';
import { Colurs } from 'colurs';
import { Gosay } from './';
import * as pp from 'passpipe';

const expect = chai.expect;
const should = chai.should;
const assert = chai.assert;

const colurs = new Colurs();
const gosay = new Gosay();

describe('Gosay', () => {

  before((done) => {
    done();
  });

  it('should do something.', () => {
    // Placeholder.
  });

});