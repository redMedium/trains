const stations = fetch("https://rata.digitraffic.fi/api/v1/metadata/stations")
    .then(response => response.json())
    .then(data => {return data});

console.log(stations);

document.querySelector("#searchSubmit").addEventListener("click",                           // Submit button event, when selected, ...
    () => {                                                                                 // ... calls an anonymous function.
        var searchText = document.querySelector("#searchText").value;                       // Save the search field input text to a variable.
        var trainArr = [];

        fetch("https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/TPE")
            .then(response => response.json())
            .then(data => trainArr.push(data));

        console.log(trainArr);
    }
);
