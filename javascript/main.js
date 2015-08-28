
// Support dynamic topic registration by #word
var urlHashTopic = location.hash ? location.hash.substring(1).toLowerCase() : null;
var topic = urlHashTopic ? urlHashTopic : "world";

var db = createHammer()
var appId = "ddVj83gH"

var content_el = document.getElementById("content")
var content_wrapper = document.getElementById("content-wrapper")

var content_sel_new = false
var content_sel_help = false

var nick = localStorage["mapchat_nick"]
var nick_color = localStorage["mapchat_nick_color"]
if(!nick) {
  nick = (Math.floor(Math.random()*100)).toString()
  localStorage["mapchat_nick"] = nick
}

if(!nick_color) {
  nick_color = "purple"
  localStorage["mapchat_nick_color"] = nick_color
}

var channels = []
var active_channel_index = 0

var log_last_selected = 0
var log_last_length = 0

initChannels()
updateButtonState()

function initChannels() {
    var hindex = window.location.href.indexOf('#') 
    
    if(hindex == -1) {
        channelOpen("world",true)
        return
    }
    
    console.log(window.location.href.substring(hindex))
    
    var chx = window.location.href.substring(hindex).split(',')
    for(var i = 0; i < chx.length; i++) {
        console.log("open: " + chx[i])
        channelOpen(chx[i],true)
    }
}

function getActiveChannel() {
    if(active_channel_index < 0)
        return undefined
      
    return channels[active_channel_index]
}

function updateButtonState() {
    var selected = active_channel_index  
    
    if(channels.length == 0 && !content_sel_new && !content_sel_help) {
        topicClick('adm')
        return
    }
    
    if(content_sel_new) {
        selected = "adm"
    }
    else if(content_sel_help) {
        selected = "help"
    }
    
    var url_builder = []
    
    var html = '<div id="topic_button_adm" class="topic-button '+(selected == 'adm' ? 'selected':'')+'" onclick="topicClick(\'adm\')"> new</div>'
    html += '<div id="topic_button_help" class="topic-button '+(selected == 'help' ? 'selected':'')+'" onclick="topicClick(\'help\')"> help</div>'

    for(var i = 0; i < channels.length; i++) {
        html += '<div id="topic_button_'+i+'" class="topic-button '+(selected == i ? 'selected':'')+' '+(isAlarm(i) ? 'alarm':'')+' " onclick="topicClick(\''+i+'\')">#'+channels[i].name+'</div>'
        url_builder.push(channels[i].tags.join("&"))
    }
    
    var hindex = window.location.href.indexOf('#') 
    if(hindex == -1)
      hindex = window.location.href.length
      
    var new_href = window.location.href.substring(0,hindex) + "#" + url_builder.join(",")
    if(window.location.href != new_href)
      window.location.href = new_href
    
    var container = document.getElementById("topic-wrapper")
    container.innerHTML = html  
}

