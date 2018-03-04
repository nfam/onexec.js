import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import Onexec from "../src/onexec";

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('Onexec', function() {
    describe('single run', function() {
        it('should successfully run with value returned', function(done) {
            var onexec = new Onexec<string>((token) => token);
            expect(onexec.run('test')).eventually.equal('test').notify(done);
        });
        it('should successfully run with promise returned', function(done) {
            var onexec = new Onexec<string>((token) => Promise.resolve(token));
            expect(onexec.run('test')).eventually.equal('test').notify(done);
        });
        it('should return a rejected promise', function(done) {
            var onexec = new Onexec<string>((token) => Promise.reject('rejected'));
            expect(onexec.run('test')).to.eventually.rejectedWith('rejected').notify(done);
        });
        it('should return a rejected promise by throwing', function(done) {
            var onexec = new Onexec<string>((token) => {
                throw new Error('rejected')
            });
            expect(onexec.run('test')).to.eventually.rejectedWith('rejected').notify(done);
        });
        it('should have requestedOn and completedOn set', function(done) {
            var onexec = new Onexec<string>((token) => token);
            onexec.run('test')
            .then(() => {
                expect(onexec.completedOn.getTime()).to.gte(onexec.requestedOn.getTime());
                done();
            })
            .catch(done);
        });
    });
    describe('multiple run', function() {
        it('should return the previous token', function(done) {
            var onexec = new Onexec<string>((token) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(token)
                    }, 10);
                });
            });
            onexec.run(1);
            expect(onexec.run(2)).to.eventually.equal(1).notify(done);
        });
        it('should return the previous error', function(done) {
            var onexec = new Onexec<string>((token) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(token)
                    }, 10);
                });
            });
            onexec.run('1').catch(() => {});
            expect(onexec.run('2')).to.eventually.rejectedWith('1').notify(done);
        });
    });
    describe('wait', function() {
        it('should wait on nothing', function(done) {
            var onexec = new Onexec<string>((token) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(token)
                    }, 10);
                });
            });
            expect(onexec.wait()).to.eventually.notify(done);
        });
        it('should wait on fulfilled', function(done) {
            var onexec = new Onexec<string>((token) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(token)
                    }, 10);
                });
            });
            onexec.run(1);
            expect(onexec.wait()).to.eventually.notify(done);
        });
        it('should wait on rejected', function(done) {
            var onexec = new Onexec<string>((token) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(token)
                    }, 10);
                });
            });
            onexec.run('1').catch(() => {});
            expect(onexec.wait()).to.eventually.notify(done);
        });
    });
});