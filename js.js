/* Station name-to-abbreviation translator, later to be 
used in converting human-friendly station names
into URL-able keywords */
var stationShortCodesToNames = new Map();
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
// Fetch train station data
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
        let stationNameconformd = conformWord(stationName);
        // Add key-value pairs to the Map
        stationShortCodesToNames.set(stationNameconformd, data[i].stationShortCode)
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
    fetch(buildUrl())
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
        .then(buildTimetable())
        // Console out an error message if fetch failed
        .catch(exception => console.log(exception));
    // The URL for the train query is returned from this function 
    function buildUrl() {
        // Save the search field input text into a variable
        var searchText = searchInput.value;
        // conform the search keyword
        searchTextconformed = conformWord(searchText);
        // Translate the conformd search keyword into a corresponding shortcode
        var stationShortCode = stationShortCodesToNames.get(searchTextconformed);
        // Build a URL-string
        var searchUrl = "https://rata.digitraffic.fi/api/v1/live-trains/station/" + 
                        // Insert the shortcode as a parameter in the query
                        stationShortCode + 
                        /* Add pre-defined parametres to filter out non-passenger 
                        trains as well as those not stopping at the specified 
                        station. The amount of returned trains is also limited */
                        "?arrived_trains=5&arriving_trains=5&departed_trains=5&departing_trains=5&include_nonstopping=false&train_categories=Commuter";
        return searchUrl;
    }
    function buildTimetable() {
        sortTrains();
        function sortTrains() {
            let departures = [];
            let arrivals = [];
            for (let train of trains) {
                for (let timeTable of train.timeTableRows) {
                    if (timeTable.stationShortCode === stationShortCode) {
                        if (timeTable.type === "DEPARTURE") {
                            departures.push(train);
                        }
                        if (timeTable.type === "ARRIVAL") {
                            arrivals.push(train);
                        }
                    }
                }
            }
            arrivals(arrivals);
            departures(departures);
            function arrivals(array) {
                list(array);
            }
            function departures(array) {
                list(array);
            }
            function list(array) {
                
                for (let train of array) {
                }
            }
        }
        function clock() {
            
        }
    }
});

// muista tehä ok tsekit
// invocation boolean setintervallia varten
