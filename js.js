/* Station name-to-abbreviation translator, 
used in converting human-friendly station names
into URL-able keywords in saveStationData() */
var stationShortCodesToNames = new Map(),
/* Station abbreviation-to-name translator, 
does the opposite than the Map above. Used in
createTimeTable() */
    stationNamesToShortCodes = new Map(),
/* The abbreviation of the searched station, is initialised 
when the search is made and later used in the creation of 
the timetables */
    stationShortCode,
// Display the name of the queried station on the page
    header = document.querySelector("h1"),
/* Variable for the the search input field globally, 
to be used when retrieving search keywords and when being 
listened to regarding the autocomplete */
    searchText = document.getElementById("searchText"),
// Array for the station names, to be used
// in the autocomplete feature
    stationNames = [],
    // the autocomplete list appears below search bar, includings 
    // are set in autoComplete()
    autoCompleteUl = document.getElementById("autoCompleteUl"),
// The status indicator on the page 
    statusBar = document.getElementById("statusMessage"),
// The user input to the search bar, is used and initiated 
// in autoComplete and when retrieving search results 
    searchInput;
// Fetch train station data from Digitraffic API
fetch("https://rata.digitraffic.fi/api/v1/metadata/stations")
    // Deliver the Response object as JSON.parse-able data
    .then(response => response.json())
    // Deliver data array to a callback function 
    .then(data => {
        // If data loading succeeded, continue promise handling
        saveStationData(data);
        // in addition, modify the page to display search bar 
        // and hide at this point obsolete status message 
        displaySearchBar();
        }
    )
    .catch(exception => {
        // Console out an error message ...
        console.log(exception);
        // ... and display an error message if the fetch failed
        statusBar.innerHTML += "An error has occured, please try again later."
        }
    );