function topicClick(id) {  
  console.log("topicClick: " + id)

  if(id == 'adm') {
      content_sel_new = true
      content_sel_help = false
      
      function clink(tags,last) {
        return "<a href='javascript:;' onclick='channelOpen(\""+tags+"\")'>"+tags+"</a>" + (last?"":" - ")
        
      }
      
      //"<img src='ch_desc.png' style='width:95%;'>"+
      content_el.innerHTML = "<div><b>Open a new channel</b></div>"+
          "<p>Enter channel tags below to start interacting with people using the same tags.</p>"+
          "<p>A channel with multiple tags, like #world and #english, will ONLY listen for messages posted with tags #world and #english. Any message posted from this channel will be visible to people listening to any permutation of the tags, i.e #world, #english, or #world&english.</p>"+
          "<p>Channel examples:<br/>"+
          clink('#world') + clink('#world&english') + clink('#world&party') + clink('#europe') + clink('#us') + clink('#asia') + clink('#programming') + clink('#programming&scala')  + clink('#feedback',true) + "</p>"+
          "<div><input id='channel_open_input' onkeyup='channelOpenChange(event);' style='width:100%;margin:0px;padding:0px;' type='text' placeholder='tag1 tag2 tag3' />"+
          "<button onclick='channelOpenClick();' style='float:right;margin-top:5px;'>Open (Enter)</button></div>"
          
          //"<img src='ch_desc.png' style='width:40%; float:right; margin-right:10px;'>"+
          //"<p>Any direct replies in #world or #english will not be visible to the poster in #world&english, you must join the cross-channel first.</p>"+      
          
          
      content_wrapper.scrollTop = content_wrapper.scrollHeight
  } 
  
  else if(id == 'help') {
      content_sel_new = false
      content_sel_help = true
      
      //"<li><b>/joinsub <tag> </b>- Joins a channel with specified tag in addition to current tags</li>"+
      
      content_el.innerHTML = "<div><b>MapChat commands</b></div>"+
          "<p>You can write commands directly into the chat-bar. Following commands are supported:</p>"+
          "<ul>"+
          "<li><b>/nick &lt;nick&gt; </b>- Set nickname to display</li>"+
          "<li><b>/color &lt;color-name&gt; </b>- Set color to use</li>"+
          "<li><b>/join &lt;tag&gt; </b>- Join a channel with specified tags</li>"+
          "<li><b>/topic &lt;title&gt; </b>- Join a channel topic.</li>"+
          "<li><b>/close </b>- Close current channel</li>"+
          "<li><b>/clear </b>- Clear all map annotations</li>"+
          
          "</ul>"+
          "<div><b>FAQ</b></div>"+
          "<p><i>Q: What is the \"uname@location - &lt;something&gt\" I see in my logs?</i> &lt;something&gt indicates that the message is written from a cross-channel. Click on &lt;something&gt; to join the conversation</p>"
        

      content_wrapper.scrollTop = content_wrapper.scrollHeight
  }
  
  else {
      content_sel_new = false
      content_sel_help = false
      active_channel_index = parseInt(id)
      getActiveChannel().last_update = 0
      getActiveChannel().last_log_old_set = false
  }
  
  updateButtonState()
  focusInput()
}

