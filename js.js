/* Station name-to-abbreviation translator, 
used in converting human-friendly station names
into URL-able keywords in saveStationData() */
var stationShortCodesToNames = new Map();
/* Station abbreviation-to-name translator, 
does the opposite than the Map above. Used in
createTimeTable() */
var stationNamesToShortCodes = new Map();
/* The abbreviation of the searched station, is initialised 
when the search is made and later used in the creation of 
the timetables */
var stationShortCode;
/* A list of Train-objects, used in the final step of 
the station search when the schedule is displayed to 
the user */
var trains = [];
/* Variable for the the search input field globally, 
to be used when retrieving search keywords and when being 
listened to regarding the autocomplete */
var searchInput = document.querySelector("#searchText");
/* Array for the station names, to be used
in the autocomplete */
var stationNames = [];
// The table where the train departures info is added at createTimeTable()
var departuresTable = document.querySelector("#departuresTable");
// The table where the train arrivals info is added at createTimeTable()
var arrivalsTable = document.querySelector("#arrivalsTable");
// The div where the clock is added at createTimeTable()
var clockDiv = document.querySelector("#clockDiv");
// Fetch train station data from Digitraffic API
fetch("https://rata.digitraffic.fi/api/v1/metadata/stations")
    // Deliver the Response object as JSON.parse-able data
    .then(response => response.json())
    // Deliver data array to a callback function 
    .then(data => saveStationData(data))
    // Console out an error message if fetch failed
    .catch(exception => console.log(exception));
/* Iterate as many times as there are elements in the array argument.
Array elements are objects, from which corresponding properties are
excerpted from and used as key-value pairs in the translator */
function saveStationData(data) {
    for (let i = 0; i < data.length; i++) {
        // save the station name to a variable from the station object
        let stationName = data[i].stationName;
        /* add the name into the autocomplete list before 
        uniformising */
        stationNames.push(stationName);
        // Conform the station name property in the data object
        let stationNameconformed = conformWord(stationName);
        // Add key-value pairs to the Map
        stationShortCodesToNames.set(stationNameconformed, data[i].stationShortCode);
        // Add key-value pairs to the Map
        stationShortCodesToNames.set(data[i].stationShortCode, stationNameconformed);
    }
}
function autoComplete() {

}
/* Search keywords are allowed to deviate from
the actual key name in the translator when both 
of those are first matched (i.e. both of those  
are being altered in this same function) */
function conformWord(word) {
    /* Allow the ignorance of whether the search keyword 
    contains uppercase or lowecase letters */
    word = word.toLowerCase();
    // Deliver word to a callback function
    word = scandiLetterTranslator(word);
    // Return the conformd word to its caller
    return word;
    /* Scandinavian letters "å", "ä" and, "ö" can be found in Finnish and 
    Swedish station names. However, those letters used in a map key, 
    will result in failed queries and are therefore being 
    referenced to according to their UTF-16 encoding */
    function scandiLetterTranslator(word) {
        // Welcome to the deepest pit of a so called "callback hell"
        word = word.replace(/\u00e5/g, "u00e5");
        word = word.replace(/\u00e4/g, "u00e4");
        word = word.replace(/\u00f6/g, "u00f6");
        // return the "ASCII-friendlisised" word to the caller
        return word;
    }
}
// A submit button click event invokes an anonymous callback function.
document.querySelector("#searchSubmit").addEventListener("click", () => {
    // buildUrl() returns a string that represents the URL used in the data fetching 
    fetch(createUrl())
        // Deliver the Response object as JSON.parse-able data
        .then(response => response.json())
        // Access the response's array and ...
        .then(data => {
            /* ... iterate over its train objects. Those are then 
            saved in a global array. trains array must be empty
            every time a new fetch is made */
            trains = [];
            for (let train of data) {
                // Add train objects to trains array
                trains.push(train);
            }
            console.log(trains);
        })
        .then(createTimeTable())
        // Console out an error message if fetch failed
        .catch(exception => console.log(exception));
    // The URL for the train query is returned from this function 
    function createUrl() {
        // Save the search field input text into a variable
        let searchText = searchInput.value;
        // conform the search keyword
        let searchTextconformed = conformWord(searchText);
        // Translate the conformd search keyword into a corresponding shortcode
        stationShortCode = stationShortCodesToNames.get(searchTextconformed);
        // Build a URL-string
        let searchUrl = "https://rata.digitraffic.fi/api/v1/live-trains/station/" + 
                        // Insert the shortcode as a parameter in the query
                        stationShortCode + 
                        /* Add pre-defined parametres to filter out non-passenger 
                        trains as well as those not stopping at the specified 
                        station. The amount of returned trains is also limited */
                        "?arrived_trains=5&arriving_trains=5&departed_trains=5&departing_trains=5&include_nonstopping=false&train_categories=Commuter";
        return searchUrl;
    }
    function createTimeTable() {
        var departures = [];
        var arrivals = [];
        sortTrains();
        createArrivalsTableData(arrivals);
        createDeparturesTableData(departures);
        createClock();
        function sortTrains() {
            for (let train of trains) {
                let stationN = 0;
                for (let timeTable of train.timeTableRows) {
                    if (timeTable.stationShortCode === stationShortCode) {
                        if (timeTable.type === "ARRIVAL") {
                            let fromStationShortCode = train.timeTableRows[train.stationN - 1]
                                    .stationShortCode,
                                fromStationName = stationNamesToShortCodes.get(fromStationShortCode);
                            train.fromStationName = fromStationName;
                            train.stationN = stationN;
                            arrivals.push(train);
                            break;
                        }
                        if (timeTable.type === "DEPARTURE") {
                            let toStationShortCode = train.timeTableRows[train.stationN + 1]
                                    .stationShortCode,
                                toStationName = stationNamesToShortCodes.get(toStationShortCode);
                            train.toStationName = toStationName;
                            train.stationN = stationN;
                            departures.push(train);
                            break;
                        }
                    }
                    stationN++;
                }
            }
        }
        function createDeparturesTableData(array) {
            let tableObj = createTableData(array),
                fromTd = document.createElement("td");
            for (let property in tableObj) {
                let tr = property;
                departuresTable.append(tr);
            }
        }
        function createArrivalsTableData(array) {
            let tableObj = createTableData(array),
                toTd = document.createElement("td");
            for (let property in tableObj) {
                let tr = property;
                arrivalsTable.append(tr);
            }
        }
        function createTableData(array) {
            let tableObj = {},
                i = 0;
            for (let train of array) {
                let tr = document.createElement("tr"),
                    trainTd = document.createElement("td"),
                    timeTd = document.createElement("td"),
                    estTimeTd = document.createElement("td"),
                    trackTd = document.createElement("td");
                    stationInfo = train.timeTableRows[train.stationN];
                trainTd.innerHTML = train.trainNumber;
                timeTd.innerHTML = stationInfo.scheduledTime;
                estTimeTd.innerHTML = stationInfo.actualTime;
                trackTd.innerHTML = stationInfo.commercialTrack;
                tr.append(trainTd, timeTd, estTimeTd, trackTd);
                tableObj.i = tr;
                i++;
            }
            return tableObj;
        }
        function createClock() {
            
        }
    }
});

// muista tehä ok tsekit
// invocation boolean setintervallia varten
// muuta callback hellit promiseiks
