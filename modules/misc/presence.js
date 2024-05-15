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

        realPresence.health.lastUpdate.heartRate = Date.now();

        patchPresence();
    }
    patchHDSHeartRateWithTimestamp(heartRate, timestamp) {
        realPresence.health.heartRate = heartRate;

        realPresence.health.lastUpdate.heartRate = timestamp;

        patchPresence();
    }
    getHDSHeartRateTimestamp() {
        return realPresence.health.lastUpdate.heartRate;
    }

    patchHDSSpeed(speed) {
        console.log("\x1b[36m", "[HDS] Received speed: " + speed);
        realPresence.health.speed = speed;

        realPresence.health.lastUpdate.speed = Date.now();

        patchPresence();
    }

    patchHDSOxygenSaturation(oxygenSaturation) {
        console.log("\x1b[36m", "[HDS] Received oxygen saturation: " + oxygenSaturation);
        realPresence.health.oxygenSaturation = oxygenSaturation;

        realPresence.health.lastUpdate.oxygenSaturation = Date.now();

        patchPresence();
    }

    patchLocation(latitude, longitude, district, country, city) {
        realPresence.location.latitude = latitude;
        realPresence.location.longitude = longitude;
        realPresence.location.district = district;
        realPresence.location.country = country;
        realPresence.location.city = city;

        realPresence.location.lastUpdate = Date.now();

        patchPresence();
    }

    patchNetflix(title, defaultImage, date, showId) {
        realPresence.netflix.lastWatched.title = title;
        realPresence.netflix.lastWatched.defaultImage = String(defaultImage);
        realPresence.netflix.lastWatched.date = date;
        realPresence.netflix.lastWatched.showId = Number(showId);

        realPresence.netflix.lastWatched.lastUpdate = Date.now();

        patchPresence();
    }

    patchPlex(title, cover, publicURL) {
        realPresence.plex.lastWatched.title = title;
        realPresence.plex.lastWatched.cover = cover;
        realPresence.plex.lastWatched.publicURL = publicURL;

        realPresence.plex.lastWatched.lastUpdate = Date.now();
    }

    patchValorant(username, rank, rr) {
        var valorant = realPresence.valorant;

        if (valorant.username == username && valorant.rank == rank && valorant.rr == rr)
            return;

        realPresence.valorant.username = username;
        realPresence.valorant.rank = rank;
        realPresence.valorant.rr = rr;

        realPresence.valorant.lastUpdate = Date.now();

        patchPresence();
    }

    patchDiscord(username, status, activity) {
        realPresence.discord.username = username;
        realPresence.discord.status = status;
        realPresence.discord.activity = activity;

        realPresence.discord.lastUpdate = Date.now();

        patchPresence();
    }

    patchDuolingo(username, streak, xp, language, language_icon_URL, avatar) {
        realPresence.duolingo.username = username;
        realPresence.duolingo.streak = streak;
        realPresence.duolingo.xp = xp;
        realPresence.duolingo.language = language;
        realPresence.duolingo.language_icon_URL = language_icon_URL;
        realPresence.duolingo.avatar = avatar;

        realPresence.duolingo.lastUpdate = Date.now();

        patchPresence();
    }

    getDuolingo() {
        return realPresence.duolingo;
    }

    patchApplePay(merchant, amount, cardOrPass) {
        realPresence.applePay.merchant = merchant;
        realPresence.applePay.amount = amount;
        realPresence.applePay.cardOrPass = cardOrPass;

        realPresence.applePay.lastUpdate = Date.now();

        patchPresence();
    }

    patchYouTubeMusic(title, artist, url, thumbnail, date) {
        realPresence.youtube.music.title = title;
        realPresence.youtube.music.artist = artist;
        realPresence.youtube.music.url = url;
        realPresence.youtube.music.thumbnail = thumbnail;
        realPresence.youtube.music.lastUpdate = date;

        patchPresence();
    }

    patchYouTubeVideo(title, channel, url, thumbnail, date) {
        realPresence.youtube.video.title = title;
        realPresence.youtube.video.channel = channel;
        realPresence.youtube.video.url = url;
        realPresence.youtube.video.thumbnail = thumbnail;
        realPresence.youtube.video.lastUpdate = date;

        patchPresence();
    }

    getYouTubeMusicURL() {
        return realPresence.youtube.music.url;
    }

    getYouTubeVideoURL() {
        return realPresence.youtube.video.url;
    }

    patchSpotify(title, artist, url, cover, date) {
        realPresence.spotify.song.title = title;
        realPresence.spotify.song.artist = artist;
        realPresence.spotify.song.url = url;
        realPresence.spotify.song.cover = cover;
        realPresence.spotify.song.date = date;

        realPresence.spotify.lastUpdate = Date.now();

        patchPresence();
    }
}
module.exports = presence;

function patchPresence() {
    fs.writeFileSync(path.join(__dirname, '..', '..', 'presence.json'), JSON.stringify(realPresence, null, 4));
}