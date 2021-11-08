import * as assert from 'assert';
import { pipe, subscribe, makeSubject, combineWith } from '@cycle/callbags';
import { applyApis } from '@cycle/run';
import {
  DomApi,
  DomCommand,
  makeDomApi,
  AddEventListenerCommand,
} from '../../src/index';

describe('pure use of the DOM API', () => {
  it('should make a stream for clicks on `.foo`', done => {
    function Main(sources: { DOM: DomApi }) {
      pipe(
        sources.DOM.select('.foo').events('click'),
        subscribe(
          (ev: any) => {
            assert.strictEqual(ev.value, 135);
            done();
          },
          () => assert.fail('should not complete')
        )
      );
    }

    const subject = makeSubject<any>();
    const sinks = applyApis(Main, { DOM: makeDomApi })({ DOM: subject });

    pipe(
      sinks.DOM,
      subscribe((cmd: DomCommand) => {
        if ('commandType' in cmd) {
          assert.strictEqual(cmd.commandType, 'addEventListener');
          const c = cmd as AddEventListenerCommand;
          assert.strictEqual(c.type, 'click');
          assert.strictEqual(c.selector, '.foo');
          subject(1, { _cycleId: cmd.id, value: 135 });
        } else {
          assert.fail('Missing command type in dom command');
        }
      })
    );
  });

  it('should make multiple user event streams', done => {
    let event = 0;
    function Main(sources: { DOM: DomApi }) {
      pipe(
        combineWith(
          (a: any, b: any) => a.value * b.value,
          sources.DOM.select('.foo').events('click'),
          sources.DOM.select('.bar').events('scroll')
        ),
        subscribe(
          ev => {
            assert.strictEqual(ev, 270);
            event++;
          },
          () => assert.fail('should not complete')
        )
      );
    }

    const subject = makeSubject<any>();
    const sinks = applyApis(Main, { DOM: makeDomApi })({ DOM: subject });

    let foo = 0;
    let bar = 0;
    pipe(
      sinks.DOM,
      subscribe((cmd: DomCommand) => {
        if ('commandType' in cmd) {
          assert.strictEqual(cmd.commandType, 'addEventListener');
          const c = cmd as AddEventListenerCommand;
          if (c.selector === '.foo') {
            foo++;
            assert.strictEqual(c.type, 'click');
            subject(1, { _cycleId: c.id, value: 135 });
          } else if (c.selector === '.bar') {
            bar++;
            assert.strictEqual(c.type, 'scroll');
            subject(1, { _cycleId: c.id, value: 2 });
          } else {
            assert.fail('wrong selector: ' + c.selector);
          }
        } else {
          assert.fail('missing command type in dom command');
        }
      })
    );

    setTimeout(() => {
      assert.strictEqual(event, 1);
      assert.strictEqual(foo, 1);
      assert.strictEqual(bar, 1);
      done();
    }, 10);
  });

  /*it('should make multiple user event streams on the same selector', (done) => {
    function Main(sources: { DOM: DomApi }) {
      pipe(combineWith((a: any, b: any) => a.value + b.value
    }

    const userEvents = mockDOMSource({
      '.foo': {
        click: of(135),
        scroll: of(3),
      },
    });
    combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.foo').events('scroll'),
      (a: number, b: number) => a * b
    ).subscribe({
      next: ev => {
        assert.strictEqual(ev, 405);
        done();
      },
      error: done,
      complete: () => {},
    });
  });

  /*it('should return an empty Observable if query does not match', function(done) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: of(135),
      },
    });
    userEvents
      .select('.impossible')
      .events('scroll')
      .subscribe({
        next: done,
        error: done,
        complete: done,
      });
  });

  it('should return empty Observable for select().elements and none is defined', function(done) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: of(135),
      },
    });
    userEvents
      .select('.foo')
      .elements()
      .subscribe({
        next: done,
        error: done,
        complete: done,
      });
  });

  it('should return defined Observable for select().elements', function(done) {
    const mockedDOMSource = mockDOMSource({
      '.foo': {
        elements: of(135),
      },
    });
    mockedDOMSource
      .select('.foo')
      .elements()
      .subscribe({
        next: (e: any) => {
          assert.strictEqual(e, 135);
          done();
        },
        error: done,
        complete: () => {},
      });
  });

  it('should have DevTools flag in elements() source stream', function(done) {
    const mockedDOMSource = mockDOMSource({
      '.foo': {
        elements: of(135),
      },
    });
    assert.strictEqual(
      mockedDOMSource.select('.foo').elements()._isCycleSource,
      'MockedDOM'
    );
    done();
  });

  it('should have DevTools flag in events() source stream', function(done) {
    const userEvents = mockDOMSource({
      '.foo': {
        click: of(135),
      },
    });
    assert.strictEqual(
      userEvents.select('.foo').events('click')._isCycleSource,
      'MockedDOM'
    );
    done();
  });

  it('should return defined Observable when chaining .select()', function(done) {
    const mockedDOMSource = mockDOMSource({
      '.bar': {
        '.foo': {
          '.baz': {
            elements: of(135),
          },
        },
      },
    });
    mockedDOMSource
      .select('.bar')
      .select('.foo')
      .select('.baz')
      .elements()
      .subscribe({
        next: (e: any) => {
          assert.strictEqual(e, 135);
          done();
        },
        error: done,
        complete: () => {},
      });
  });

  it('multiple .select()s should not throw when given empty mockedSelectors', () => {
    assert.doesNotThrow(() => {
      const DOM = mockDOMSource({});
      DOM.select('.something')
        .select('.other')
        .events('click');
    });
  });

  it('multiple .select()s should return some observable if not defined', () => {
    const DOM = mockDOMSource({});
    const domSource = DOM.select('.something').select('.other');
    assert.strictEqual(
      typeof domSource.events('click').pipe,
      'function',
      'domSource.events(click) should be an Observable instance'
    );
    assert.strictEqual(
      typeof domSource.elements().pipe,
      'function',
      'domSource.elements() should be an Observable instance'
    );
  });
});

describe('isolation on MockedDOMSource', function() {
  it('should have the same effect as DOM.select()', function(done) {
    function app(_sources: {DOM: MockedDOMSource}) {
      return {
        DOM: of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.child.___foo', [h4('.bar', 'Correct')]),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: () =>
        mockDOMSource({
          '.___foo': {
            '.bar': {
              elements: of<any>('skipped', 135),
            },
          },
        }),
    });

    let dispose: any;
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    // Make assertions
    isolatedDOMSource
      .select('.bar')
      .elements()
      .pipe(
        skip(1),
        take(1)
      )
      .subscribe((elements: number) => {
        assert.strictEqual(elements, 135);
        setTimeout(() => {
          dispose();
          done();
        });
      });
    dispose = run();
  });

  it('should have isolateSource and isolateSink', function(done) {
    function app(_sources: {DOM: MockedDOMSource}) {
      return {
        DOM: of(h('h3.top-most.___foo')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: (_: Stream<VNode>) => mockDOMSource({}),
    });
    const dispose = run();
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');
    // Make assertions
    assert.strictEqual(typeof isolatedDOMSource.isolateSource, 'function');
    assert.strictEqual(typeof isolatedDOMSource.isolateSink, 'function');
    dispose();
    done();
  });

  it('should prevent parent from DOM.selecting() inside the isolation', function(done) {
    function app(_sources: {DOM: MockedDOMSource}) {
      const child$ = _sources.DOM.isolateSink(
        of(div('.foo', [h4('.bar', 'Wrong')])),
        'ISOLATION'
      );
      return {
        DOM: map((child: any) =>
          h3('.top-most', [child, h2('.bar', 'Correct')])
        )(child$),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: (_: Stream<VNode>) =>
        mockDOMSource({
          '.___ISOLATION': {
            '.bar': {
              elements: of('skipped', 'Wrong'),
            },
          },
          '.bar': {
            elements: of('skipped', 'Correct'),
          },
        }),
    });

    sources.DOM.select('.bar')
      .elements()
      .pipe(
        skip(1),
        take(1)
      )
      .subscribe(function(x: any) {
        assert.strictEqual(x, 'Correct');
        done();
      });
    run();
  });*/
});
