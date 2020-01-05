/**
* This file contains all the functions required for this site
*/


/**
* Get the playlist id from the $_GET arguments
*/
function getPlaylistId() {    
    args = location.search.substr(1).split(/&/); // create an array, containing all the GET args
    for (var i=0; i<args.length; ++i) { // loop through the args
        var tmp = args[i].split(/=/); // split the arg into key=>value pair array
        // if the current arg is the 'playlist-url' arg:
        if (tmp[0] == "playlist-url") {
            var playlist_url = decodeURIComponent(tmp[1]); // decode the youtube playlist url (e.g '%3A' into ':')
            playlist_url = playlist_url.split("list="); // split the url into the main url and the playlist id
            return playlist_url[1]; // return the playlist id - in the second element of the array
        }
    }
    return null; // there is no playlist id to return 
}


/**
* Retrieve the requested playlist via the YouTupe Playlists api
* @id - the id of the playlist to retrieve
*/
function retrievePlaylist(key, id, callback) {
    $.get(
        "https://www.googleapis.com/youtube/v3/playlists?key=" + key + 
        "&part=snippet,contentDetails" +
        "&id=" + id, 
        callback
    ); // end of $.get()
} // end of retrievePlaylist()

/**
* Uses the data object returned from retrievePlaylist()
* Extracts the playlist details
*/
function getPlaylistFromData(data)  {
    return data.items[0].snippet;
}

/**
* Retrieve the requested playlist via the YouTupe Playlists api
* @id - the id of the playlist to retrieve
* @nextPageToken - the API retrieves playlistItems in pages, so if there is a nextPageToken
*	then there is another page of playlistItems to retrieve
*/
function retrievePlaylistItems(key, id, callback, nextPageToken = null) {
	var url = "https://www.googleapis.com/youtube/v3/playlistItems?key=" + key +
		"&part=snippet" +
		"&maxResults=50" +
		"&playlistId=" + id;
	
	if (nextPageToken != null) {
		url += "&pageToken=" + nextPageToken;
	}
	$.get(url, callback);
}

/**
* This function returns a PlaylistItem from data that is retrieved
* via the Youtube API
*/
function getPlaylistItemFromData (data) {
	var id = data.snippet.resourceId.videoId;
	var title = data.snippet.title;
	var author = data.snippet.channelTitle;
	var uploaded_date = data.snippet.publishedAt;
	var description = data.snippet.description;
	try {
		var thumbnail = data.snippet.thumbnails.medium.url;
	} catch (err) {
		thumbnail = "http://www.liamthursfield.me/youtube-playlist-details/img/thumb_priv.png";
	}
	var position = data.snippet.position;
	
	item = new PlaylistItem(
		id, title, author, uploaded_date, description, thumbnail, position
	);
	
	return item; 
}

/**
* A Playlist item, is an object that contains the key details 
* of a youtube video in a Youtube Playlist
*/
function PlaylistItem(id, title, author, uploaded_date, description, thumbnail, position, video_length=0) {
	this.id = id;
	this.title = title;
	this.author = author;
	this.uploaded_date = uploaded_date;
	this.description = description;
	this.thumbnail = thumbnail;
	this.position = position;
	this.video_length = 0;
}


/**
* A function that takes a playlist item, and fetches its length via the Youtube API
*/
function retrieveVideoLength(key, playlistItem) {
	var url = "https://www.googleapis.com/youtube/v3/videos?key=" + key +
		"&part=contentDetails" +
		"&id=" + playlistItem.id;
	
	return jQuery.ajax({
		url: url,
		success: function(result) {
			// get the video duration and update the playlistItem
			var video_length = YTDurationToSeconds(result.items[0].contentDetails.duration);
			// console.log(video_length); // log the duration
			playlistItem.video_length = video_length;
			
			// get the html element that dispalays the video length - and show the length
			var lengthElement = document.getElementById(playlistItem.id + "-length");
			if (lengthElement != null) {
				lengthElement.textContent = secToTime(video_length);
			}
			
			var playlistLengthElement = document.getElementById("playlist-length");
			var playlistLengthElementMilisecs = document.getElementById("playlist-length-ms");
			
			//console.log("MS: " + playlistLengthElementMilisecs.innerHTML + "len: " + video_length);
			
			playlistLengthElementMilisecs.innerHTML = 
				
				parseInt(playlistLengthElementMilisecs.innerHTML) + video_length;
			playlistLengthElement.innerHTML = secToTime(playlistLengthElementMilisecs.innerHTML);
		}
	});
	
}

