var map;
var precipitation_Markers = []
var snow_Markers = []
var visibility_Markers = []
var markers = []
var polyline = [];
var waypoint_Autocomplete = [];
var waypointCount = 0;
var waypointDiv = document.getElementById("div");
const originInput = document.getElementById("origin-input");
const destinationInput = document.getElementById("destination-input");
const modeSelector = document.getElementById("mode-selector");
const waypointAdder = document.getElementById("waypoint-adder");
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        mapTypeControl: false,
        center: { lat: 20.5, lng: 78.9 },
        zoom: 5,
    });
    new AutocompleteDirectionsHandler(map);
}

class AutocompleteDirectionsHandler {
    map;
    originPlaceId;
    destinationPlaceId;
    travelMode;
    directionsService;
    constructor(map) {
        this.map = map;
        this.originPlaceId = "";
        this.destinationPlaceId = "";
        this.waypointPlaceName = [];
        this.travelMode = google.maps.TravelMode.DRIVING;
        // this.trafficLayer = new google.maps.TrafficLayer();


        // Specify just the place data fields that you need.
        const originAutocomplete = new google.maps.places.Autocomplete(
            originInput,
            { fields: ["place_id", "name"] },
        );


        // Specify just the place data fields that you need.
        const destinationAutocomplete = new google.maps.places.Autocomplete(
            destinationInput,
            { fields: ["place_id", "name"] },
        );

        this.setupClickListener(
            "All", 0
        );
        this.setupClickListener(
            "precipitation", 1
        );

        this.setupClickListener(
            "Snow", 2
        );

        this.setupClickListener(
            "visibility", 3
        );

        this.setupClickListener(
            "waypoint-adder", 4
        );

        this.setupPlaceChangedListener(originAutocomplete, "ORIG", 0);
        this.setupPlaceChangedListener(destinationAutocomplete, "DEST", 10);


        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(waypointDiv);
        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(destinationInput);
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(waypointAdder);
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
    }

    setupClickListener(id, mode) {
        const radioButton = document.getElementById(id);
        radioButton.addEventListener("click", () => {
            // if (mode == 0) {
            //   setMapOnAll(map);
            // }
            // if (mode == 1) {
            //   hideMarkers()
            //   for (let i = 0; i < precipitation_Markers.length; i++) {
            //     precipitation_Markers[i].setMap(map);
            //   }
            // }
            // if (mode == 2) {
            //   hideMarkers()
            //   for (let i = 0; i < snow_Markers.length; i++) {
            //     snow_Markers[i].setMap(map);
            //   }
            // }
            // if (mode == 3) {
            //   hideMarkers()
            //   for (let i = 0; i < visibility_Markers.length; i++) {
            //     visibility_Markers[i].setMap(map);
            //   }
            // }
            if (mode == 4) {
                if (waypointCount <= 5) {
                    waypointCount++;
                    this.map.controls[google.maps.ControlPosition.LEFT_TOP].pop();
                    var waypointInput = document.createElement("div" + waypointCount);
                    waypointInput.innerHTML = `<input id = "waypoint-input` + waypointCount + `" class="controls2" type="text" placeholder="Enter a waypoint location" />  <div type="submit" id="waypoint-delete` + waypointCount + `" class = "waypoint-substracter" onclick="this.parentNode.parentNode.removeChild(this.parentNode);">-</div><br>`
                    waypointDiv.appendChild(waypointInput);
                    this.way(waypointCount);
                    this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(destinationInput);
                    this.setupClickListener(
                        "waypoint-delete" + waypointCount, waypointCount * 10
                    );
                }
                else {
                    return;
                }
            }
            if (mode % 10 == 0) {
                google.maps.event.clearInstanceListeners(waypoint_Autocomplete[mode / 10]);
                this.map.controls[google.maps.ControlPosition.LEFT_TOP].pop();
                this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(destinationInput);
                for (var j = mode / 10 - 1; j < this.waypointPlaceName.length; j++) {
                    if (this.waypointPlaceName[j + 1]) {
                        this.waypointPlaceName[j] = this.waypointPlaceName[j + 1];
                    }
                    else {
                        this.waypointPlaceName.length--;
                    }
                }
                this.route();
                waypointCount--;
            }
        });
    }

