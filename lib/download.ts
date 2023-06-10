import filenamify from "filenamify";
import { ensureDir } from "fs-extra";
import { resolve } from "node:path";
import download from "nodejs-file-downloader";
import { downloadDir } from "../config/config.json";
import { SpiderQueue } from "../type";
import { getFileSize, transformDownloadUrl } from "../utils";
import { headerOption as headers } from "../utils/config";
import progressBar from "../utils/progressBar";
import { isNullOrUndefined } from "node:util";
import util from 'util';


export const downloadVideoQueue = async (
  videoQueue: SpiderQueue[],
  dir: string
) => {



  console.log("Started downloading ===>", dir);
  const directory = resolve(process.cwd(), downloadDir, filenamify(dir));
  let _downloadCount = 0;

  await ensureDir(directory).catch((error) =>
    console.log("Create download folder failed!")
  );
  for (const item of videoQueue) {
    let totalSize = "0";
    try {
      console.log(
        `\nDownloading ===> ${++_downloadCount} item ${_downloadCount === 1 ? "" : ""}`
      );
      const fileName = `${item.id}.mp4`;   
      console.log(`Filename.${_downloadCount}: ${fileName} \n`);   
      let progress = null;
      let downloadHelper = new download({
        url: transformDownloadUrl(item.url),
        directory,
        fileName,
        headers,
        maxAttempts: 3,
        skipExistingFileName: true,
        onResponse: (response) => {
          totalSize = getFileSize(response.headers["content-length"]);
          if (parseFloat(totalSize) > 0) {
            return true;
          }
          else {
            console.log(`File invalid. Stop downloading.`)
            return false;
          }
        },
        onProgress: (percentage) => {
          progress = new progressBar("Download progress", 50, totalSize);
          progress.render({ completed: percentage, total: 100 });
        },
      });
      progress = null;

      var downloadResult = await downloadHelper.download();
      
      downloadHelper = null;

      if (item.photo_urls != undefined && item.photo_urls != null && item.photo_urls.length > 0) {
        console.log(`Total of photos: ` + item.photo_urls.length);
        let photoCount = 0;
        for (let photo of item.photo_urls) {          
          let totalPhotoSize = "0";
          try {

            let progressPhoto = null;
            const fileName = `${item.id}-${photoCount}.jpeg`;        
            console.log(`Photoname.${photoCount}: ${fileName} \n`);    
            let downloadPhotoHelper = new download({
              url: photo,
              directory,
              fileName,
              headers,
              maxAttempts: 3,
              skipExistingFileName: true,
              onResponse: (response) => {
                totalPhotoSize = getFileSize(response.headers["content-length"]);
                if (parseFloat(totalPhotoSize) > 0) {
                  return true;
                }
                else {
                  console.log(`File invalid. Stop downloading.`)
                  return false;
                }
              },
              onProgress: (percentage) => {
                progressPhoto = new progressBar("Download photo progress", 50, totalPhotoSize);
                progressPhoto.render({ completed: percentage, total: 100 });
              },
            });



            progressPhoto = null;            
            await downloadPhotoHelper.download();
            downloadPhotoHelper = null;


          } catch (error) {
            console.log("Download photo failed ===>", fileName);
            continue;
          }
          photoCount += 1;
        }
      }



    } catch (error) {
      console.log("Download failed ===>", item.id, error);
      continue;
    }
  }
  console.log("Download successfully");
};
