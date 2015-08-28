
var mySessionId;
var map;
var userLocation;
var userLocationName;
var fuzzyUserLocation;
var markersMap = {};
var markerImage;
var watchPosition;
var advanced = false;
var shareAccurateLocation = false;

var isLowResolution = window.screen.width < 768;
var defaultZoom = isLowResolution ? 2 : 3;
var minZoom = isLowResolution ? 1 : 3;

var timeLastMessage = new Date().getTime()

var locationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 10000
};

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;',
    "卐": 'I am a dick ',
    "卍": 'I am a dick '
};

function initialize() {

    var defaultLatLng = new google.maps.LatLng(32.078043, 34.774177); // Add the coordinates

    markerImage = {
        url: 'images/blue_marker.png',
        scaledSize: new google.maps.Size(30, 30)
    };

    disabledMarkerImage = {
        url: 'images/grey_marker.png',
        scaledSize: new google.maps.Size(30, 30)
    };


    var mapOptions = {
        center: defaultLatLng,
        zoom: defaultZoom, // The initial zoom level when your map loads (0-20)
        minZoom: minZoom, // Minimum zoom level allowed (0-20)
        maxZoom: 18, // Maximum soom level allowed (0-20)
        zoomControl:false, // Set to true if using zoomControlOptions below, or false to remove all zoom controls.
        mapTypeId: google.maps.MapTypeId.ROADMAP, // Set the type of Map
        scrollwheel: true, // Enable Mouse Scroll zooming

        // All of the below are set to true by default, so simply remove if set to true:
        panControl:false, // Set to false to disable
        mapTypeControl:false, // Disable Map/Satellite switch
        scaleControl:false, // Set to false to hide scale
        streetViewControl:false, // Set to disable to hide street view
        overviewMapControl:false, // Set to false to remove overview control
        rotateControl:false // Set to false to disable rotate control
    };
    var mapDiv = document.getElementById('map-canvas');
    map = new google.maps.Map(mapDiv, mapOptions);

    navigator.geolocation.getCurrentPosition(onFirstPosition, onPositionError/*, locationOptions*/);
}

function setupWatchPosition() {
    if (!watchPosition) {
        watchPosition = navigator.geolocation.watchPosition(onPositionUpdate, onPositionError/*, locationOptions*/);
    }
}

function onFirstPosition(position){
    setUserLocation(position.coords.latitude, position.coords.longitude);
    getLocation(position.coords.latitude, position.coords.longitude).then(function(res){
        userLocationName = res
    })
    initialiseEventBus();
    map.panTo(userLocation);
}

function onPositionUpdate(position) {
    if (markersMap[mySessionId]) { //update user marker position
        setUserLocation(position.coords.latitude, position.coords.longitude);
        var userMarker = markersMap[mySessionId].marker;
        userMarker.setPosition(shareAccurateLocation ? userLocation : fuzzyUserLocation);
    }
}

function onPositionError(err) {
    Materialize.toast('User location not available :(', 7000);
    
    if(!mySessionId) {
      $.getJSON("http://ipinfo.io", function(doc){
        var latlong = doc.loc.split(",")
        setUserLocation(parseFloat(latlong[0]), parseFloat(latlong[1]));
        getLocation(parseFloat(latlong[0]), parseFloat(latlong[1])).then(function(res){
          userLocationName = res
        })
        initialiseEventBus();
        map.panTo(userLocation);
        
      }, function(err) {
        setUserLocation(Math.random()*50, Math.random()*60);
        userLocationName = "unknown.na"
        initialiseEventBus();
        map.panTo(userLocation);
      })
    }
}

function setUserLocation(lat, lng){
    userLocation = new google.maps.LatLng(lat, lng);
    fuzzyUserLocation = new google.maps.LatLng(Math.round(lat * 100) / 100, Math.round(lng * 100) / 100);    
}

function createMessage(text){
    return {
        lat: shareAccurateLocation ? userLocation.lat() : fuzzyUserLocation.lat(),
        lng: shareAccurateLocation ? userLocation.lng() : fuzzyUserLocation.lng(),
        loc: userLocationName,
        sessionId: mySessionId,
        text: text
    };
}

function getLocation(lat,lng) {
    return new Promise(function(resolve,reject){
        var latlng = new google.maps.LatLng(lat, lng);
        var geocoder = new google.maps.Geocoder()
        
        function checkType(comp,typ) {
            for(var i = 0; i < comp.types.length; i++) {
                if(comp.types[i] == typ)
                    return true
            }
            return false
        }    
        
        geocoder.geocode({latLng:latlng},function(res,status){
            if(status == google.maps.GeocoderStatus.OK) {
                var comps = res[0]["address_components"]
                var town = undefined
                var country = undefined
                
                //console.log(JSON.stringify(res,null,2))
                
                for(var i = 0; i < comps.length; i++) {
                    var comp = comps[i]
                    if(!town && checkType(comp,"administrative_area_level_2")) {
                        town = comp.short_name
                    }
                    /*if(!town && checkType(comp,"administrative_area_level_1")) {
                        town = comp.long_name
                    }*/
                    else if(checkType(comp,"locality")) {
                        town = comp.long_name
                    }
                    if(checkType(comp,"country")) {
                        country = comp.short_name
                    }        
                }
                
                resolve(town + " (" + country + ")")
              
            } else {
                reject("error1")
            }
        })
    })
}

