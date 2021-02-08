// This is front end library.
/**
 * 1. we render the html file from server
 * 2. This file before giving to client, we will do some front end rendering as well.
 * 3. After rendering all stuffs then only we will send it to client. 
 * (check frontendJS.txt for detail information)
 */

// 1. we want to get access to the location data 
// 2. By attaching string data to id map from tour.pug 

// we have location data in id map in data-location 

export const displayMap = (locations) => {
    /**
     * accessToken and mapboxgl is provided by map box
     * it needs div of id to add this map box to the page 
     */
    mapboxgl.accessToken = 'pk.eyJ1IjoiYW1yaXRyZWdtaSIsImEiOiJja2oyNGcyajYyMzhvMnlxdHhsaGp6NGZ3In0.9N6A0EeG80pMiz3n2be47Q';
    
    // telling mapbox guy to add map in div#map with provided style(just pass an option)
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/amritregmi/ckj2bdxnh08gh19qwjybd1loh',
        scrollZoom:false
    });
    
    /**
     * A LngLatBounds object represents a geographical bounding box, // 1. create a object 
     * defined by its southwest and northeast points in longitude and latitude.
     * LatLngBounds displays the area specified on the map
     * LngLatBounds.extend is a function that Extend the bounds to include a given LngLatLike or LngLatBoundsLike.
     * 2. include coordinates by using extend function 
     */
    const bounds = new mapboxgl.LngLatBounds()
    
    // loop to the locations array and add a marker to that location 
    locations.forEach(location => {
        
        // 1 create a Marker with css by creating a new html element 
        const el = document.createElement('div')
        el.className = 'marker'
    
        // 2. Creating a marker object and Adding it to the map
        new mapboxgl.Marker({
            element: el,
            anchor:'bottom'
        })
            .setLngLat(location.coordinates)
            .addTo(map)
        
        // add popup  
        new mapboxgl
            .Popup({offset:30})
            .setLngLat(location.coordinates)
            .setHTML(`<p>Day ${location.day}: ${location.description} </p>`)
            .addTo(map)
    
        // 3. make the boundary with given coordinates
        bounds.extend(location.coordinates)
    });
    //4. Fit the bound(boundary) box into the map. with style options 
    const mapPaddingOption = {
            top: 200,
            bottom: 150,
            left: 100,
            right:100
    }
    map.fitBounds(bounds, {
        padding: mapPaddingOption
    })
}
