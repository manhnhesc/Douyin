import { limit, type, user } from "../config/config.json";
import { SpiderQueue, TiktokUserLikeImage } from "../type";
import { getUserLikeVideo, getUserPostVideo, getUserSecId } from "./api";
import { downloadVideoQueue } from "./download";
import linq from 'linq';

const loadQueue = async (user: string, type: string, limit: number) => {
  console.log(`Input type ===> ${type === "like" ? "Like" : "Post"}`);

  const userSecId = await getUserSecId(user);

  let spiderQueue: SpiderQueue[] = [];
  let _has_more = true;
  let _max_cursor = 0;
  let _pageCount = 0;
  let _max_retry = 0;

  let getUserVideo: any = () => ({});
  if (type === "like") getUserVideo = getUserLikeVideo;
  if (type === "post") getUserVideo = getUserPostVideo;

  while (_has_more) {
    console.log("Number of page ===>", ++_pageCount, "page");
    const { list, max_cursor, has_more } = await getUserVideo(
      userSecId,
      _max_cursor
    );

    if (!list || list.length === 0) {
      if (_max_retry <= 3) {
        _max_retry++;
        console.log("Retrying ===> No.", _max_retry);
        continue;
      }

      _has_more = false;
      console.log("Finish loading page ===> Empty");
      break;
    }

    _has_more = has_more;
    _max_cursor = max_cursor;

    if (limit !== 0 && limit <= spiderQueue.length) {
      _has_more = false;
      spiderQueue = spiderQueue.slice(0, limit);
      break;
    }

    for (let item of list) {
      let photos = [];
      if (item.images != null) {
        const photoRaw = item.images as TiktokUserLikeImage[];
        photos = linq.from(photoRaw).select(x => x.url_list[x.url_list.length - 1]).toArray();

      }
      //console.log(item);
      
      const videoInfo = {
        id: item.aweme_id,
        desc: item.desc,
        url: (item.video != null && item.video != undefined) ? item.video.play_addr.uri : undefined,
        photo_urls: photos
      };
      
      spiderQueue.push(videoInfo);
    }
  }
  console.log("Finish loading page ===>", spiderQueue.length, "videos");

  return { spiderQueue };
};

(async () => {
  var userUrl = user.match(/(http|https)?:\/\/(\S+)/g)[0];
  console.log(`UserUrl: ` + userUrl);
  if (userUrl != null && userUrl != undefined && userUrl != '') {
    const { spiderQueue } = await loadQueue(userUrl, type, limit);
    await downloadVideoQueue(spiderQueue, type);
  }
})();