    way(n) {
        const waypointInput = document.getElementById("waypoint-input" + n);
        waypoint_Autocomplete[n] = new google.maps.places.Autocomplete(
            waypointInput,
            { fields: ["place_id", "name"] },
        );
        this.setupPlaceChangedListener(waypoint_Autocomplete[n], "WAY", n);
    }


    setupPlaceChangedListener(autocomplete, mode, i) {
        autocomplete.bindTo("bounds", this.map);
        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.place_id) {
                window.alert("Please select an option from the dropdown list.");
                return;
            }
            if (mode === "ORIG") {
                this.originPlaceName = place.name;
            }
            else if (mode === "WAY") {
                this.waypointPlaceName[i - 1] = place.name
            }
            else {
                this.destinationPlaceName = place.name;
            }
            this.route();
        });
    }
    setBounds(response) {
        var bounds = new google.maps.LatLngBounds();
        var minlat = response[0][0], minlng = response[0][0], maxlat = response[0][0], maxlng = response[0][0];
        for (var i = 0; i < response.length; i++) {
            const overview_path = response[i];
            for (var j = 0; j < overview_path.length; j++) {
                if (minlat.lat < overview_path[j].lat) {
                    minlat = overview_path[j];
                }
                else if (minlng.lng < overview_path[j].lng) {
                    minlng = overview_path[j];
                }
                else if (maxlat.lat > overview_path[j].lat) {
                    maxlat = overview_path[j];
                }
                else if (maxlng.lng > overview_path[j].lng) {
                    maxlng = overview_path[j];
                }
            }
        }
        bounds.extend(new google.maps.LatLng(minlat.lat, minlat.lng));
        bounds.extend(new google.maps.LatLng(maxlat.lat, maxlat.lng));
        bounds.extend(new google.maps.LatLng(minlng.lat, minlng.lng));
        bounds.extend(new google.maps.LatLng(maxlng.lat, maxlng.lng));
        this.map.fitBounds(bounds);
    }
    async route() {
        if (!this.originPlaceName || !this.destinationPlaceName) {
            return;
        }
        if (this.waypointPlaceName.length == 0) {
            fetch(`/origin=${this.originPlaceName}/dest=${this.destinationPlaceName}`)
                .then(response => response.json())
                .then(response => {
                    this.setBounds(response)
                    apolyline(response)
                })
        }
        else {
            var way = '';
            for (var h = 0; h < this.waypointPlaceName.length; h++) {
                if (h == 0) {
                    way += this.waypointPlaceName[h];
                }
                else {
                    way += "|" + this.waypointPlaceName[h];
                }
            }
            fetch(`/origin=${this.originPlaceName}/dest=${this.destinationPlaceName}/way=${way}`)
                .then(response => response.json())
                .then(response => {
                    this.setBounds(response)
                    apolyline(response)
                })
        }
    }
}


function apolyline(response) {
    removeAllLine();
    createPolyline(response);
}
function addAllLine(map) {
    for (let i = 0; i < polyline.length; i++) {
        polyline[i].setMap(map);
    }
}

function removeAllLine() {
    addAllLine(null);
    polyline = [];
}

function createPolyline(loc) {
    for (var i = 0; i < loc.length; i++) {
        const Path = new google.maps.Polyline({
            path: loc[i],
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 0.5,
            strokeWeight: 5,
        });
        polyline.push(Path);
        Path.setMap(map);
    }
}

window.initMap = initMap;

