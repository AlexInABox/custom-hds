const fs = require('fs');
const path = require('path');

var realPresence;

class presence {
    constructor() {
        realPresence = require('./../../presence.json');
    }

    patchHDSHeartRate(heartRate) {
        console.log("\x1b[36m", "[HDS] Received heart rate: " + heartRate);
        realPresence.health.heartRate = heartRate;

        patchPresence();
    }

    patchHDSSpeed(speed) {
        console.log("\x1b[36m", "[HDS] Received speed: " + speed);
        realPresence.health.speed = speed;

        patchPresence();
    }

    patchHDSOxygenSaturation(oxygenSaturation) {
        console.log("\x1b[36m", "[HDS] Received oxygen saturation: " + oxygenSaturation);
        realPresence.health.oxygenSaturation = oxygenSaturation;

        patchPresence();
    }

    patchLocation(latitude, longitude, district, country, city) {
        realPresence.location.latitude = latitude;
        realPresence.location.longitude = longitude;
        realPresence.location.district = district;
        realPresence.location.country = country;
        realPresence.location.city = city;

        patchPresence();
    }

    patchNetflix(title, defaultImage, date, showId) {
        realPresence.netflix.lastWatched.title = title;
        realPresence.netflix.lastWatched.defaultImage = defaultImage;
        realPresence.netflix.lastWatched.date = date;
        realPresence.netflix.lastWatched.showId = showId;

        patchPresence();
    }

    patchValorant(username, rank, rr) {
        realPresence.valorant.username = username;
        realPresence.valorant.rank = rank;
        realPresence.valorant.rr = rr;

        patchPresence();
    }

    patchDiscord(username, status, activity) {
        realPresence.discord.username = username;
        realPresence.discord.status = status;
        realPresence.discord.activity = activity;

        patchPresence();
    }

    patchYouTube(vTitle, vChannel, vUrl, vThumbnail, vDate, mTitle, mArtist, mUrl, mThumbnail, mDate) {
        realPresence.youtube.video.title = vTitle;
        realPresence.youtube.video.channel = vChannel;
        realPresence.youtube.video.url = vUrl;
        realPresence.youtube.video.thumbnail = vThumbnail;
        realPresence.youtube.video.date = vDate;

        realPresence.youtube.music.title = mTitle;
        realPresence.youtube.music.artist = mArtist;
        realPresence.youtube.music.url = mUrl;
        realPresence.youtube.music.thumbnail = mThumbnail;
        realPresence.youtube.music.date = mDate;

        patchPresence();
    }

    patchSpotify(title, artist, url, cover, date) {
        realPresence.spotify.song.title = title;
        realPresence.spotify.song.artist = artist;
        realPresence.spotify.song.url = url;
        realPresence.spotify.song.cover = cover;
        realPresence.spotify.song.date = date;

        patchPresence();
    }
}
module.exports = presence;

function patchPresence() {
    fs.writeFileSync(path.join(__dirname, '..', '..', 'presence.json'), JSON.stringify(realPresence, null, 4));
}