/**
* A PlaylistItemView, is an object that contains the html to show a PlayListItem
* @playlistItem - the playlist item to show
*/
function PlayListItemView(playlistItem) {
	this.playlistItem = playlistItem;
	this.id = playlistItem.id;
	this.title = playlistItem.title;
	this.author = playlistItem.author;
	this.uploaded_date = playlistItem.uploaded_date;
	this.description = playlistItem.description;
	this.thumbnail = playlistItem.thumbnail;
	this.position = playlistItem.position;
	this.video_length = playlistItem.video_length;
	
	
	PlayListItemView.prototype.toString = function() {
		var html_view = "";
		// add opening card div, with the grid position
		html_view += "<div id='" + this.id + "' class='video-item card' >";
		
		// add thumbnail & video length
		html_view += "<div class='thumbnail'><img src='" + this.thumbnail + "' alt='Video Thumbnail'/>" + 
			"<p class='video-length'><span id='" + this.id + "-length'>" + this.video_length + "</span></p>"
			+ "</div>";
		
		// add opening content div
		html_view += "<div class='content'>";
		
		// add video title
		html_view += "<h3 class='video-title'>" + this.title + "</h3>";
		
		// add author and uploaded date
		html_view += "<p><span class='uploaded-author'>" + this.author + "</span> " +
			"<span class='uploaded-date'>" + formatDate(new Date(this.uploaded_date)) + "</span></p>";
		
		// if the description is > 100 chars, shorten it and add "..."
		var shortDescription = "";
		if (this.description.length > 100) {
			shortDescription = this.description.substr(0, 100) + "...";
		}
		// add description
		html_view += "<p class='description'>" + shortDescription + "</p>";
		
		// add closing content div
		html_view += "</div>"
		
		// add closing card div
		html_view += "</div>"
		
		return html_view;
	}
}



/**
* Return the Month Text for a month integer
* E.g. return January for 0; December for 11
*/
function getFullMonth(monthInt) {
	var months = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	
	return months[monthInt];
}

/**
* Return the 3 part string of the Month Text for a month integer
* E.g. return Jan for 0; Dec for 11
*/
function getShortMonth(monthInt) {
	return getFullMonth(monthInt).substr(0, 3);
}

/**
* Return the date in the format: DD MM YYYY
* e. 21 January 2017
*/
function formatDate(dateToFormat) {
	var day = dateToFormat.getDate();
	var month = getShortMonth(dateToFormat.getMonth());
	var year = dateToFormat.getFullYear();
	
	return day + " " + month + " " + year;
}

// FOUND ON STACKOVERFLOW: https://stackoverflow.com/questions/22148885/converting-youtube-data-api-v3-video-duration-format-to-seconds-in-javascript-no
// Used to take a Youtube Duration and return the duration in seconds
function YTDurationToSeconds(duration) {
  var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  var hours = (parseInt(match[1]) || 0);
  var minutes = (parseInt(match[2]) || 0);
  var seconds = (parseInt(match[3]) || 0);

  return hours * 3600 + minutes * 60 + seconds;
}


/*
* modified from stackoverflow: https://stackoverflow.com/questions/19700283/how-to-convert-time-milliseconds-to-hours-min-sec-format-in-javascript
* Format a time, in milliseconds to:
* HH:MM:SS - where HH is optional, and won't appear if time < 60 minutes
*/
function secToTime(duration) {
	var milliseconds = parseInt((duration)/100)
		, seconds = parseInt((duration)%60)
		, minutes = parseInt((duration/60)%60)
		, hours = parseInt((duration/(60*60)%24))
		, days = parseInt(Math.floor(duration / (3600*24)));

	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;
	
	var formattedTime = "";
	if (parseInt(days) != 0) {
		formattedTime += days + "d ";
		formattedTime += hours + "h ";
	} else if (parseInt(hours) != 0) {
		formattedTime += hours + "h ";
	}
	
	formattedTime += minutes + "m " + seconds + "s";

	return formattedTime;
}


/**
* Back to top button functions
*/
// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("backToTopBtn").style.display = "block";
    } else {
        document.getElementById("backToTopBtn").style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0; // For Chrome, Safari and Opera 
    document.documentElement.scrollTop = 0; // For IE and Firefox
}




/**
* Save a text object to a file, and download it
* E.g a JSON.stringify() object
*
* Debug method to show the JSON contents
*/
function saveText(text, filename){
	var a = document.createElement('a');
	a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(text));
	a.setAttribute('download', filename);
	a.click()
}