const { exec } = require('child_process');// ensure the modules is reachable
const path = require('path');
const modulePath = path.resolve('/usr/local/lib/node_modules');  // replace with your npm root path
require('module').globalPaths.push(modulePath);

const axios = require("axios");
const cheerio = require("cheerio");// fetching

const torrentStream = require('torrent-stream');
const fs = require('fs');// downloading

const readline = require('node:readline');

async function search(query) {
    const searchResponse = await axios.get(`https://1337x.to/sort-search/${query}/seeders/desc/1/`); // html for the first page after searching
      const $ = cheerio.load(searchResponse.data);
    
      // Extract the first torrent link from the search results
      const torrentLinks = [];
        $('a').each((index, element) => {
      const href = $(element).attr("href"); // get link from href attribute
        if (href && href.includes('/torrent/')) {// check if it has one and has link that inclueds torrent
        torrentLinks.push("https://1337x.to"+href);
        }
        });
    //   console.log(torrentLinks);
  return torrentLinks;

}
async function ExtractMagnetLink(link) {
  const response = await axios.get(link);
  const $ = cheerio.load(response.data);
  const magnetLink = $('a[href^="magnet:?xt=urn:btih:"]').attr("href");
  return magnetLink;
}
async function DownloadMagnet(magnetLink) {
    const workingDir = await process.cwd();

    const options = {
        trackers: [
            'udp://tracker.openbittorrent.com:80',
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://tracker.coppersurfer.tk:6969/announce',
            'udp://exodus.desync.com:6969',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.openwebtorrent.com'
        ],
        dht: true, // Enable DHT for peer discovery
    };

    return new Promise((resolve, reject) => {
        const engine = torrentStream(magnetLink,options);

        // Event when torrent metadata is ready
        engine.on('ready', () => {
            console.log(`Torrent name: ${engine.torrent.name}`);
            console.log(`Number of files: ${engine.files.length}`);

            // Create a folder with the name of the torrent
            // const downloadPath = path.join(workingDir, engine.torrent.name);
            // if (!fs.existsSync(downloadPath)) {
            //     fs.mkdirSync(downloadPath, { recursive: true });
            // }
            const downloadPath = workingDir
            console.log(`Downloading ${engine.torrent.name} to ${downloadPath}`);

            // Log number of seeders
            setInterval(() => {
                console.log(`Connected peers: ${engine.swarm.wires.length}`);
                engine.swarm.wires.forEach((wire, index) => {
                    console.log(`Peer ${index + 1} - Download speed: ${wire.downloadSpeed()} bytes/s, Uploaded: ${wire.uploaded}`);
                });
            }, 30000); // Log every 30 seconds

            // Loop over each file in the torrent and download them
            engine.files.forEach((file) => {
                const filePath = path.join(downloadPath, file.path);

                // Ensure the directory structure for the file exists
                const fileDir = path.dirname(filePath);
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true });
                }

                console.log(`Downloading ${file.name} (${file.length} bytes)...`);

                const fileStream = fs.createWriteStream(filePath);
                
                const stream = file.createReadStream();
            engine.listen();
                // Pipe the file's content to disk
                stream.pipe(fileStream);

                // Log file download progress
                let downloaded = 0;
                stream.on('data', (chunk) => {
                    downloaded += chunk.length;
                    const percent = ((downloaded / file.length) * 100).toFixed(2);
                    console.log(`${file.name}: ${percent}% downloaded`);
                });

                fileStream.on('finish', () => {
                    console.log(`${file.name} downloaded.`);
                });

                fileStream.on('error', (err) => {
                    console.error(`Error writing ${file.name}:`, err);
                    reject(err);
                });
            });
        });

        // Event for when the torrent is done downloading
        engine.on('idle', () => {
            console.log('Torrent download finished.');
            engine.destroy(); // Clean up the torrent engine
            resolve();
        });

        // Log errors
        engine.on('error', (err) => {
            console.error('Error downloading torrent:', err);
            engine.destroy(); // Clean up on error
            reject(err);
        });
    });
}

const workingDir = process.cwd(); // where is the terminal running

const query = process.argv.slice(2).join(" "); // what do u add to the command

async function getMagnetLink(query) {
  
  try {
      const searchQuery = query.split(' ').join('+');
      // Fetch the search results page from 1337x
      var magnetlinks = []
      
    const Links = await search(searchQuery);

    // Extract the magnet link
    // Links.forEach(async (link) => {
    // //   console.log(link);
    //   const magnetLink = await ExtractMagnetLink(link);
    // //   console.log(magnetLink)
    //   magnetlinks.push(magnetLink);
    // });

    for (var i = 0; i < Links.length; i++) {
        const magnetLink = await ExtractMagnetLink(Links[i]);
        magnetlinks.push(magnetLink);
    }
    return magnetlinks

    

      
  } catch (error) {
      console.error('An error occurred:', error.message);
  }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
async function main(){

//   await DownloadMagnet((await getMagnetLink(query))[0]); // default download the first torrent

const titles = await search(query);
//   console.log(titles);
for (var i= 0; i < titles.length; i++) {
    console.log(`[${i}] - ${(titles[i].split("/")).slice(5,-1)}`); 
  }
  rl.question(
    "input the number of torrent you want to download: ",
    async (answer) => {
      const magnetLink = await ExtractMagnetLink(titles[answer]);
      await DownloadMagnet(magnetLink);
      rl.close();
    }
  );
}
main();