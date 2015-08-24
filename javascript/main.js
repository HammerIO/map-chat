
// Support dynamic topic registration by #word
var urlHashTopic = location.hash ? location.hash.substring(1).toLowerCase() : null;
var topic = urlHashTopic ? urlHashTopic : "main";

var db = createHammer()
var appId = "ic02umfO"

var log_el = document.getElementById("log")
var log_wrapper = document.getElementById("log-wrapper")

var last_uid_seen = ""
var last_update = new Date().getTime()
var last_update_old = false

function initialiseEventBus(){
    mySessionId = uid()    
    subscribe(topic)
    setupWatchPosition()    
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

function log(msg) {
    if(msg.lat) {
      log_el.innerHTML += "<i>" + (msg.loc || "Unkown location") + "</i>: " + (msg.text || "joined") + "<br/>"
    } else {
      log_el.innerHTML += "<i>" + msg + "</i><br/>"
    }
    
    log_wrapper.scrollTop = log_wrapper.scrollHeight
    last_update = new Date().getTime()
    last_update_old = false
}

function checkLog() {
    if(last_update_old)
      return
      
    var now = new Date().getTime()
    if((now - last_update) > 60000) {
        log("Idle (1 min) - " + new Date())
        log_wrapper.scrollTop = log_wrapper.scrollHeight
        last_update_old = true
    }
}

setInterval(checkLog,5000)

function subscribe(address) {
    var key_filter = appId+"."+address+"."

    // Initial query to find 10th last message
    db.query(key_filter,true,20).then(function(resp){
        if(resp.result)
          last_uid_seen = resp.result.key.substring(key_filter.length)
        
        var sessions = {}
        
        for(var i = resp.results.length-1; i >= 0; i--) {
          var res = resp.results[i]          
          var msg = JSON.parse(res.value)
          
          sessions[msg.sessionId] = msg
          log(msg)
        }
        
        for(var sid in sessions) {
          displayMessageOnMap(sessions[sid])
        }        
        
        console.log("last seen: " + last_uid_seen)
        log("Last message - " + new Date(uidToTime(last_uid_seen)))
          
        // Live query that tracks new messages
        db.live(function(db){
            db.query(key_filter,last_uid_seen,20,1).then(function(resp){                
                for(var i = 0; i < resp.results.length; i++) {
                  var res = resp.results[i]
                  last_uid_seen = res.key.substring(key_filter.length)
                  var msg = JSON.parse(res.value)
                  displayMessageOnMap(msg)
                  log(msg)
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
