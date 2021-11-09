document.querySelector("#searchSubmit").addEventListener("click",    // submit button event, when selected, ...
    () => {    // ... calls an anonymous function
        var searchText = document.querySelector("#searchText").value;    // save the search field input text to a variable
        var respArr = [];

        fetch("https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/TPE")
            .then(resp => resp.json())
            .then(data => respArr.push(data));

        console.log(respArr);
    }
);