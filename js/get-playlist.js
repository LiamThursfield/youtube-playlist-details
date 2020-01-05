// TODO: REMOVE THIS VAR
var DEBUG = false;

var api_key = getApiKey();
var playlist_id = getPlaylistId();

var playlistItems = [];
var playListItemViews = [];

// the video grid
var video_grid = document.getElementsByClassName("video-grid")[0];

var debug_count = 0;

// whilst debugging: provide a playlist id
if (DEBUG) {
	playlist_id = "PL3XZNMGhpynMp4Q9oiLhffheHJtYhP2bp"; // 241 videos
	playlist_id = "PLu1nstonJHbQGN0kQJ-UFrMDc9fwMpeIS"; // 907 videos
	playlist_id = "PLE7E8B7F4856C9B19"; // 95 videos
}

// if there is no playlist url:
if (!playlist_id) {
    alert("No URL was entered. Returning to the home page.");
    window.location.href = 'index.html';
}

// retrieve the playlist and show its details
retrievePlaylist(api_key, playlist_id, showPlaylistInfo);

/**
* Show the playlist details
*/
function showPlaylistInfo(data) {
	// if there is no playlist with the provided id - alert the user via an alert card
	if (data.pageInfo.totalResults == 0) {
		document.getElementsByClassName("main")[0].innerHTML = 
			"<div class='error-box'><h2>Invalid Playlist</h2><p>Please try again.</p>" +
			"<a href='index.html'><i class='fa fa-arrow-left' aria-hidden='true'></i> Go Back</a></div>";
	}
	
	// get the number of videos in the playlist, and update the details + loading card
	var numVideos = data.items[0].contentDetails.itemCount;
	document.getElementById("playlist-total-videos").innerHTML = numVideos;
	document.getElementById("videos-to-load").innerHTML = numVideos;
	
	// get the playlist details from the data, and update the details card
    var playlist = getPlaylistFromData(data);
	
	document.getElementById("playlist-title").innerHTML = playlist['title'];
	document.getElementById("playlist-author").innerHTML = playlist['channelTitle'];
	document.getElementById("playlist-uploaded-date").innerHTML = 
		formatDate(new Date(playlist['publishedAt']));	
	document.getElementById("playlist-description").innerHTML = playlist['description'];
	document.getElementById("playlist-thumbnail").setAttribute("src",
        playlist['thumbnails']["medium"]["url"]);
	
	// ensure the playlist item list is empty, then get all the videos in the playlist
	playlistItems = [];
	retrievePlaylistItems(api_key, playlist_id, loadPlaylistItems);
	
}

// load the playlist items (videos)
function loadPlaylistItems(data) {
	// store current size of playlistItems, so that only the new videos are added to the view
	var itemsInList = playlistItems.length;
	
	var nextPage = null;
	//  details are loaded in pages, so a check is made for the key: nextPageToken
	if (data.hasOwnProperty("nextPageToken")) {
		nextPage = data.nextPageToken;
	}
	
	// add the playlist items to the list
	for (var count = 0; count < data.items.length; count++) {
		var playlistItem = getPlaylistItemFromData(data.items[count]);
		playlistItems.push(playlistItem);
		
		video_grid.innerHTML += (new PlayListItemView(playlistItem).toString());
		retrieveVideoLength(api_key, playlistItem);
	}
	
	if (nextPage != null) {	
		document.getElementById("videos-loaded").innerHTML = playlistItems.length;
		retrievePlaylistItems(api_key, playlist_id, loadPlaylistItems, nextPage);
	} else {
		// hide the Loading div
		document.getElementById("loading-videos").style.display = "none";
	}
	
}


