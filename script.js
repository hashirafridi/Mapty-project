'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const candenceInp = document.querySelector(".cadence");
const elevationInp = document.querySelector(".elevation");

class workout {
    date = new Date();
    id = (Date.now() + ' ').slice(-10);
    // clicks = 0;
    constructor(distance, duration, coords) {
        this.distance = distance;     //// in km
        this.duration = duration;     ///// in min
        this.coords = coords;    //// [lat,lng]
    }
    _setDiscription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this._discription = ` ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    // _click(){
    //     this.clicks++;
    // }
}

class runing extends workout {
    type = "running"
    constructor(distance, duration, coords, cadence) {
        super(distance, duration, coords);
        this.cadence = cadence;
        this.pace();
        this._setDiscription();
    }
    pace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }


};
class cycling extends workout {
    type = "cycling"
    constructor(distance, duration, coords, elevationGain) {
        super(distance, duration, coords);
        this.elevationGain = elevationGain;
        this.speed();
        this._setDiscription();
    }
    speed() {
        //// km/h
        this.speed = this.distance / this.duration / 60;
        return this.speed;
    }
};

///// architecture
class App {
    #map;
    #mapEvent;
    #workouts = [];
    constructor() {
        this._getPosition();
        //// add event to show marker after submit
        form.addEventListener("submit", this._newWorkout.bind(this));
        //// add event for change runing form to cycling
        inputType.addEventListener("change", this._toggleElevationField);
        //// add evet for moving view to the marker 
        containerWorkouts.addEventListener("click",this._moveToPopup.bind(this));
        //// get data from local storage
        this._getLocalstorage();
    }
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert("Could not get your postion");
            });
        }
    }
    _loadMap(postion) {
        //// display map by api Leaflet
        const { latitude, longitude } = postion.coords;
        const coords = [latitude, longitude]
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
        this.#map = L.map('map').setView(coords, 12);

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#map.on("click", this._showForm.bind(this));
        //// render markers from local storage on the map
        if(!this.#workouts) return;
        this.#workouts.forEach(val=> this._setWorkoutMarker(val));
    }
    _showForm(mapE) {
        //// show form after click on map
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        //// update focus of cursor in input
        inputDistance.focus();
    }
    _toggleElevationField() {
        candenceInp.classList.toggle("form__row--hidden");                        //// mine
        elevationInp.classList.toggle("form__row--hidden");
        //  inputElevation.closest(".form__row").classList.toggle("form__row--hidden");    ////jonass
        //  inputCadence.closest(".form__row").classList.toggle("form__row--hidden");     
    }
    _hideForm() {
        //// empty inputs
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = "";
        form.style.display = "none"
        form.classList.add("hidden");
        setTimeout(() => form.style.display = "grid", 1000);
    }
    _newWorkout(e) {
        e.preventDefault();
        const inputValid = (...values) => values.every(val => Number.isFinite(val));
        const chkNegNum = (...values) => values.every(val => val > 0);

        //// get data from form
        const type = inputType.value;
        const duration = +inputDuration.value;
        const distance = +inputDistance.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //// if workout runing create runing obj
        if (type === "running") {
            const cadence = +inputCadence.value;
            
            if (!inputValid(distance, duration, cadence) || !chkNegNum(distance, duration, cadence)) return alert("input should be  positive and numbers");
            workout = new runing(distance, duration, [lat, lng], cadence);

            //// add workout to workouts array

        }
        //// if workout cycling create runing obj
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            if (!inputValid(distance, duration, elevation) || !chkNegNum(distance, duration)) return alert("input should be  positive and numbers");
            workout = new cycling(distance, duration, [lat, lng], elevation);

        }
        //// add workout to workouts array
        this.#workouts.push(workout);
        //// setting marker on map
        this._setWorkoutMarker(workout);
        //// update the list with workout
        this._renderWorkout(workout);
        //// update focus of cursor in input
        inputDistance.focus();
        //// clear input fields and hide the form
        this._hideForm();
        //// setting local storage
        this._setLocalstorage();

    }
    _setWorkoutMarker(workout) {
        //// Display marker
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            })).setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}  ${workout._discription}`)
            .openPopup();
    }
    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout._discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`
        if (workout.type === "running") {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }
        else {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`
        }
        form.insertAdjacentHTML("afterend", html);
    }
    _moveToPopup(e){
      const  workEl =  e.target.closest(".workout");
      if(!workEl) return;
      const workout = this.#workouts.find(val=> val.id === workEl.dataset.id);
      this.#map.setView(workout.coords,13,{
        animate:true,
        pan:{
            duration:1
        }
      });
    //   workout._click();          //// will throw error 
    }
    _setLocalstorage(){
        localStorage.setItem("workout",JSON.stringify(this.#workouts));
    }
    _getLocalstorage(){
        const data = JSON.parse(localStorage.getItem("workout"));
        if(!data) return;
        this.#workouts = data;
        this.#workouts.forEach(val=> this._renderWorkout(val));
    }
    _reset(){
        localStorage.removeItem("workout");
        location.reload();
    }
}
//// create app for whole app
const app = new App();







