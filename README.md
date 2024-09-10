# TorrentDownloader
a js script that searches in 1337x for torrents letting you pick and download them

requires node.js installed not the nvm version
(working version 20.12.2)
``
/usr/local/lib
├── axios@1.7.7
├── cheerio@1.0.0
└── torrent-stream@1.2.1
``
before you need to install dependencies



```npm i axios cheerio fs torrent-stream -g```

simply if Windows run
``` node ./download.js <the torrent you want>```

in linux i suggest adding it to the system commands running
```sudo cp ./download /usr/local/bin/torrentDownloader```
then run it like that
```torrentDownloader <the torrent you want>```
