import filenamify from "filenamify";
import { ensureDir } from "fs-extra";
import { resolve } from "node:path";
import download from "nodejs-file-downloader";
import { downloadDir } from "../config/config.json";
import { SpiderQueue } from "../type";
import { getFileSize, transformDownloadUrl } from "../utils";
import { headerOption as headers } from "../utils/config";
import progressBar from "../utils/progressBar";


export const downloadVideoQueue = async (
  videoQueue: SpiderQueue[],
  dir: string
) => {
  console.log("开始下载 ===>", dir);
  const directory = resolve(process.cwd(), downloadDir, filenamify(dir));
  let _downloadCount = 0;

  await ensureDir(directory).catch((error) =>
    console.log("Create download folder failed!")
  );
  for (const item of videoQueue) {
    let totalSize = "0";
    try {
      console.log(
        `Downloading ===> ${++_downloadCount} item ${_downloadCount === 1 ? "" : "\n"}`
      );
      const fileName = `${item.id}-${filenamify(item.desc)}.mp4`;
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
          return true;
        },
        onProgress: (percentage) => {
          progress = new progressBar("Download progress", 50, totalSize);
          progress.render({ completed: percentage, total: 100 });
        },
      });

      await downloadHelper.download();
      downloadHelper = null;
    } catch (error) {
      console.log("Download failed ===>", item.id);
      continue;
    }
  }
  console.log("Download successfully");
};
