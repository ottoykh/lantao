let map;
const markers = [];
let polyline;
let circle;

function fetchEstimatedArrivals(routeId, stopId) {
  const url = `https://rt.data.gov.hk/v2/transport/nlb/stop.php?action=estimatedArrivals&routeId=${encodeURIComponent(
    routeId
  )}&stopId=${encodeURIComponent(stopId)}&language=en`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const estimatedArrivals = data.estimatedArrivals;
      const estimatedArrivalElement = document.getElementById(
        "estimated-arrival"
      );
      estimatedArrivalElement.innerHTML = "";

      if (estimatedArrivals.length === 0) {
        estimatedArrivalElement.innerHTML =
          "<p>No estimated arrivals at the moment.</p>";
        return;
      }

      estimatedArrivals.forEach((arrival, index) => {
        const estimatedArrivalTime = new Date(arrival.estimatedArrivalTime);
        const estimatedArrivalTimeString = estimatedArrivalTime.toLocaleTimeString();
        const routeVariantName = arrival.routeVariantName;
        const departed = arrival.departed;
        const noGPS = arrival.noGPS;
        const wheelChair = arrival.wheelChair;
        const generateTime = arrival.generateTime;

        const arrivalElement = document.createElement("div");
        arrivalElement.innerHTML = `<h3 id="remainingTime-${stopId}-${index}"></h3><p>Estimated Arrival Time: <span id="eta-${stopId}-${index}">${estimatedArrivalTimeString}</span></p>`;

        estimatedArrivalElement.appendChild(arrivalElement);

        setInterval(function () {
          const remainingTimeElement = document.getElementById(
            `remainingTime-${stopId}-${index}`
          );
          const currentTime = new Date().getTime();
          const arrivalTime = estimatedArrivalTime.getTime();
          const remainingTime = arrivalTime - currentTime;

          if (remainingTime <= 0) {
            remainingTimeElement.innerHTML = "Arrived";
          } else {
            const minutes = Math.floor(remainingTime / 60000);
            remainingTimeElement.innerHTML = `${minutes} min`;
          }
        }, 1000);
      });
    })
    .catch((error) => {
      const estimatedArrivalElement = document.getElementById(
        "estimated-arrival"
      );
      estimatedArrivalElement.innerHTML =
        "<p>There is no ETA provided from New Lantao Bus.</p>";
      console.log(error);
    });
}

function fetchMap() {
  const estimatedArrivalElement = document.getElementById("estimated-arrival");
  estimatedArrivalElement.innerHTML = "";
  const stopListElement = document.getElementById("stop-list");
  stopListElement.innerHTML = "";
  const routeSelect = document.getElementById("route-select");
  const routeId = routeSelect.value;
  if (!routeId) {
    alert("Please select a route");
    return;
  }

  const url = `https://rt.data.gov.hk/v2/transport/nlb/stop.php?action=list&routeId=${encodeURIComponent(
    routeId
  )}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const stops = data.stops;
      const mapElement = document.getElementById("map");
      const stopListElement = document.getElementById("stop-list");

      if (map) {
        map.remove();
      }
      markers.forEach((marker) => marker.remove());
      if (polyline) {
        polyline.remove();
      }
      if (circle) {
        circle.remove();
      }

      map = L.map(mapElement).setView(
        [stops[0].latitude, stops[0].longitude],
        14
      );

      L.tileLayer(
        "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png"
      ).addTo(map);

      L.tileLayer(
        "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/wgs84/{z}/{x}/{y}.png",
        {
          attribution:
            '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">&copy; Map information from Lands Department </a><img src="https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg" height =20></img>',
          maxZoom: 18
        }
      ).addTo(map);

      stops.forEach((stop) => {
        const marker = L.marker([stop.latitude, stop.longitude])
          .addTo(map)
          .bindPopup(
            `${stop.stopName_e}<br>` +
              `${stop.stopName_c}<br>` +
              `Normal/Holiday Fare: $${stop.fare} / $${stop.fareHoliday}`
          );

        marker.on("click", function () {
          fetchEstimatedArrivals(routeId, stop.stopId);
          circleMarker(marker);
        });

        markers.push(marker);

        const listItem = document.createElement("ol");
        listItem.setAttribute("id", `stop-${stop.stopId}`);
        listItem.classList.add("stop-list-item");

        const stopNameRow = document.createElement("h4");
        stopNameRow.textContent = `${stop.stopName_e} ${stop.stopName_c}`;
        const fareRow = document.createElement("span");
        fareRow.textContent = `Normal/ Holiday Fare: $${stop.fare} / $${stop.fareHoliday}`;
        listItem.appendChild(stopNameRow);
        listItem.appendChild(document.createElement("br"));
        listItem.appendChild(fareRow);

        listItem.addEventListener("click", function () {
          fetchEstimatedArrivals(routeId, stop.stopId);
          map.setView([stop.latitude, stop.longitude], 16.5);
          scrollToTop();
          circleMarker(marker);
        });

        stopListElement.appendChild(listItem);
      });

      const latLngs = stops.map((stop) => [stop.latitude, stop.longitude]);

      polyline = L.polyline(latLngs, {
        color: "green",
        weight: 4,
        smoothFactor: 1
      }).addTo(map);
    });
}

function scrollToTop() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function circleMarker(marker) {
  if (circle) {
    circle.remove();
  }

  circle = L.circle(marker.getLatLng(), {
    radius: 25,
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.5
  }).addTo(map);
}
