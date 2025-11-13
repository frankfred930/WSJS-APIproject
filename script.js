// All event handlers are added dynamically
document.addEventListener("DOMContentLoaded", () => {
  const stationSelect = document.getElementById("stationSelect");
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("results");

  let stations = [];

  // Fetch station metadata from Digitraffic API
  fetch("https://rata.digitraffic.fi/api/v1/metadata/stations")
    .then(res => res.json())
    .then(data => {
      stations = data;
      populateStations(data);
    })
    .catch(err => {
      console.error("Error fetching stations:", err);
      resultsDiv.innerHTML = "<p style='color:red;'>Failed to load station data.</p>";
    });

  // Dropdown
  function populateStations(stations) {
    stations.forEach(st => {
      const option = document.createElement("option");
      option.value = st.stationShortCode;
      option.textContent = `${st.stationName} (${st.stationShortCode})`;
      stationSelect.appendChild(option);
    });
  }

  // Add event listeners dynamically
  stationSelect.addEventListener("change", () => {
    const code = stationSelect.value;
    if (code) fetchTrainData(code);
  });

  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const found = stations.find(st => st.stationName.toLowerCase().includes(query));
    if (found) {
      stationSelect.value = found.stationShortCode;
      fetchTrainData(found.stationShortCode);
    } else {
      resultsDiv.innerHTML = `<p>No station found for "${query}".</p>`;
    }
  });

  // Fetch live train data from Digitraffic API
  function fetchTrainData(stationCode) {
    const url = `https://rata.digitraffic.fi/api/v1/live-trains/station/${stationCode}?departing_trains=5&arriving_trains=5`;

    resultsDiv.innerHTML = "<p>Loading train data...</p>";

    fetch(url)
      .then(res => res.json())
      .then(data => displayTrains(data, stationCode))
      .catch(err => {
        console.error("Error fetching train data:", err);
        resultsDiv.innerHTML = "<p style='color:red;'>Could not load train info.</p>";
      });
  }

  // Display train data
  function displayTrains(trains, stationCode) {
    if (!trains.length) {
      resultsDiv.innerHTML = `<p>No trains currently arriving/departing at ${stationCode}.</p>`;
      return;
    }

    let html = `<h2>Live Trains for Station: ${stationCode}</h2>`;
    html += "<div>";

    trains.forEach(train => {
      const trainType = train.trainType;
      const number = train.trainNumber;
      const category = train.trainCategory;
      const scheduledTimes = train.timeTableRows.filter(
        t => t.stationShortCode === stationCode
      );
      const departures = scheduledTimes.filter(t => t.type === "DEPARTURE");
      const arrivals = scheduledTimes.filter(t => t.type === "ARRIVAL");

      html += `
        <div class="train">
          <strong>${trainType} ${number}</strong> (${category})<br>
          ${arrivals.length ? `Arrival: ${arrivals[0].scheduledTime.slice(11,16)} ` : ""}
          ${departures.length ? `Departure: ${departures[0].scheduledTime.slice(11,16)} ` : ""}
          <br>Status: ${train.runningCurrently ? "On the move 🚆" : "Stopped ⛔"}
        </div>
      `;
    });

    html += "</div>";
    resultsDiv.innerHTML = html;
  }
});
