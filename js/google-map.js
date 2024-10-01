var google;

function init() {
    var mapOptions = {
        zoom: 7,
        center: new google.maps.LatLng(9.0765, 7.3986), // Default center (Nigeria)
        scrollwheel: false,
        styles: [ // ... (Your map styles)
        ]
    };

    var map = new google.maps.Map(document.getElementById('map'), mapOptions);

    var addresses = ['Ogun State']; // Array of addresses to geocode

    for (var x = 0; x < addresses.length; x++) {
        geocodeAddress(addresses[x], map);
    }
}

function geocodeAddress(address, map) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({ 'address': address }, function(results, status) {
        if (status === 'OK') {
            var latlng = results[0].geometry.location;

            new google.maps.Marker({
                position: latlng,
                map: map,
                icon: 'images/loc.png'
            });

            // Optionally, center the map on the first result
            // map.setCenter(results[0].geometry.location);
        } else {
            console.error('Geocode was not successful for the following reason: ' + status);
        }
    });
}

google.maps.event.addDomListener(window, 'load', init);
