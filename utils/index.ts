import { getXB } from "./X-Bogus";
import { odin_tt, passport_csrf_token } from "../config/config.json";
import { HDDownloadUrl } from "./config";
import { stringify } from "qs";


export const getTiktokSecId = (userUrl: string) => {
  const reg = /(?<=user\/)[^?]+/g;
  const result = userUrl.match(reg);
  if (result) return result[0];
  return null;
};


export const generateRandomString = (length = 107) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};


export const getCookies = async (getTtwidFn) => {
  const ttwid = await getTtwidFn();
  const cookies = [
    `msToken=${generateRandomString()}`,
    ttwid,
    `odin_tt=${odin_tt}`,
    `passport_csrf_token=${passport_csrf_token}`,
  ].join(";");

  return cookies;
};


export const transformParams = (sec_user_id: string, max_cursor: number) => {
  const params = {
    sec_user_id,
    count: 35,
    max_cursor,
    aid: 1128,
    version_name: "23.5.0",
    device_platform: "android",
    os_version: "2333",
  };
  params["X-Bogus"] = getXB(stringify(params));

  return stringify(params);
};


export const transformDownloadUrl = (video_id: string) => {
  return `${HDDownloadUrl}${stringify({ video_id, radio: "1080p", line: 0 })}`
}


export const getFileSize = (contentLengthHeader: string) => {
  const contentLength = parseInt(contentLengthHeader, 10);
  const fileSize = contentLength / (1024 * 1024);
  return fileSize.toFixed(2);
}