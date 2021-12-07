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
/* Variable for the the search input field globally, 
to be used when retrieving search keywords and when being 
listened to regarding the autocomplete */
var searchText = document.getElementById("searchText");
/* Array for the station names, to be used
in the autocomplete */
var stationNames = [];
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
        stationNamesToShortCodes.set(stationNameconformed, data[i].stationShortCode);
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
// SUBMIT BUTTON - click event invokes an anonymous callback function.
document.querySelector("#searchSubmit").addEventListener("click", () => {
    // buildUrl() returns a string that represents the URL used in the data fetching 
    fetch(createUrl())
        // Deliver the Response object as JSON.parse-able data
        .then(response => response.json())
        /* Here the data is eventually 
        printed inside the #timeTablesDiv */    
        .then(data => createTimeTable(data))
        // Console out an error message if fetch failed
        .catch(exception => console.log(exception));
    // The URL for the train query is returned from this function 
    function createUrl() {
        let searchInput = searchText.value;
        // conform the search keyword
        let searchInputConformed = conformWord(searchInput);
        // Translate the conformd search keyword into a corresponding shortcode
        stationShortCode = stationNamesToShortCodes.get(searchInputConformed);
        // Build a URL-string
        let searchUrl = "https://rata.digitraffic.fi/api/v1/live-trains/station/" + 
                        // Insert the shortcode as a parameter in the query
                        stationShortCode + 
                        /* Add pre-defined parametres to filter out non-passenger 
                        trains as well as those not stopping at the specified 
                        station. The amount of returned trains is also limited to 
                        15 minutes maneuver type */
                        "?departing_trains=10&arriving_trains=10&include_nonstopping=false&train_categories=Commuter,Long-distance";
        // Return the built URL string
        return searchUrl;
    }
    /* The time tables are created and added to the document */
    function createTimeTable(trains) {
        let arrivals = [],
            departures = [];
        createRecords(trains)
        arrivals = sortInfosByTime(arrivals);
        departures = sortInfosByTime(departures);
        appendTimetableRows(
            createTimetableRows(arrivals),
            "arrivals"
        );
        appendTimetableRows(
            createTimetableRows(departures),
            "departures"
        );
        // Only the essential data is extracted from each train 
        function createRecords(trains) {
            let arrivalsObj = {},
                departuresObj = {},
                stationNumber;
            for (train of trains) {
                stationNumber = 0;
                for (station of train.timeTableRows) {
                    let trainId,
                        scheduledAtTimeZone,
                        liveEstimateAtTimeZone;
                    if (station.stationShortCode === stationShortCode 
                       && station.actualTime === undefined) {

                        trainId = train.trainType + train.trainNumber;
                        scheduledAtTimeZone = new Date(station.scheduledTime);
                        liveEstimateAtTimeZone = new Date(station.liveEstimateTime);

                        if (station.type === "ARRIVAL") {
                            arrivalsObj = createtrainInfoObj(stationNumber - 1);
                            arrivals.push(arrivalsObj);
                        }
                        if (station.type === "DEPARTURE") {
                            departuresObj = createtrainInfoObj(stationNumber + 1);
                            departures.push(departuresObj);
                        }
                        function createtrainInfoObj(stationRefNum) {
                            trainInfoObj = {
                                dateTime : scheduledAtTimeZone,
                                train : trainId,
                                time : scheduledAtTimeZone.getHours() + 
                                    ":" + twoDigitMinutes(scheduledAtTimeZone.getMinutes()),
                                estTime : (() => {
                                    if (liveEstimateAtTimeZone != "Invalid Date") {
                                        return liveEstimateAtTimeZone.getHours() + 
                                        ":" + twoDigitMinutes(liveEstimateAtTimeZone.getMinutes())
                                    } else {
                                        return "";
                                    }
                                })(),
                                track : station.commercialTrack,
                                fromOrTo : (() => {
                                    let stationName = stationShortCodesToNames.get(
                                        train.timeTableRows[stationRefNum].stationShortCode);
                                    stationNameFormatted = formatStationNameForPresentation(stationName);
                                    return stationNameFormatted;                                    
                                })()
                            }
                            if (trainInfoObj.time === trainInfoObj.estTime) {
                                trainInfoObj.estTime = "";
                            }
                            return trainInfoObj;
                        }
                        function twoDigitMinutes(minutes) {
                            if (minutes.toString().length < 2) {
                                minutes = "0" + minutes.toString();
                            }
                            return minutes;
                        }
                        function formatStationNameForPresentation(stationName) {
                            stationName = stationName.replace(/u00e5/g, "\u00e5");
                            stationName = stationName.replace(/u00e4/g, "\u00e4");
                            stationName = stationName.replace(/u00f6/g, "\u00f6");
                            stationName = (() => {
                                let firstWordFirstLetter = stationName.slice(0, 1),
                                    restOfWord = stationName.slice(1, stationName.length),
                                    capitalLetter = firstWordFirstLetter.toUpperCase();
                                stationName = capitalLetter + restOfWord;
                                return stationName;
                            })();
                            return stationName;
                        }
                    }
                    stationNumber++;
                }
                
            }
        }
        function sortInfosByTime(trainInfoObjs) {
            trainInfoObjs.sort((a, b) => {
                return a.dateTime - b.dateTime;
            });
            for (obj of trainInfoObjs) {
                delete obj.dateTime;
            }
            return trainInfoObjs;
        }
        function createTimetableRows(trainInfoObjs) {
            let timeTableArr = [],
                rowN = 0,
                tr,
                td,
                property;
            for (trainInfoObj of trainInfoObjs) {
                tr = document.createElement("tr");
                for (let i = 0; i < Object.keys(trainInfoObj).length; i++) {
                    td = document.createElement("td");
                    property = Object.keys(trainInfoObj)[i].toString();
                    td.innerHTML = trainInfoObj[property];
                    tr.appendChild(td);
                }
                timeTableArr.push(tr);
                rowN++;
            }
            return timeTableArr;
        }
        function appendTimetableRows(timeTableArrs, maneuverType) {
            let arrivalsTable = document.querySelector("#arrivalsTable"),
                departuresTable = document.querySelector("#departuresTable"),
                i = 0;
            if (maneuverType === "arrivals") {
                createTableTemplate("arrivals");
                for (timeTableArr of timeTableArrs) {
                    arrivalsTable.appendChild(timeTableArr);
                }
            }
            if (maneuverType === "departures") {
                createTableTemplate("departures");
                for (timeTableArr of timeTableArrs) {
                    departuresTable.appendChild(timeTableArr);
                }
            }
            function createTableTemplate(type) {
                let template = 
                    `
                    <tr>
                        <td><h3>Train</h3></td>
                        <td><h3>Time</h3></td>
                        <td><h3>Est. time</h3></td>
                        <td><h3>Track</h3></td>
                    `;
                    if (type === "arrivals") {
                        arrivalsTable.innerHTML = 
                            `
                            <tr>
                                <th colspan="5"><h2>Train arrivals</h2></th>
                            </tr>
                            ` +
                            template + 
                            `
                                <td><h3>From</h3></td>
                            </tr>
                            `;
                    }
                    if (type === "departures") {
                        departuresTable.innerHTML = 
                        `
                        <tr>
                            <th colspan="5"><h2>Train departures</h2></th>
                        </tr>
                        ` +
                        template + 
                        `
                            <td><h3>To</h3></td>
                        </tr>
                        `;
                    }
            }
        }
    }
});
// Muistilista: 
// invocation boolean setintervallia varten
// järkkää ajan mukaan aikataulut