/* Iterate as many times as there are elements in the array argument.
Array elements are objects, from which corresponding properties are
excerpted from and used as key-value pairs in the translator */
function saveStationData(data) {
    for (let i = 0; i < data.length; i++) {
        // save the station name to a variable from the station object
        let stationName = data[i].stationName;
        // Conform the station name property in the data object
        let stationNameConformed = conformPhrase(stationName);
        // Add key-value pairs to both translator Maps
        stationNamesToShortCodes.set(
            stationNameConformed, data[i].stationShortCode
            );
        stationShortCodesToNames.set(
            data[i].stationShortCode, stationNameConformed
            );
        // add only the station name to the list used in autoComplete()
        stationNames.push(stationNameConformed);
    }
}
// display search bar when station data has been successfully loaded 
function displaySearchBar() {
    let searchDiv = document.getElementById("searchDiv");
        statusBar.style.display = "none";
        searchDiv.style.display = "block";    
}
/* Search keywords are allowed to deviate from
the actual key name in the translator when both 
of those are first matched (i.e. both of those  
are being altered in this same function) */
function conformPhrase(word) {
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
// Trigger autoComplete() when a letter is typed or removed
// at the search input 
searchText.addEventListener("input", () => {
    autoComplete();
});
/* The autocomplete feature for the search input: Suggestions 
appear below the search bar as user types and are narrowed 
down when letters are further added to the key phrase, the 
suggestions show the results that CONTAIN the key phrase */
function autoComplete() {
    // make sure the ul is empty before adding more stuff to it 
    autoCompleteUl.innerHTML = "";
    // get the latest user input 
    searchInput = searchText.value;
    // the search text is conformed to match the names in stationNames
    let searchInputConformed = conformPhrase(searchInput),
    // every addition to the search string narrows down the number of 
    // stations matching the query, and vice versa. The currently 
    // valid options are listed here 
        searchCandidates = [];
    // iterate over all station names
    for (stationName of stationNames) {
        // find all station names that includes the search phrase 
        if (stationName.includes(searchInputConformed)) {
            searchCandidates.push(stationName);
        }
    }
    // handle the adding to the document in here
    appendStationNamesToUl(searchCandidates);
    // add the current search result candidates to the list below 
    // the search bar
    function appendStationNamesToUl(searchCandidates) {
        // the li to which the station name is added
        let li, 
        // the counter to limit the number of items
            limiter = 0;
        // iterate over phrases which include the query phrase
        for (stationName of searchCandidates) {
            if (limiter > 7) {
                break;
            }
            li = document.createElement("li");
            li.innerHTML = formatStationNameForPresentation(stationName);
            autoCompleteUl.appendChild(li);
            limiter++;
        }
        if (searchCandidates.length === 0 && searchInput !== "") {
            li = document.createElement("li");
            li.innerHTML = "<i>No results</i>";
            li.setAttribute("style", "color: grey");
            autoCompleteUl.appendChild(li);
        }
        if (searchInput === "") {
            autoCompleteUl.innerHTML = "";
        }
    }
}
// SUBMIT BUTTON - click event invokes an anonymous callback function.
document.querySelector("#searchSubmit").addEventListener("click", () => {
    // buildUrl() returns a string that represents the URL used in the 
    // data fetching 
    fetch(createFetchTrainsUrl())
        .then(response => response.json())
        /* Here the data is eventually 
        printed inside the #timeTablesDiv */    
        .then(data => createTimeTable(data))
        // Console out an error message if fetch failed
        .catch(exception => console.log(exception));
    }
);
// The URL for the train query is returned from this function 
function createFetchTrainsUrl() {
    searchInput = searchText.value;
    // Define a default value for an empty query
    if (searchInput === "") {
        searchInput = "Turku asema";
    }
    // Display the name of the station above timetables
    header.innerHTML = formatStationNameForPresentation(searchInput);
    // Conform the search keyword
    let searchInputConformed = conformPhrase(searchInput);
    // Translate the conformd search keyword into a corresponding shortcode
    stationShortCode = stationNamesToShortCodes.get(searchInputConformed);
    // check if the queried station exist
    if (stationShortCode === undefined) {
        statusBar.innerHTML = "Could not find searched station, please check your input";
        statusBar.style.display = "block";
        throw console.error("error: Invalid search keyphrase");
    } else {
        statusBar.style.display = "none";
    }
    // Build a URL-string
    let searchUrl = "https://rata.digitraffic.fi/api/v1/live-trains/station/" + 
                    // Insert the shortcode as a parameter in the query
                    stationShortCode + 
                    /* Add pre-defined parametres to filter out non-passenger 
                    trains as well as those not stopping at the specified 
                    station. The amount of returned trains is also limited to 
                    10 per maneuver type */
                    "?departing_trains=10" + 
                    "&arriving_trains=10" + 
                    "&include_nonstopping=false" + 
                    "&train_categories=Commuter,Long-distance";
    // Return the built URL string
    return searchUrl;
}
function formatStationNameForPresentation(stationName) {
    stationName = stationName.replace(/u00e5/g, "\u00e5");
    stationName = stationName.replace(/u00e4/g, "\u00e4");
    stationName = stationName.replace(/u00f6/g, "\u00f6");
    stationName = (() => {
        // First letter of first word to capital
        let firstLetterOfFirstWord = stationName.slice(0, 1),
            restOfFirstWord = stationName.slice(1, stationName.length),
            indexOfSpace = stationName.indexOf(" ");
        firstLetterOfFirstWord = firstLetterOfFirstWord.toUpperCase();
        stationName = firstLetterOfFirstWord + restOfFirstWord;
        if (indexOfSpace !== -1) {
            let firstLetterOfSecondWord = stationName.slice(
                    indexOfSpace + 1, indexOfSpace + 2),
                restOfSecondWord = stationName.slice(indexOfSpace + 2, stationName.length);
            restOfFirstWord = stationName.slice(1, indexOfSpace);
            firstLetterOfSecondWord = firstLetterOfSecondWord.toUpperCase();
            stationName = 
                firstLetterOfFirstWord + 
                restOfFirstWord + 
                " " +
                firstLetterOfSecondWord + 
                restOfSecondWord;
        }
        return stationName;
    })();
    return stationName;
}
/* The time tables are created and added to the document */
function createTimeTable(trains) {
    // arrays for the two types of trainInfoObjs
    let arrivals = [],
        departures = [];
    // trainInfoObjs are created and added to respective 
    // arrays 
    createRecords(trains);
    // sort for displaying the trains in the correct order
    // on the timetable 
    arrivals = sortInfosByTime(arrivals);
    departures = sortInfosByTime(departures);
    // append timetables to timeTablesDiv
    appendTimetableRows(
        createTimetableRows(arrivals),
        // type of argument traininfoArrs
        "arrivals"
    );
    appendTimetableRows(
        createTimetableRows(departures),
        // type of argument traininfoArrs
        "departures"
    );
    // Only the essential data is extracted from each train 
    function createRecords(trains) {
        // Objects to carry trainInfo (train, time, track, etc...)
        let arrivalsObj = {},
            departuresObj = {};
        // of each train is taken data to build trainInfoObj
        for (train of trains) {
            // each raw train obj contain its timetable which 
            // is iterated
            for (station of train.timeTableRows) {
                // combination of a letter and a number
                let trainId,
                // scheduled time the train interacts with the station
                    scheduledAtTimeZone,
                // estimated time the train interacts with the station
                    liveEstimateAtTimeZone;
                // trainInfoObj is built of information only regarding 
                // the queried station
                if (station.stationShortCode === stationShortCode 
                // filter out past events
                    && station.actualTime === undefined) {
                    // build the train id of letter + number 
                    trainId = train.trainType + train.trainNumber;
                    // scheduled time the train interacts with the station
                    scheduledAtTimeZone = new Date(station.scheduledTime);
                    // estimated time the train interacts with the station
                    liveEstimateAtTimeZone = new Date(station.liveEstimateTime);
                    // Note that the logic behind the method of selecting the 
                    // station in question may deviate from what is announced 
                    // in the timetables delivered by VR Group 
                    if (station.type === "ARRIVAL") {
                        // the first station of the schedule is given as the parameter 
                        arrivalsObj = createtrainInfoObj(0);
                        arrivals.push(arrivalsObj);
                    }
                    if (station.type === "DEPARTURE") {
                        // the last station of the schedule is given as the parameter 
                        departuresObj = createtrainInfoObj(train.timeTableRows.length - 1);
                        departures.push(departuresObj);
                    }
                    // the trainInfoObj contains all the information used at the eventual
                    // timetable, the property names match the colums in that timetable 
                    function createtrainInfoObj(stationRefNum) {
                        trainInfoObj = {
                            // to be used for sorting the objs by time, they are to be 
                            // order at the timetable
                            dateTime : scheduledAtTimeZone,
                            train : trainId,
                            // build the time string for presentation
                            time : scheduledAtTimeZone.getHours() + 
                                ":" + twoDigitMinutes(scheduledAtTimeZone.getMinutes()),
                            estTime : (() => {
                                // in such cases that the estimated time is not presented ...
                                if (liveEstimateAtTimeZone == "Invalid Date") {
                                    // ... replace the "Invalid Date" with an empty string 
                                    return "";
                                }
                                // Build the time string for presentation
                                return liveEstimateAtTimeZone.getHours() + 
                                ":" + twoDigitMinutes(liveEstimateAtTimeZone.getMinutes())
                            })(),
                            track : station.commercialTrack,
                            // depending on in which group the trainInfo belongs 
                            // (arrivals or departures)
                            fromOrTo : (() => {
                                // get the station short code translated to station 
                                // name and format for presentation 
                                let stationName = stationShortCodesToNames.get(
                                    train.timeTableRows[stationRefNum].stationShortCode);
                                stationNameFormatted = formatStationNameForPresentation(stationName);
                                return stationNameFormatted;                                    
                            })()
                        }
                        // if the train is not in time, the estimated time is displayed. 
                        if (trainInfoObj.time === trainInfoObj.estTime) {
                            trainInfoObj.estTime = "";
                        }
                        // return built obj back to the conditionals which separate 
                        // those objs based on maneuver type 
                        return trainInfoObj;
                    }
                    // by default, the minutes are displayed so that only 
                    // the integer representing those is shown. Format the 
                    // minutes so that it is always presented with two digits 
                    function twoDigitMinutes(minutes) {
                        if (minutes.toString().length < 2) {
                            minutes = "0" + minutes.toString();
                        }
                        return minutes;
                    }
                }
            }
        }
    }
    // the trainInfos are sorted so that they are presented 
    // in the timetable from top earliest to bottom latest train 
    function sortInfosByTime(trainInfoObjs) {
        trainInfoObjs.sort((a, b) => {
            return a.dateTime - b.dateTime;
        });
        // dateTime is only for sorting purposes, NOT to be 
        // sent to createTimetableRows()
        for (obj of trainInfoObjs) {
            delete obj.dateTime;
        }
        return trainInfoObjs;
    }
    // create the HTML elements for the document 
    function createTimetableRows(trainInfoObjs) {
        // to be returned and used as a parameter for 
        // appendTimetableRows()
        let timeTableArr = [],
            rowN = 0,
            tr,
            td,
            property;
        for (trainInfoObj of trainInfoObjs) {
            tr = document.createElement("tr");
            // add the property values to td's (appreciating the correct order) 
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
            departuresTable = document.querySelector("#departuresTable");
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