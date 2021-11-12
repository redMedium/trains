var stationShortCodesToNames = new Map();

// Save the search field input text to a variable.
var searchText = document.querySelector("#searchText").value;

fetch("https://rata.digitraffic.fi/api/v1/metadata/stations")
    .then(response => response.json())
    .then(data => saveStationData(data));

function saveStationData(data) {
    for (let i = 0; i < data.length; i++) {
        stationShortCodesToNames.set(data[i].stationName, data[i].stationShortCode)
    }
}

// A submit button click event, ...
document.querySelector("#searchSubmit").addEventListener("click",
    // ... invokes an anonymous callback function.
    () => {
console.log(searchText);
        stationShortCode = stationShortCodesToNames.get(searchText);
console.log(stationShortCode);
        var searchUrl = "https://rata.digitraffic.fi/api/v1/live-trains/station/" + 
                        stationShortCode + 
                        "?arrived_trains=5&arriving_trains=5&departed_trains=5&departing_trains=5&include_nonstopping=false&train_categories=Commuter";
console.log(searchUrl);
        fetch(searchUrl)
            .then(response => response.json())
            .then(data => console.log(data));
    }
);
