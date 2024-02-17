if application "Music" is running then
	tell application "Music"
		if player state is playing then
			set currentSong to current track
			set songTitle to name of currentSong
			set songArtist to artist of currentSong
			set songArtwork to ""
				
			try
				tell application "Shortcuts Events"
					set songArtwork to item 1 of (run shortcut named "Get artwork from name" with input "{\"title\": \"" & songTitle & "\", \"artist\": \"" & songArtist & "\"}")
				end tell
			end try
			
			return songArtwork
		else
			return ""
		end if
	end tell
else
	return ""
end if