// Copied from http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
function linkify(inputText) {
    var intext = inputText.toString()
    var replacedText, replacePattern1, replacePattern2, replacePattern3;
    
    //Channels starting with #
    replacePattern1 = /(#(\S)+)/gim;
    replacedText = intext.replace(replacePattern1, '<a href="javascript:;" onclick="channelOpen(\'$1\');">$1</a>');

    //URLs starting with http://, https://, or ftp:// and ending with .jpg,.png
    replacePattern1 = /((\s+|^)(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*?\.(jpg|png|gif))/gim;
    replacedText = replacedText.replace(replacePattern1, '<a href="$1" target="_blank"><img src="$1" style="max-width:320px;max-height:200px" /></a>');
    
    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /((\s+|^)(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = replacedText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}


// xss prevention hack
function sanitizeMsg(msg) {    
    function html(text) {
        //text = html_sanitize(text);
        
        text = text.replace(/&(\S{1,4};)/g,"&amp;$1")
        
        text = text.replace(/[<>卐卍]/g, function (s) {
            return entityMap[s];
        });        
        
        text = text.replace(/_br_/g,"<br/>")
        
        text = linkify(text)
        return text
    }
    
    if(msg.text)
        msg.text = html(msg.text)
    if(msg.loc)
        msg.loc = msg.loc.replace(/[<>"'\\\/卐卍]/g,"")
    if(msg.nick)
        msg.nick = msg.nick.replace(/[<>"'\\\/卐卍]/g,"")
    if(msg.nick_color)
        msg.nick_color = msg.nick_color.replace(/[<>"'\\\/;:]/g,"")
}


function displayMessageOnMap(msg){
    var newPosition = new google.maps.LatLng(msg.lat,msg.lng);
    var msgSessionId = msg.sessionId;

    if(markersMap[msgSessionId]){ // update existing marker
        var existingMarker = markersMap[msgSessionId].marker;
        var existingInfoWindow = markersMap[msgSessionId].infoWindow;
        var existingTimeoutId = markersMap[msgSessionId].timeoutId;

        existingMarker.setPosition(newPosition);
        existingInfoWindow.setContent(msg.text);
        if (msg.text && !markersMap[msgSessionId].disabled) {
            if (existingTimeoutId){
                clearTimeout(existingTimeoutId);
            }
            markersMap[msgSessionId].timeoutId =
                setTimeout(function() { existingInfoWindow.close() }, 10000);
            existingInfoWindow.open(map, existingMarker);
        }
    } else { // new marker
        var infoWindow = new google.maps.InfoWindow({
            content: msg.text,
            maxWidth: 400,
            disableAutoPan: true
        });

        var marker = new google.maps.Marker({
            position: newPosition,
            map: map,
            draggable: false,
            icon: markerImage,
            title: "Click to mute/un-mute User "+msgSessionId
        });

        marker.addListener('click',function() {
            if (markersMap[msgSessionId].disabled) {
                markersMap[msgSessionId].disabled = false;
                marker.setIcon(markerImage);
            } else{
                markersMap[msgSessionId].disabled = true;
                marker.setIcon(disabledMarkerImage);
                infoWindow.close();
            }
        });

        if (msg.text) {
            infoWindow.open(map, marker);
        }

        var timeoutId = setTimeout(function() { infoWindow.close() }, 10000);
        markersMap[msgSessionId] = {
            marker: marker,
            infoWindow: infoWindow,
            timeoutId: timeoutId,
            disabled: false
        }
    }

    if (advanced){
        runAdvancedOptions(msg);
    }
}

function embedTweet(text) {
    var tweetText = "Someone wrote " + text + " on ";
    var tweetUrl = "https:\/\/twitter.com\/share?url=http://idoco.github.io/map-chat&text=" + tweetText;
    var width = 500, height = 300;
    var left = (screen.width / 2) - (width / 2);
    var top = (screen.height / 2) - (height / 2);
    return " <a href=\"" + tweetUrl + "\"" +
        " onclick=\"window.open('" + tweetUrl + "', 'newwindow'," +
        " 'width=" + width + ", height=" + height + ", top=" + top + ", left=" + left + "'); return false;\">" +
        " <image src='images/twitter_icon_small.png'> <\/a> " + text;
}

function clearMessageFromMap(){
    for (var markerSessionId in markersMap) {
        if (markersMap.hasOwnProperty(markerSessionId)) {
            markersMap[markerSessionId].infoWindow.close();
        }
    }
}

function changeZoom(factor){
    map.setZoom(map.getZoom() + factor);
}

function runAdvancedOptions(msg){
    var time = new Date().getTime()
    var diff = time - timeLastMessage
    timeLastMessage = time

    if (msg.sessionId == mySessionId || diff < 60000){
        return;
    }

    if (Notification.permission !== "granted"){
        Notification.requestPermission();
    }

    new Notification('Incoming MapChat', {
        icon: 'favicons/apple-touch-icon-120x120.png',
        body: msg.text ? "Incoming message: "+msg.text : "New user"
    });
}

// This should be displayed when the app is opened from a mobile facebook app WebView (Until a better solution is found)
if (window.navigator.userAgent.indexOf("FBAV") > 0) {
    document.write(
            "<div class=\"center\" style=\"position: fixed; top: 120px; width: 100%;\">" +
                "<div class=\"\">" +
                    "<h6>" +
                        "This page will not work inside the facebook app, " +
                        "please open it in the native browser." +
                    "</h6>" +
                "</div>" +
            "</div>"
    );
}  else {
    google.maps.event.addDomListener(window, 'load', initialize);
}
