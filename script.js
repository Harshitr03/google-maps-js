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
        this.waypointPlaceId = [];
        this.travelMode = google.maps.TravelMode.DRIVING;
        this.directionsService = new google.maps.DirectionsService();

        const originAutocomplete = new google.maps.places.Autocomplete(
            originInput,
            { fields: ["place_id"] },
        );

        const destinationAutocomplete = new google.maps.places.Autocomplete(
            destinationInput,
            { fields: ["place_id"] },
        );

        this.setupClickListener(
            "waypoint-adder", 0
        );

        this.setupPlaceChangedListener(originAutocomplete, "ORIG", 0);
        this.setupPlaceChangedListener(destinationAutocomplete, "DEST", 10);


        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(waypointDiv);
        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(destinationInput);
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(waypointAdder);
    }

    setupClickListener(id, mode) {
        const radioButton = document.getElementById(id);
        radioButton.addEventListener("click", () => {
            if (mode == 0) {
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
                for (var j = mode / 10 - 1; j < this.waypointPlaceId.length; j++) {
                    if (this.waypointPlaceId[j + 1]) {
                        this.waypointPlaceId[j] = this.waypointPlaceId[j + 1];
                    }
                    else {
                        this.waypointPlaceId.length = this.waypointPlaceId.length - 1;
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
            { fields: ["place_id"] },
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
                this.originPlaceId = place.place_id;
            }
            else if (mode === "WAY") {
                this.waypointPlaceId[i - 1] = { stopover: true, location: { 'placeId': place.place_id } }
            }
            else {
                this.destinationPlaceId = place.place_id;
            }
            this.route();
        });
    }
    route() {
        if (!this.originPlaceId || !this.destinationPlaceId) {
            return;
        }
        this.directionsService.route(
            {
                origin: { placeId: this.originPlaceId },
                destination: { placeId: this.destinationPlaceId },
                waypoints: this.waypointPlaceId,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: true
            },
            (response, status) => {
                if (status === "OK") {
                    var bounds = new google.maps.LatLngBounds();
                    var minlat = response.routes[0].overview_path[0], maxlat = response.routes[0].overview_path[0], minlng = response.routes[0].overview_path[0], maxlng = response.routes[0].overview_path[0];
                    for (var i = 0; i < response.routes.length; i++) {
                        const overview_path = response.routes[i].overview_path;
                        for (var j = 0; j < overview_path.length; j++) {
                            if (minlat.lat() < overview_path[j].lat()) {
                                minlat = overview_path[j];
                            }
                            else if (minlng.lng() < overview_path[j].lng()) {
                                minlng = overview_path[j];
                            }
                            else if (maxlat.lng() > overview_path[j].lat()) {
                                maxlat = overview_path[j];
                            }
                            else if (maxlng.lng() > overview_path[j].lng()) {
                                maxlng = overview_path[j];
                            }
                        }
                    }
                    bounds.extend(minlat);
                    bounds.extend(maxlat);
                    bounds.extend(minlng);
                    bounds.extend(maxlng);
                    this.map.fitBounds(bounds);
                    apolyline(response);
                } else {
                    window.alert("Directions request failed due to " + status);
                }
            },
        );
    }
}

function apolyline(response) {
    removeAllLine();
    var loc = [];
    for (var j = 0; j < response.routes.length; j++) {
        const overview_path = response.routes[j].overview_path;
        var temp = [];
        for (var i = 0; i < overview_path.length; i++) {
            const obj = { lat: overview_path[i].lat(), lng: overview_path[i].lng() }
            temp[i] = obj;
        }
        loc.push(temp);
    }
    createPolyline(loc);
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

