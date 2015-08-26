# MapChat with HammerDB
A super simple location based chat, forked from [idoco](https://github.com/idoco/map-chat) and modified to use [HammerDB](http://hammerio.com).

## Changes
- August 26, 2015 - Added support for channels.
- August 24, 2015 - Added basic history. Last 10 conversations are loaded at start.

![](https://raw.githubusercontent.com/idoco/map-chat/master/map-chat.png)

## Features
- Super simple location based chat.
- No registration or message history.
- Create a private chat map by adding <i>#name</i> to the url.

## Embed MapChat in your website
 - Simply add this `iframe` to your website:
```html
<iframe id="mapchat" type="text/html" width="640" height="480"
  src="http://hammerio.github.io/map-chat/#myTopic"
  frameborder="0"></iframe>
```
- The minimum recommended size it 640x480.
- It is recommended to embed private map chats by using a unique #topic.
- [See example.](http://idoco.svbtle.com/embed-mapchat-in-your-website)

## Contributing to MapChat
- Use GitHub Issues to report bugs and suggest new features. 
- Please search the existing issues for your bug and create a new one only if the issue is not yet tracked!
- Feel free to fork this project and suggest new features as pull requests.

## [Demo](http://hammerio.github.io/map-chat)
This demo is hosted on GitHub pages and uses HammerDB for communication.
