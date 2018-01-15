import { Id, identity } from './utils'
import {click$, renderHotels$} from './pane'
import {clickCounter$} from './clickCounter'
require('./index.css')

function updateTime() {
  document.getElementById('time').innerHTML = (new Date()).toLocaleTimeString()
}

updateTime()
setInterval(updateTime, 1000)

renderHotels$.subscribe()

clickCounter$.subscribe()

