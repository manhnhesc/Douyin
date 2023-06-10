import fetch from "node-fetch";
import { TiktokUserLike } from "../type";
import { getCookies, getTiktokSecId, transformParams } from "../utils";
import { headerOption, likeBaseUrl, postBaseUrl } from "../utils/config";
import { max_retry } from "../config/config.json";
import { resolve } from "node:path";
import fs from 'fs';


const request = async (url: string, option = {}) => {
  return await fetch(url, {
    headers: headerOption,
    ...option,
  });
};


export const getUserSecId = async (userUrl: string) => {
  let userSecId = ""
  const urlRegex = /www\.iesdouyin\.com\/share\/user\//

  if (urlRegex.test(userUrl)) {
    userSecId = userUrl
  } else {
    const response = await request(userUrl);
    userSecId = response.url
  }

  userSecId = getTiktokSecId(userSecId);

  if (!userSecId) throw new Error("Sec_Id not found!");
  return userSecId;
};


const getTTWid = async () => {
  const postBody = {
    region: "cn",
    aid: 1768,
    needFid: false,
    service: "www.ixigua.com",
    migrate_info: { ticket: "", source: "node" },
    cbUrlProtocol: "https",
    union: true,
  };
  const result = await request(
    "https://ttwid.bytedance.com/ttwid/union/register/",
    {
      method: "POST",
      body: JSON.stringify(postBody),
    }
  );
  const ttwid = result.headers.get("set-cookie");

  return ttwid.split(";").map((item) => item.trim())[0];
};


const getUserVideo = (type: string) => {
  let requestUrl = "";
  if (type === "post") requestUrl = postBaseUrl;
  if (type === "like") requestUrl = likeBaseUrl;

  return async (sec_uid: string, max_cursor: number) => {
    let requestParams = transformParams(sec_uid, max_cursor);
    let cookies = await getCookies(getTTWid);
    let loopCount = 0;
    let responseText = "";

    while (loopCount <= max_retry && responseText === "") {
      if (loopCount > 0) console.log(`No. ${loopCount} requesting...`);
      loopCount += 1;
      const responsePending = await request(requestUrl + requestParams, {
        headers: { ...headerOption, cookie: cookies },
      });
      responseText = await responsePending.text();

      if (loopCount % 10 === 0 && !responseText) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        requestParams = transformParams(sec_uid, max_cursor);
        cookies = await getCookies(getTTWid);
      }
    }

    if (!responseText) {
      console.log("Maximum number of retrying requests exceeded, stop request, download fetched content...");
      return { list: [], max_cursor: 0, has_more: false };
    }



    const response = JSON.parse(responseText) as TiktokUserLike;



    // const directory1 = resolve(process.cwd(), 'log1.txt');
    // const directory2 = resolve(process.cwd(), 'log2.txt');
    // if (response.aweme_list[0].images != null) {

    //   fs.writeFile(directory1, JSON.stringify(response.aweme_list[0].images[0].url_list), function (err) {
    //     if (err) {
    //       return console.log(err);
    //     }

    //     console.log("The file was saved!");
    //   });
    // }




    return {
      list: response.aweme_list,
      max_cursor: response.max_cursor,
      has_more: response.has_more,
    };
  };
};

export const getUserLikeVideo = getUserVideo("like");
export const getUserPostVideo = getUserVideo("post");
