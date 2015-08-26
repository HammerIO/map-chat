
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
if(!nick) {
  nick = (Math.floor(Math.random()*100)).toString()
  localStorage["mapchat_nick"] = nick
}

var channels = []
var active_channel_index = 0

var log_last_selected = 0
var log_last_length = 0

var _ch = _channelOpen(["world"])
channels.push(_ch)

updateButtonState()

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
    
    var html = '<div id="topic_button_adm" class="topic-button '+(selected == 'adm' ? 'selected':'')+'" onclick="topicClick(\'adm\')"> new</div>'
    html += '<div id="topic_button_help" class="topic-button '+(selected == 'help' ? 'selected':'')+'" onclick="topicClick(\'help\')"> help</div>'

    for(var i = 0; i < channels.length; i++) {
        html += '<div id="topic_button_'+i+'" class="topic-button '+(selected == i ? 'selected':'')+' '+(isAlarm(i) ? 'alarm':'')+' " onclick="topicClick(\''+i+'\')">#'+channels[i].name+'</div>'
    }
    
    var container = document.getElementById("topic-wrapper")
    container.innerHTML = html  
}

function topicClick(id) {  
  console.log("topicClick: " + id)

  if(id == 'adm') {
      content_sel_new = true
      content_sel_help = false
      
      //"<img src='ch_desc.png' style='width:95%;'>"+
      content_el.innerHTML = "<div><b>Open a new channel</b></div>"+
          "<p>Enter channel tags below to start interacting with people using the same tags.</p>"+
          "<p>A channel with multiple tags, like #world and #english, will ONLY listen for messages posted with tags #world and #english. Any message posted from this channel will be visible to people listening to any permutation of the tags, i.e #world, #english, or #world&english.</p>"+
          
          "<img src='ch_desc.png' style='width:40%; float:right; margin-right:10px;'>"+
          "<p>Note that any direct replies in #world or #english will not be visible to the poster on #world&english, you must join the cross-channel first.</p>"+      
          "<div><input id='channel_open_input' onkeyup='channelOpenChange(event);' style='width:100%;margin:0px;padding:0px;' type='text' placeholder='tag1 tag2 tag3' />"+
          "<button onclick='channelOpenClick();' style='float:right;margin-top:5px;'>Open (Enter)</button></div>"
      content_wrapper.scrollTop = content_wrapper.scrollHeight
  } 
  
  else if(id == 'help') {
      content_sel_new = false
      content_sel_help = true
      
      //"<li><b>/joinsub <tag> </b>- Joins a channel with specified tag in addition to current tags</li>"+
      
      content_el.innerHTML = "<div><b>MapChat commands</b></div>"+
          "<p>You can write commands directly into the chat-bar. Following commands are supported:</p>"+
          "<ul>"+
          "<li><b>/nick &lt;nick&gt; </b>- Sets nickname to display</li>"+
          "<li><b>/join &lt;tag&gt; </b>- Joins a channel with specified tags</li>"+                
          "<li><b>/close </b>- Closes current channel</li>"+
          "<li><b>/clear </b>- Clears all map annotations</li>"+
          
          "</ul>"+
          "<div><b>FAQ</b></div>"+
          "<p><i>Q: What is the \"Location - &lt;something&gt\" I see in my logs?</i> &lt;something&gt indicates that the message is written from a cross-channel. Type /join &lt;something&gt; in the chat bar to focus in on the conversation</p>"
        

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

function channelOpen(tags) {
    tags = tags.toLowerCase().replace(/#/g,"").replace(/[&,|]/g," ").replace(/\s+/g," ").trim()  
    var ch = _channelOpen(tags.split(" ")).start()
    channels.push(ch)
    active_channel_index = channels.length - 1
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
    
    if(logs.length > 1000) {
        var newlog = []
        for(var i = logs.length - 100; i < logs.length; i++) {
            newlog.push(logs[i])
        }
        ch.logs = newlog
    }
    
    //content_el.innerHTML = "<br/>" + logs.join("<br/>") + "<div style='position:absolute; top:5px; width:75%; text-align:center; font-size:90%; padding:2px; cursor: pointer; background:rgba(244,67,54,0.8);' onclick='channelCloseClick()'>Close</div>"
    content_el.innerHTML = "<br/>" + logs.join("<br/>") + "<div style='position:absolute; top:0px; width:75%; text-align:center; font-size:90%; padding:2px; cursor: pointer; background:rgba(33,150,243,0.9); color:white;' onclick='channelCloseClick()'>Close</div>"
    content_wrapper.scrollTop = content_wrapper.scrollHeight
}

setInterval(updateLog,50)

function isAlarm(chi) {
    var ch = channels[chi]
    if((active_channel_index != chi || ch.last_log_old_set || content_sel_new || content_sel_help) && ch.last_update) {
        return true
    } else {
        ch.last_update = 0
    }
}

function checkAlerts() {
    updateButtonState()
}

setInterval(checkAlerts,1000)


// Copied from http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
function linkify(inputText) {
    var intext = inputText.toString()
    var replacedText, replacePattern1, replacePattern2, replacePattern3;
    
    //Channels starting with #
    replacePattern1 = /(#(\S)+)/gim;
    replacedText = intext.replace(replacePattern1, '<a href="javascript:;" onclick="channelOpen(\'$1\');">$1</a>');

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = replacedText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function _channelOpen(htags) {
    if(!htags)
      htags = ["world"]
      
    htags = htags.sort()

    var ob = {
      last_uid_seen: "",
      last_log: new Date().getTime(),
      last_log_old: false,
      last_log_old_set: false,
      last_update: new Date().getTime(),
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
    
    ob.log = function (msg) {
        if(msg.lat) {
            var same_ch = ob.isPure(msg)
            ob.logs.push("<i style='font-size:80%;'>" + (msg.nick?(msg.nick + "@") : "") + (msg.loc || "Unkown location") + (same_ch?"":(" <a href='javascript:;' onclick='channelOpen(\""+msg.tags.join("&")+"\")'>#" + msg.tags.join("&")+'</a>')) + ":</i> " + (same_ch?("<span style='color:purple'>"+linkify(msg.text || "joined")+"</span>"):("<span style='color:grey'>"+linkify(msg.text || "joined")+"</span>")))
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

        // Initial query to find 10th last message
        db.query(key_filter,true,20).then(function(resp){
            if(resp.result)
                ob.last_uid_seen = resp.result.key.substring(key_filter.length)
            
            var sessions = {}
            
            for(var i = resp.results.length-1; i >= 0; i--) {
                var res = resp.results[i]          
                var msg = JSON.parse(res.value)
                
                sessions[msg.sessionId] = msg
                ob.log(msg)
            }
            
            for(var sid in sessions) {
                displayMessageOnMap(sessions[sid])
            }        
            
            ob.log("Last message - " + new Date(uidToTime(ob.last_uid_seen)))
              
            // Live query that tracks new messages
            ob.liveq = db.live(function(db){
                console.log("liveq update: " + ob.last_uid_seen)
                db.query(key_filter,ob.last_uid_seen,20,(ob.last_uid_seen.trim() == "") ? 0 : 1).then(function(resp){                
                    for(var i = 0; i < resp.results.length; i++) {
                        var res = resp.results[i]
                        ob.last_uid_seen = res.key.substring(key_filter.length)
                        var msg = JSON.parse(res.value)
                        ob.log(msg)
                        displayMessageOnMap(msg)
                        if(ob.isPure(msg)) {
                            ob.last_update = new Date().getTime()
                        }
                    }
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
  
      if(msg.startsWith("/joinsub")) {
          channelOpen(getActiveChannel().tags + " " + msg.substring("/joinsub".length))
      }
      else if(msg.startsWith("/join")) {
          channelOpen(msg.substring("/join".length))
      }
      else if(msg.startsWith("/close")) {
          channelCloseClick()
      }
      else if(msg.startsWith("/clear")) {
          clearMessageFromMap()
      }
      else if(msg.startsWith("/nick")) {
          nick = msg.substring("/nick".length).trim()
          localStorage["mapchat_nick"] = nick
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

    $("#side-nav-button").sideNav();

    var input = $("#input");
    input.keyup(function (e) {
        if (e.keyCode == 13) {
            chatBarMessage(input);
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
        Materialize.toast(advanced ? 'Notifications On' : 'Notifications Off', 3000);
    });

    $("#accurate_location_lever").change(function() {
        shareAccurateLocation = !shareAccurateLocation;
        Materialize.toast(shareAccurateLocation ? 'Sharing Your Accurate Location' : 'Sharing Your Fuzzy Location', 3000);
    });
});
