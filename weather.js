//start at san antonio by default
getFiveDayForecast("San Antonio");

//create mapbox
mapboxgl.accessToken = MAP_BOX_APPID;
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    zoom: 8,
    center: [-98.4916, 29.4252]
});
var marker = new mapboxgl.Marker({
    draggable: true
})
    .setLngLat([-98.4916, 29.4252])
    .addTo(map);

marker.on("dragend", () => onDragEnd());

//function to run when the marker is dropped
function onDragEnd() {
    var markerCoords = marker.getLngLat();
    reverseGeocode({ lat: markerCoords.lat, lng: markerCoords.lng }, MAP_BOX_APPID)
        .then(function (data) {
            var userCity = data.split(",")[1].trim();
            getFiveDayForecast(userCity);
        })
        .catch(function (error) {
            console.log("There was an error in reverse geocoding: ", error);
        })
}


//ask for user location and make that starting position if they allow
navigator.geolocation.getCurrentPosition(getLatLon);
function getLatLon(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    map.setCenter([longitude, latitude]);
    marker.setLngLat([longitude, latitude]);

    reverseGeocode({ lat: latitude, lng: longitude }, MAP_BOX_APPID)
        .then(function (data) {
            var userCity = data.split(",")[1].trim();
            getFiveDayForecast(userCity);
        })
        .catch(function (error) {
            console.log("There was an error in reverse geocoding: ", error);
        })
}

//setup listener for search button
var submitButton = $("#submitSearch");
var searchBar = $("#searchBar");
submitButton.click(() => getFiveDayForecast(searchBar.val(), "search"))

//get the five day forecast for a city
function getFiveDayForecast(location, type) {
    $.get("https://api.openweathermap.org/data/2.5/forecast", {
        appid: OPEN_WEATHER_APPID,
        q: location,
        units: "imperial",
    })
        .done(function (data) {
            var long = data.city.coord.lon;
            var lat = data.city.coord.lat;
            if (type == "search") {
                map.setCenter([long, lat]);
                marker.setLngLat([long, lat]);
            }
            var days = [];
            console.log(data);
            for (var i = 0; i < data.list.length; i++) {
                if (i == 0 || data.list[i].dt_txt.includes("12:00:00") && days.length < 5) {
                    days.push(data.list[i]);
                }
            }
            renderFiveDayForecast(days)
            updateCurrentCity(data.city.name);
        })
        .fail(function (error) {
            console.log("There is an error in getFiveDayForecast: \n", error);
        })
        .always(function () {
            console.log("AJAX Request Finished.");
        })
}

//render the five forecasts
function renderFiveDayForecast(days) {
    $("#forecast").html("");
    days.forEach((day) => renderSingleForecast(day))
}

//render each individual forecast
function renderSingleForecast(day) {
    var html = $("#forecast").html()
    html += "<div class='d-flex flex-column justify-content-center mx-3 mb-4 p-5 daycast'>"
    html += "<h2 class='text-center'>" + day.dt_txt.split(" ")[0] + "</h2>"
    html += "<p class='text-center'>" + day.main.temp + "°</p>"
    html += "<p>Description: <strong>" + day.weather[0].description + "</strong></p>"
    html += "<p>Humidity: <strong>" + day.main.humidity + "%</strong></p>"
    html += "<p>Wind: <strong>" + (day.wind.speed * 2.236936).toFixed(2) + " mph</strong></p>"
    html += "<p>Pressure: <strong>" + (day.main.pressure / 68.9475728).toFixed(3) + " lbs/in<sup>2</sup></strong></p>"
    html += "</div>"
    $("#forecast").html(html);
}

//update the current city label
function updateCurrentCity(city) {
    $("#currentCity").html("Current Location: " + city);
}