// async function marker(response, map) {
//   const overview_path = response.routes[0].overview_path;
//   var loc = "";
//   for (var i = 0; i < overview_path.length; i++) {
//     if (i == overview_path.length - 1)
//       loc += overview_path[i].lat() + "," + overview_path[i].lng();
//     else
//       loc += overview_path[i].lat() + "," + overview_path[i].lng() + "+";
//   }
//   const data = await fetchWeatherData(loc);
//   precipitation(data[0], map);
//   snow(data[1], map);
//   visibility(data[2], map);
// }

// async function fetchWeatherData(locations) {
//   const d = new Date();
//   var month = d.getMonth() + 1
//   var day = d.getDay()
//   var hour = d.getHours()
//   var minute = d.getMinutes()
//   var sec = d.getSeconds()
//   if (day < 10) {
//     day = '0' + day;
//   }
//   if (month < 10) {
//     month = '0' + month;
//   }
//   if (hour < 10) {
//     hour = '0' + hour;
//   }
//   if (minute < 10) {
//     minute = '0' + minute;
//   }
//   if (sec < 10) {
//     sec = '0' + sec;
//   }
//   var datentime = d.getFullYear() + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + sec + "Z";
//   var token = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2IjoxLCJ1c2VyIjoic3R1ZGVudF9yYXdhdF9oYXJzaGl0IiwiaXNzIjoibG9naW4ubWV0ZW9tYXRpY3MuY29tIiwiZXhwIjoxNzE0NjI0OTUwLCJzdWIiOiJhY2Nlc3MifQ.IYtdx17c4mIvumya_EHcjG1GmgVSdWzuLT9O4-r__WoWd2Fy1ZA3xv88-gyKOX_H292HHitvik9-BMBNNfRBaw';
//   try {
//     const response = await fetch(`https://api.meteomatics.com/${datentime}/precip_1h:mm,snow_depth:mm,visibility:km/${locations}/json?access_token=${token}`);
//     const response_1 = await response.json();
//     return response_1.data;
//   } catch (err) {
//     return console.error(err);
//   }
// }
// function precipitation(data) {
//   for (var i = 0; i < data.coordinates.length; i++) {
//     if (10 <= data.coordinates[i].dates[0].value) {
//       addMarker({ lat: data.coordinates[i].lat, lng: data.coordinates[i].lon }, "Rain: " + data.coordinates[i].dates[0].value + "mm", 1)
//     }
//   }
// }

// function snow(data) {
//   for (var i = 0; i < data.coordinates.length; i++) {
//     if (2 <= data.coordinates[i].dates[0].value) {
//       addMarker({ lat: data.coordinates[i].lat, lng: data.coordinates[i].lon }, "Snow Depth: " + data.coordinates[i].dates[0].value + "mm", 2)
//     }

//   }
// }

// function visibility(data) {
//   for (var i = 0; i < data.coordinates.length; i++) {
//     if (data.coordinates[i].dates[0].value < 5) {
//       addMarker({ lat: data.coordinates[i].lat, lng: data.coordinates[i].lon }, "Visibility: " + data.coordinates[i].dates[0].value + "km", 3)
//     }
//   }
// }
// function addMarker(position, string, mode) {
//   const marker = new google.maps.Marker({
//     position,
//     map,
//   });
//   const infowindow = new google.maps.InfoWindow({
//     content: string,
//   });
//   marker.addListener("click", () => {
//     infowindow.open({
//       anchor: marker,
//       map,
//     });
//   });
//   markers.push(marker);
//   if (mode == 1) {
//     precipitation_Markers.push(marker);
//   }
//   if (mode == 2) {
//     snow_Markers.push(marker);
//   }
//   if (mode == 3) {
//     visibility_Markers.push(marker);
//   }
// }
// function hideMarkers() {
//   setMapOnAll(null);
// }
// function setMapOnAll(map) {
//   for (let i = 0; i < markers.length; i++) {
//     markers[i].setMap(map);
//   }
// }