if application "Music" is running then
	tell application "Music"
		if player state is playing then
			set currentSong to current track
			set songTitle to name of currentSong
			set songArtist to artist of currentSong
			set songDuration to duration of currentSong

			return "playing" & "-APISPLITTER-" & songTitle & "-APISPLITTER-" & songArtist & "-APISPLITTER-" & player position & "-APISPLITTER-" & songDuration & "-APISPLITTER-"
		else
			return "false"
		end if
	end tell
else
	return "false"
end if