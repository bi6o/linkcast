/* Listen for message from the popup */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    
		
	
    if(msg.action == 'get-meta') {

    	var title = document.querySelector("title").innerText;
    	var url = document.location.href;
    	var thumbUrl = '';

    	//youtube
    	if(document.querySelector("[itemprop='thumbnailUrl']")) 
    	{
    		thumbUrl = document.querySelector("[itemprop='thumbnailUrl']").href;
    	}
    	//facebook
    	else if(document.querySelector("meta[property='og:image']"))
    	{
    		thumbUrl = document.querySelector("meta[property='og:image']").content;
    	}
    	// default
    	else if(document.querySelector("link[rel='icon']"))
    	{
    		thumbUrl = document.querySelector("link[rel='icon']").href; 
    	}
    	sendResponse({title:title,url: url, thumbUrl: thumbUrl});
    }

});