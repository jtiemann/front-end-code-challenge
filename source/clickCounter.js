import $ from 'jquery';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/startWith'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/withLatestFrom'
import 'rxjs/add/observable/fromEvent'
import { Id, identity } from './utils'

///////////////////////////////
// RX CLICK COUNTER EXAMPLE ///
///////////////////////////////

const init_state = {counter:1}
const counterSubject$ = new Subject()
const cs$ = counterSubject$.startWith(identity)
							.scan((state, fn) => fn(state), init_state)
							.map(state=> Object.assign({}, state, {t: (new Date()).toLocaleTimeString()}))

const click$ = Observable.fromEvent(document, "click")
                         .map(x=>counterSubject$.next(state => Object.assign({}, state, {counter: state.counter + 1})))

const clickCounter$ = click$.withLatestFrom(cs$).map(([x,counter])=>console.log(counter))

export {clickCounter$}
