
// Support dynamic topic registration by #word
var urlHashTopic = location.hash ? location.hash.substring(1).toLowerCase() : null;
var topic = urlHashTopic ? urlHashTopic : "main";

var db = createHammer()
var appId = "ic02umfO"

function initialiseEventBus(){
    mySessionId = uid()    
    subscribe(topic)
    setupWatchPosition()
    publish(topic,"")
}

function sendMessage(topic, input) {
    if (input.val()) {
        publish(topic, input.val());
        input.val('');
    }
}

function publish(address, message) {
    var json = createMessage(message);
    db.getUID().then(function(resp){
      db.insert(appId+"."+address+"."+resp.result, JSON.stringify(json))
    })
    
}

var last_uid_seen = ""
function subscribe(address) {
    var key_filter = appId+"."+address+"."

    // Initial query to find 10th last message
    db.query(key_filter,true,50).then(function(resp){
        if(resp.result)
          last_uid_seen = resp.result.key.substring(key_filter.length)
        
        var sessions = {}
        
        for(var i = resp.results.length-1; i >= 0; i--) {
          var res = resp.results[i]
          last_uid_seen = res.key.substring(key_filter.length)
          var msg = JSON.parse(res.value)
          var first = sessions[msg.sessionId]
          if(!first) {
            sessions[msg.sessionId] = msg
          } else if(msg.text.trim() != "") {
            if(first.text.trim() != "")
              first.text += "_br_"+msg.text
            else
              first.text = msg.text
          }
        }
        
        for(var sid in sessions) {
          displayMessageOnMap(sessions[sid])
        }
          
        // Live query that tracks new messages
        db.live(function(db){
            db.query(key_filter,last_uid_seen,20,1).then(function(resp){      
                for(var i = 0; i < resp.results.length; i++) {
                  var res = resp.results[i]
                  last_uid_seen = res.key.substring(key_filter.length)
                  displayMessageOnMap(JSON.parse(res.value))
                }
            })
        })    
    })    
}

$( document ).ready(function() {
    if(!Modernizr.websockets || !Modernizr.geolocation){
        Materialize.toast('Browser not supported :(', 10000);
    }

    $("#side-nav-button").sideNav();

    var input = $("#input");
    input.keyup(function (e) {
        if (e.keyCode == 13) {
            sendMessage(topic, input);
        }
    });
    input.focus();

    $("#send-button").click(function(){
        sendMessage(topic, input);
    });

    $("#notification_lever").change(function() {
        advanced = !advanced;
        Materialize.toast(advanced ? 'Notifications On' : 'Notifications Off', 3000);
    });

    $("#accurate_location_lever").change(function() {
        shareAccurateLocation = !shareAccurateLocation;
        Materialize.toast(shareAccurateLocation ? 'Sharing Your Accurate Location' : 'Sharing Your Fuzzy Location', 3000);
    });

    if (topic != "main"){
        Materialize.toast("Private chat map - "+topic, 5000);
    }

    Materialize.toast("New: Click a user dot to mute it!", 7000);
});
