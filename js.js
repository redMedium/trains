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
        // Add key-value pairs to both translator Maps
        stationShortCodesToNames.set(stationNameconformed, data[i].stationShortCode);
        stationShortCodesToNames.set(data[i].stationShortCode, stationNameconformed);
    }
}
/* The autocomplete feature for the search input: Suggestions 
appear below the search bar as user types and are narrowed 
down when letters are further added to the key phrase, the 
suggestions show the results that CONTAIN the key phrase */
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
            saved in the global trains array. That array must be empty
            every time a new fetch is made */
            trains = [];
            for (let train of data) {
                // Add train objects to the global trains array
                trains.push(train);
            }
                                                                                                                        console.log(trains);
        })
        /* This function ends in void as data is eventually 
        printed inside the #timeTablesDiv */
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
        // Return the built URL string
        return searchUrl;
    }
    /* The time tables are created and added to the document */
    function createTimeTable() {
        // Arrays for different maneuver types of trains 
        var departures = [];
        var arrivals = [];
        /* Trains are first sorted in corresponding arrays which 
        in turn ... */
        sortTrains();
        /* ... work as arguments for the two different 
        create...TableData() functions */
        createArrivalsTableData(arrivals);
        createDeparturesTableData(departures);
        // The clock is added between the two timetables 
        createClock();
        /* Trains are displayed on the left- and right-hand sides 
        of the #timeTableDiv depending on the type of maneuver, 
        therefore they are first sorted */
        function sortTrains() {
            // Iterate over global trains array
            for (let train of trains) {
                /* Station number is needed when determining the from- or 
                to-stations relative to the number the queried one represents */
                let stationN = 0;
                /* Iterate over each train's timetable ... */
                for (let timeTable of train.timeTableRows) {
                    /* ... and search for the queried station */
                    if (timeTable.stationShortCode === stationShortCode) {
                        // Sort the trains 
                        sortByManeuverType(train, timeTable, stationN);
                    }
                    // Next station, please!
                    stationN++;
                }
            }
            /* Trains are parted into departures and departures arrays depending 
            on of which type they represent regarding to the queried station */
            function sortByManeuverType(train, timeTable, stationN) {
                // If the train is arriving to the station ... 
                if (timeTable.type === "ARRIVAL") {
                    let fromStationShortCode = train.timeTableRows[train.stationN - 1]
                            .stationShortCode,
                        fromStationName = stationNamesToShortCodes.get(fromStationShortCode);
                    train.fromStationName = fromStationName;
                    train.stationN = stationN;
                    // ... it is added to arrivals array 
                    arrivals.push(train);
                    break;
                }
                // If the train is departing from the station ... 
                if (timeTable.type === "DEPARTURE") {
                    let toStationShortCode = train.timeTableRows[train.stationN + 1]
                            .stationShortCode,
                        toStationName = stationNamesToShortCodes.get(toStationShortCode);
                    train.toStationName = toStationName;
                    train.stationN = stationN;
                    // ... it is added to departures array 
                    departures.push(train);
                    break;
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
