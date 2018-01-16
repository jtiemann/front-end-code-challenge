import $ from 'jquery';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Scheduler } from 'rxjs/Scheduler';
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/startWith'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/do'
import 'rxjs/add/operator/take'
import 'rxjs/add/operator/delay'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/withLatestFrom'
import 'rxjs/add/observable/fromEvent'
import 'rxjs/add/observable/from'
import 'rxjs/add/observable/interval'
import { Id, identity } from './utils'
require('./pane.css')

/////////////////////////////
/// ASYNC DATA FUNCTIONS ////
/////////////////////////////

const fetchLocation = (cityOrZip) => fetch(`autofill?query=${cityOrZip}`, {headers: {Accept: 'application/json'}})

const fetchHotels = (location) => fetch(`/locations/${location}/hotels`, {headers: {Accept: 'application/json'}})

const fetchHotel = (udicode) => fetch(`hotels/${udicode}?checkIn=2018-02-08&checkOut=2018-02-10&currency=USD&guests=2&rooms=1`, {headers: {Accept: 'application/json'}})

///////////////
/// FILTERS ///
///////////////

const hasAmenity = (amenity) => (h) => h.amenities.filter(({code: x})=>{return x==amenity}).length > 0

const hasMiniBar = () => hasAmenity("MNBAR")

const hasFreeBfast = () => hasAmenity("FBKFST")

const hasUserRatingGreaterThan = (rating) => (h) => h.user_rating > rating

const applyFilterSettings = (filters) => (hotel) => {
	 return filters.map((f)=>{
										    if (!Array.isArray(f)) return f(hotel) 
										    return f.filter((ors)=>ors(hotel)).length > 0 ? true : false
											})
	               .every((x)=> x == true) 
}

var filters = [hasUserRatingGreaterThan(3.5), [hasMiniBar(), hasFreeBfast()]]

/////////////////////
/// BEGIN RX DEMO ///
/////////////////////

const fetchLocation$ = Observable.from(fetchLocation("Charlottesville"))
																 .mergeMap((res) => Observable.from(res.json()) )
																 .map((fetchRes) => fetchRes.locations[0].id)

const fetchHotels$ = fetchLocation$.mergeMap((loc) => Observable.from(fetchHotels(loc)) )
																	 .mergeMap((res) => Observable.from(res.json()) )
																	 .mergeMap((res)=>Observable.from(res.data))
																	 .filter(applyFilterSettings(filters))
				        	      					 //.map((filteredHotels)=>filteredHotels.map((h)=>renderComponent(h)("favorites")))   
                                   //fetchHotels$.subscribe(console.log)
const renderHotels$ = fetchHotels$.map((filteredHotel)=>renderComponent(filteredHotel)("myFavorites"))  

const HotelDescription = (event) =>  Observable.from(fetchHotel(event.target.id))
																				       .mergeMap((res) => Observable.from(res.json()) )
			                                         .map((aHotel)=>alert(aHotel.description))
			                                         .subscribe()
                 
//////////////////////
/// END RX DEMO //////
//////////////////////

///////////////////////////////////
/// RENDER ELEMENTS AND HELPERS ///
///////////////////////////////////

const renderComponent = (h) => (place="myFavorites") => {
	//console.log(h)
	const id = Id()
	let wrapper = document.createElement('div')
	wrapper.setAttribute("id", id)
	wrapper.classList.add("wrapper")

	let parts = [primaryPhotoEl(h.primary_photo, h, showAllPics), 
               wrapRI(h),
	             tripAdvisorReviewsEl(h), 
	             nameEl(h),
	             separatorEl()]
 
	parts.forEach((unit) => wrapper.append(unit))
	document.getElementById(place).append(wrapper)
	return h
}

const wrap = (el, wrapper) => {
  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
}

const imageUrl = (photo, size="200x150") => `https://d29u3c1wxehloe.cloudfront.net${photo.id}${size}.jpg`

const imageBuilderEl = (p) => {
	let el  = document.createElement("img")
	el.setAttribute("src", imageUrl(p))
	el.classList.add("imageBuilderEl")
  return el
}

const imageEls = (photos) => photos.map((p)=> imageBuilderEl(p))

const showAllPics = (e) => imageEls(JSON.parse(e.target.dataset.pics))
                           .forEach((picEl)=>e.target.parentNode.insertBefore(picEl, e.target.nextSibling))

const primaryPhotoEl = (primaryPhoto, h, display) => {
	let el = document.createElement("img")
	el.setAttribute("src", imageUrl(primaryPhoto))
	el.setAttribute("id", h.udicode)
	el.setAttribute("data-pics", JSON.stringify(h.photos))
	el.classList.add("primaryPhotoEl")
	el.addEventListener("click", display, {once:true})
	el.addEventListener("dblclick", HotelDescription)
  return el
}

const separatorEl = () => {
  let el  = document.createElement("hr")
  el.classList.add("separatorEl")
  return el
}

const nameEl = (h) => {
	let el  = document.createElement("h4")
	el.classList.add("nameEl")
	el.innerHTML = h.name
	return el
}

const tripAdvisorReviewsEl = (h) => {
	let el  = document.createElement("ul")
	el.classList.add("tripAdvisorReviewsEl")
	el.innerHTML = `${h.tripadvisor.reviews.reduce((acc,review)=>acc += "<li>"+review.title+"</li>","")}`
  return el
}

const reviewNumberEl = (h) => {
	let el  = document.createElement("span")
  el.innerHTML = h.user_rating
  return el
}

const indicativePriceEl = (h) => {
	let el  = document.createElement("span")
  el.innerHTML = `@$${h.indicative_rate}`
  return el
}

const wrapRI = (h) => {
	let el = document.createElement('p')
	el.classList.add("wrapRI")
	el.append(reviewNumberEl(h))
	el.append(indicativePriceEl(h))
	return el
}

export {Id, renderHotels$}

//////////////
/// NOTES  ///
//////////////

/*
example: const fetchHotels = () => fetch('/locations/0nN94iG4S04s5cO05g9krVMw/hotels', {headers: {Accept: 'application/json'}})

const imageUrl = (photo) => `https://d29u3c1wxehloe.cloudfront.net${photo.id}/[200x150|500x375|big].jpg`

const fetchHotel = (udicode) => fetch(`hotels/${udicode}?checkIn=2018-02-08&checkOut=2018-02-10&currency=USD&guests=2&rooms=1`, {headers: {Accept: 'application/json'}})

RANDOM Hotel fetchHotels$.subscribe((hotels)=>console.log(hotels[Math.floor(Math.random()*hotels.length)]))

fetchLocation(22901).then((res)=>res.json())
                    .then((res)=>res.locations[0].id)
                    .then(fetchHotels)
                    .then(res=>res.json())
                    .then((rj)=>rj.data)
	      					  .then((hotels)=>hotels.filter((h) => hasUserRatingGreaterThan(3.5,h)))
	      					  .then((hotels)=>hotels.filter((h) => hasFreeBfast(h) || hasMiniBar(h) ))
	      					  .then((filteredHotels)=>filteredHotels.map((h)=>renderComponent(h)("favorites")))
	      					  //.then((h)=>fetchHotel(h[0].location_id,h[0].udicode))
	      					  //.then(res=>res.json())
	      					  .then(console.log)

fetchHotels().then(function(res) { return res.json() })
					  .then((res)=>res.data.filter((h) => hasFreeBfast(h) || hasMiniBar(h) ))
					  .then((fh)=>{ console.log(fh);return fh.map((h)=>renderComponent(h))})
					  .then(console.log)
*/