function channelOpen(tags,silent) {
    tags = tags.toLowerCase().replace(/#/g,"").replace(/[&,|]/g," ").replace(/\s+/g," ").trim().split(" ")
    for(var i = 0; i < channels.length; i++) {
      var ch = channels[i]
      if(ch.tags.join(" ") == tags.join(" ")) {
        topicClick(i)
        return
      }
    }
    
    var ch = _channelOpen(tags).start()
    channels.push(ch)
    active_channel_index = channels.length - 1
    if(!silent)
      topicClick(active_channel_index)
}

function channelOpenClick() {  
    var tags = document.getElementById("channel_open_input").value
    channelOpen(tags)
}

function channelCloseClick() {
    var chi = active_channel_index
    getActiveChannel().close()
    channels.splice(chi,1)
    if(active_channel_index >= channels.length) {
        active_channel_index = channels.length - 1
    }
    updateButtonState()
}

function channelOpenChange(e) {
    if(e.which == 13)
        channelOpenClick()
}

function updateLog() {
    if(content_sel_new || content_sel_help) {
        log_last_length = 0
        return
    }

    var ch = getActiveChannel()
    if(!ch)
        return
      
    var logs = ch.logs
    
    if(log_last_selected == active_channel_index && log_last_length == logs.length)
        return
    
    log_last_selected = active_channel_index
    log_last_length = logs.length
    
    if(logs.length > 200) {
        var newlog = []
        for(var i = logs.length - 100; i < logs.length; i++) {
            newlog.push(logs[i])
        }
        ch.logs = newlog
    }
    
    content_el.innerHTML = "<br/>" + logs.join("<br/>") + "<div style='position:absolute; top:0px; width:75%; text-align:center; font-size:90%; padding:2px; cursor: pointer; background:rgba(33,150,243,0.9); color:white;' onclick='channelCloseClick()'>Close</div>"
    content_wrapper.scrollTop = content_wrapper.scrollHeight
}

setInterval(updateLog,50)

function isAlarm(chi) {
    var ch = channels[chi]
    if((active_channel_index != chi || content_sel_new || content_sel_help || ch.last_log_old_set) && ch.last_update) {
        return true
    } else {
        ch.last_update = 0
    }
}

function checkAlerts() {
    updateButtonState()
}

setInterval(checkAlerts,1000)


function _channelOpen(htags) {
    if(!htags)
      htags = ["world"]
      
    htags = htags.sort()

    var ob = {
      last_uid_seen: "",
      last_log: new Date().getTime(),
      last_log_self: false,
      last_log_old: false,
      last_log_old_set: false,
      last_update: 0,
      logs: [],
      name: htags.join(" &"),
      tags: htags,
      liveq: undefined
    }    

    ob.address = function() {        
      var res = ""
      for(var i = 0; i < htags.length && i < 3; i++) {
        res += htags[i] + "|"
      }
      
      return res.substring(0,res.length-1)
    }
    
    ob.publish = function(input) {
        ob.last_log_old_set = false
        var json = createMessage(input);
        json.tags = ob.tags
        json.nick = nick
        json.nick_color = nick_color
        
        db.getUID().then(function(resp){
            var args = []
            for(var i = 0; i < htags.length; i++) {
                var itag = htags[i]
                args.push(appId+","+itag+","+resp.result)
                
                for(var j = i+1; j < htags.length; j++) {
                    var jtag = htags[j]
                    args.push(appId+","+itag+"|"+jtag+","+resp.result)
                    
                    for(var k = j+1; k < htags.length; k++) {
                        var ktag = htags[k]
                        args.push(appId+","+itag+"|"+jtag+"|"+ktag+","+resp.result)
                    }
                }
            }
            
            args.push(JSON.stringify(json))
            db.insert.apply(db,args)
        })
    }
    
    ob.isPure = function(msg) {
        var same_ch = true
        if(msg.lat) {
            if(msg.tags.length == ob.tags.length) {
                for(var i = 0; i < msg.tags.length; i++) {
                    var mtag = msg.tags[i]
                    var ctag = ob.tags[i]
                    if(mtag !== ctag) {
                        same_ch = false
                        break
                    }
                }
            } else {
                same_ch = false
            }
        }
        
        return same_ch
    }
    
    function fixLoc(loc) {
      if(!loc)
        return "unknown.loc"
      
      return loc.replace(/ \(/,".").replace(/\)/,"").toLowerCase()
    }
    
    ob.log = function (msg) {
        if(msg.lat) {
            var same_ch = ob.isPure(msg)
            ob.logs.push("<i style='font-size:80%;'>" + (msg.nick?(msg.nick + "@") : "") + fixLoc(msg.loc) + (same_ch?"":(" <a href='javascript:;' onclick='channelOpen(\""+msg.tags.join("&")+"\")'>#" + msg.tags.join("&")+'</a>')) + ":</i> " + (same_ch?("<span style='color:"+(msg.nick_color || "purple")+";'>"+(msg.text || "joined")+"</span>"):("<span style='color:grey'>"+(msg.text || "joined")+"</span>")))
        } else {
            ob.logs.push("<i style='font-size:80%;'>" + msg + "</i>")
        }
        
        ob.last_log = new Date().getTime()
        ob.last_log_old = false
    }

    ob.checkLog = function() {
        if(ob.last_log_old)
          return
          
        var now = new Date().getTime()
        if((now - ob.last_log) > 60000) {
            ob.log("Idle channel (1 min) - " + new Date())
            ob.last_log_old = true
            ob.last_log_old_set = true
        }
    }

    var idle_timer = setInterval(function(){
        ob.checkLog()
    },5000)

    
    ob.start = function() {
        var key_filter = appId+","+ob.address() + ","
        var first = true
        
        // Chat log handler
        function handleResp(resp) {
            var sessions = {}                
            var found_last_end = false
            
            for(var i = resp.results.length-1; i >= 0; i--) {
                var res = resp.results[i]          
                
                if(res.key.substring(key_filter.length) <= ob.last_uid_seen) {
                    found_last_end = true
                    continue;
                }
                
                var msg = JSON.parse(res.value)
                sanitizeMsg(msg)
                
                if(!(markersMap[msg.sessionId] || {disabled:false}).disabled) {
                    sessions[msg.sessionId] = msg
                    ob.log(msg)
                    
                    if(ob.last_log_old_set && msg.sessionId == mySessionId) {
                        ob.last_log_old_set = false
                    }                
                    
                    if(!first && ob.isPure(msg)) {
                        ob.last_update = new Date().getTime()
                    }
                }
            }
            
            if(ob.last_uid_seen != "" && !found_last_end) {
                ob.log("Missed some updates..")
            }
            
            for(var sid in sessions) {
                displayMessageOnMap(sessions[sid])
            }
            
            if(resp.result) {
                ob.last_uid_seen = resp.result.key.substring(key_filter.length)
            }
            
            first = false
        }
        
        // Snapshot query: Fetch some history 
        db.query(key_filter,"",true,50).then(function(resp){                
            handleResp(resp)
            
            // Live query: Track head
            db.live(function(db){            
                db.query(key_filter,"",true,5).then(function(resp){                
                    handleResp(resp)
                })        
            })
        })
        
        return this
    }
    
    ob.close = function() {
        clearInterval(idle_timer)
        if(ob.liveq) {
            ob.liveq.stop()
        }
    }
    
    return ob;
}


function initialiseEventBus(){
    mySessionId = uid()
    var ch = getActiveChannel()
    ch.start(topic)
    setupWatchPosition()    
}

function chatBarMessage(input) {
  if (input && input.val()) {
      var msg = input.val()
  
      if(msg.startsWith("/join")) {
          channelOpen(msg.substring("/join".length))
      }
      else if(msg.startsWith("/topic")) {
          channelOpen(getActiveChannel().tags + " " + msg.substring("/topic".length).trim().replace(/\s+/g,"_"))
      }
      else if(msg.startsWith("/close")) {
          channelCloseClick()
      }
      else if(msg.startsWith("/leave")) {
          channelCloseClick()
      }
      else if(msg.startsWith("/clear")) {
          clearMessageFromMap()
      }
      else if(msg.startsWith("/nick")) {
          nick = msg.substring("/nick".length).trim()
          localStorage["mapchat_nick"] = nick
      }
      else if(msg.startsWith("/color")) {
          nick_color = msg.substring("/color".length).trim()
          localStorage["mapchat_nick_color"] = nick_color
      }
  
      else {
          getActiveChannel().publish(msg);
      }
      
      input.val('');
  }
}


$( document ).ready(function() {
    if(!Modernizr.websockets || !Modernizr.geolocation){
        Materialize.toast('Browser not supported :(', 10000);
    }
    
    var prevX = 0
    var startY =0 
    var isDragging = false
    var container = document.getElementById("topic_and_content")
    
    $("#topic_and_content_resize").mousedown(function(e){
      isDragging = true
      prevX = e.pageX
      prevY = e.pageY
    }).mousemove(function(e){
      if(isDragging) {
        var dx = -((e.pageX - prevX) / window.innerWidth)
        var dy = (e.pageY - prevY) / window.innerHeight
        prevX = e.pageX
        prevY = e.pageY
        
        // Uses %, want to keep ratio the same when moving to different screens
        if(!container.style.width)
          container.style.width = "30%"
        if(!container.style.height)
          container.style.height = "70%"
        
        var curx = parseFloat(container.style.width.replace(/%/,""))
        var cury = parseFloat(container.style.height.replace(/%/,""))
        
        container.style.width = (curx + (dx*100)) + "%"
        container.style.height = (cury + (dy*100)) + "%"
      }
    }).mouseup(function(){
      isDragging = false
    })

    $("#side-nav-button").sideNav();
    
    var hist = []
    var hist_index = -1

    var input = $("#input");
    input.keyup(function (e) {
        if (e.keyCode == 13) { // enter
            if(input.val().trim() != "") {
                hist.push(input.val())
                
                if(hist.length > 100) {
                  hist = hist.splice(0,50)
                }
                
                hist_index = hist.length
                chatBarMessage(input);
            }
        }
        else if (e.keyCode == 38) { // up
          hist_index --
          
          if(hist_index < 0)
              hist_index = 0
          
          if(hist.length > hist_index)
            input.val(hist[hist_index])
        }
        else if (e.keyCode == 40) { // down
          hist_index ++
          
          if(hist_index >= hist.length)
              hist_index = hist.length
          
          if(hist.length > hist_index)
            input.val(hist[hist_index])
          else
            input.val("")
        }
    });
    input.focus();
    
    // Global fn for refocusing on input
    window.focusInput = function() {
      input.focus();
    }

    $("#send-button").click(function(){
        chatBarMessage(input);
    });

    $("#notification_lever").change(function() {
        advanced = !advanced;
        if(advanced && Notification.permission !== "granted") {
          Notification.requestPermission();
        }
        Materialize.toast(advanced ? 'Notifications On' : 'Notifications Off', 3000);
    });

    $("#accurate_location_lever").change(function() {
        shareAccurateLocation = !shareAccurateLocation;
        Materialize.toast(shareAccurateLocation ? 'Sharing Your Accurate Location' : 'Sharing Your Fuzzy Location', 3000);
    });
});
