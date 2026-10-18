const CACHE = "vl-anh-11b5187846";
const ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./assets/images/donate.jpg",
  "./assets/images/icon-180.png",
  "./assets/images/icon-192.png",
  "./assets/images/icon-32.png",
  "./assets/images/icon-512.png",
  "./assets/voice/ca1.mp3",
  "./assets/voice/ca2.mp3",
  "./assets/voice/ca3.mp3",
  "./assets/voice/ca4.mp3",
  "./assets/voice/ca5.mp3",
  "./assets/voice/ca6.mp3",
  "./assets/voice/ca7.mp3",
  "./assets/voice/ca8.mp3",
  "./assets/voice/cq1.mp3",
  "./assets/voice/cq2.mp3",
  "./assets/voice/cq3.mp3",
  "./assets/voice/cq4.mp3",
  "./assets/voice/cq5.mp3",
  "./assets/voice/cq6.mp3",
  "./assets/voice/cq7.mp3",
  "./assets/voice/cq8.mp3",
  "./assets/voice/lA.mp3",
  "./assets/voice/lB.mp3",
  "./assets/voice/lC.mp3",
  "./assets/voice/lD.mp3",
  "./assets/voice/lE.mp3",
  "./assets/voice/lF.mp3",
  "./assets/voice/lG.mp3",
  "./assets/voice/lH.mp3",
  "./assets/voice/lI.mp3",
  "./assets/voice/lJ.mp3",
  "./assets/voice/lK.mp3",
  "./assets/voice/lL.mp3",
  "./assets/voice/lM.mp3",
  "./assets/voice/lN.mp3",
  "./assets/voice/lO.mp3",
  "./assets/voice/lP.mp3",
  "./assets/voice/lQ.mp3",
  "./assets/voice/lR.mp3",
  "./assets/voice/lS.mp3",
  "./assets/voice/lT.mp3",
  "./assets/voice/lU.mp3",
  "./assets/voice/lV.mp3",
  "./assets/voice/lW.mp3",
  "./assets/voice/lX.mp3",
  "./assets/voice/lY.mp3",
  "./assets/voice/lZ.mp3",
  "./assets/voice/pA.mp3",
  "./assets/voice/pB.mp3",
  "./assets/voice/pC.mp3",
  "./assets/voice/pD.mp3",
  "./assets/voice/pE.mp3",
  "./assets/voice/pF.mp3",
  "./assets/voice/pG.mp3",
  "./assets/voice/pH.mp3",
  "./assets/voice/pI.mp3",
  "./assets/voice/pJ.mp3",
  "./assets/voice/pK.mp3",
  "./assets/voice/pL.mp3",
  "./assets/voice/pM.mp3",
  "./assets/voice/pN.mp3",
  "./assets/voice/pO.mp3",
  "./assets/voice/pP.mp3",
  "./assets/voice/pQ.mp3",
  "./assets/voice/pR.mp3",
  "./assets/voice/pS.mp3",
  "./assets/voice/pT.mp3",
  "./assets/voice/pU.mp3",
  "./assets/voice/pV.mp3",
  "./assets/voice/pW.mp3",
  "./assets/voice/pX.mp3",
  "./assets/voice/pY.mp3",
  "./assets/voice/pZ.mp3",
  "./assets/voice/q1.mp3",
  "./assets/voice/q10.mp3",
  "./assets/voice/q11.mp3",
  "./assets/voice/q12.mp3",
  "./assets/voice/q2.mp3",
  "./assets/voice/q3.mp3",
  "./assets/voice/q4.mp3",
  "./assets/voice/q5.mp3",
  "./assets/voice/q6.mp3",
  "./assets/voice/q7.mp3",
  "./assets/voice/q8.mp3",
  "./assets/voice/q9.mp3",
  "./assets/voice/vchaoMung.mp3",
  "./assets/voice/vchonChuVuaNghe.mp3",
  "./assets/voice/vchonHinhChu.mp3",
  "./assets/voice/vconBay.mp3",
  "./assets/voice/vdienChu.mp3",
  "./assets/voice/vghepChu.mp3",
  "./assets/voice/vgioiQua.mp3",
  "./assets/voice/vhocChu.mp3",
  "./assets/voice/vhoiDap.mp3",
  "./assets/voice/vngheVaChon.mp3",
  "./assets/voice/vnoiTu.mp3",
  "./assets/voice/vthuLai.mp3",
  "./assets/voice/vxemChuDao.mp3",
  "./assets/voice/w_airplane.mp3",
  "./assets/voice/w_ant.mp3",
  "./assets/voice/w_apple.mp3",
  "./assets/voice/w_arm.mp3",
  "./assets/voice/w_arrow.mp3",
  "./assets/voice/w_axe.mp3",
  "./assets/voice/w_baby.mp3",
  "./assets/voice/w_bag.mp3",
  "./assets/voice/w_ball.mp3",
  "./assets/voice/w_banana.mp3",
  "./assets/voice/w_bear.mp3",
  "./assets/voice/w_bike.mp3",
  "./assets/voice/w_bird.mp3",
  "./assets/voice/w_black.mp3",
  "./assets/voice/w_blue.mp3",
  "./assets/voice/w_boat.mp3",
  "./assets/voice/w_book.mp3",
  "./assets/voice/w_bread.mp3",
  "./assets/voice/w_brother.mp3",
  "./assets/voice/w_brown.mp3",
  "./assets/voice/w_bus.mp3",
  "./assets/voice/w_cake.mp3",
  "./assets/voice/w_candy.mp3",
  "./assets/voice/w_car.mp3",
  "./assets/voice/w_cat.mp3",
  "./assets/voice/w_chair.mp3",
  "./assets/voice/w_cheese.mp3",
  "./assets/voice/w_cloud.mp3",
  "./assets/voice/w_cow.mp3",
  "./assets/voice/w_cup.mp3",
  "./assets/voice/w_dad.mp3",
  "./assets/voice/w_diamond.mp3",
  "./assets/voice/w_dog.mp3",
  "./assets/voice/w_door.mp3",
  "./assets/voice/w_drum.mp3",
  "./assets/voice/w_duck.mp3",
  "./assets/voice/w_eagle.mp3",
  "./assets/voice/w_ear.mp3",
  "./assets/voice/w_egg.mp3",
  "./assets/voice/w_eight.mp3",
  "./assets/voice/w_elephant.mp3",
  "./assets/voice/w_envelope.mp3",
  "./assets/voice/w_eraser.mp3",
  "./assets/voice/w_eye.mp3",
  "./assets/voice/w_family.mp3",
  "./assets/voice/w_fish.mp3",
  "./assets/voice/w_five.mp3",
  "./assets/voice/w_flag.mp3",
  "./assets/voice/w_flower.mp3",
  "./assets/voice/w_foot.mp3",
  "./assets/voice/w_four.mp3",
  "./assets/voice/w_fox.mp3",
  "./assets/voice/w_friend.mp3",
  "./assets/voice/w_frog.mp3",
  "./assets/voice/w_gift.mp3",
  "./assets/voice/w_girl.mp3",
  "./assets/voice/w_goat.mp3",
  "./assets/voice/w_grandma.mp3",
  "./assets/voice/w_grandpa.mp3",
  "./assets/voice/w_grape.mp3",
  "./assets/voice/w_grapes.mp3",
  "./assets/voice/w_green.mp3",
  "./assets/voice/w_guitar.mp3",
  "./assets/voice/w_hair.mp3",
  "./assets/voice/w_hand.mp3",
  "./assets/voice/w_hat.mp3",
  "./assets/voice/w_heart.mp3",
  "./assets/voice/w_helicopter.mp3",
  "./assets/voice/w_honey.mp3",
  "./assets/voice/w_horse.mp3",
  "./assets/voice/w_house.mp3",
  "./assets/voice/w_ice.mp3",
  "./assets/voice/w_icecream.mp3",
  "./assets/voice/w_ink.mp3",
  "./assets/voice/w_insect.mp3",
  "./assets/voice/w_island.mp3",
  "./assets/voice/w_jacket.mp3",
  "./assets/voice/w_jellyfish.mp3",
  "./assets/voice/w_joker.mp3",
  "./assets/voice/w_juice.mp3",
  "./assets/voice/w_jump.mp3",
  "./assets/voice/w_key.mp3",
  "./assets/voice/w_king.mp3",
  "./assets/voice/w_kite.mp3",
  "./assets/voice/w_kiwi.mp3",
  "./assets/voice/w_koala.mp3",
  "./assets/voice/w_ladder.mp3",
  "./assets/voice/w_lamp.mp3",
  "./assets/voice/w_leaf.mp3",
  "./assets/voice/w_leg.mp3",
  "./assets/voice/w_lemon.mp3",
  "./assets/voice/w_lion.mp3",
  "./assets/voice/w_mango.mp3",
  "./assets/voice/w_meat.mp3",
  "./assets/voice/w_milk.mp3",
  "./assets/voice/w_mom.mp3",
  "./assets/voice/w_monkey.mp3",
  "./assets/voice/w_moon.mp3",
  "./assets/voice/w_motorbike.mp3",
  "./assets/voice/w_mountain.mp3",
  "./assets/voice/w_mouse.mp3",
  "./assets/voice/w_mouth.mp3",
  "./assets/voice/w_nest.mp3",
  "./assets/voice/w_nine.mp3",
  "./assets/voice/w_nose.mp3",
  "./assets/voice/w_notebook.mp3",
  "./assets/voice/w_nurse.mp3",
  "./assets/voice/w_nut.mp3",
  "./assets/voice/w_ocean.mp3",
  "./assets/voice/w_octopus.mp3",
  "./assets/voice/w_one.mp3",
  "./assets/voice/w_onion.mp3",
  "./assets/voice/w_orange.mp3",
  "./assets/voice/w_orangecolor.mp3",
  "./assets/voice/w_owl.mp3",
  "./assets/voice/w_panda.mp3",
  "./assets/voice/w_peach.mp3",
  "./assets/voice/w_pen.mp3",
  "./assets/voice/w_pencil.mp3",
  "./assets/voice/w_pig.mp3",
  "./assets/voice/w_pineapple.mp3",
  "./assets/voice/w_pink.mp3",
  "./assets/voice/w_pizza.mp3",
  "./assets/voice/w_purple.mp3",
  "./assets/voice/w_queen.mp3",
  "./assets/voice/w_question.mp3",
  "./assets/voice/w_quiet.mp3",
  "./assets/voice/w_quilt.mp3",
  "./assets/voice/w_rabbit.mp3",
  "./assets/voice/w_rain.mp3",
  "./assets/voice/w_rainbow.mp3",
  "./assets/voice/w_red.mp3",
  "./assets/voice/w_rice.mp3",
  "./assets/voice/w_ring.mp3",
  "./assets/voice/w_river.mp3",
  "./assets/voice/w_robot.mp3",
  "./assets/voice/w_rose.mp3",
  "./assets/voice/w_ruler.mp3",
  "./assets/voice/w_school.mp3",
  "./assets/voice/w_scissors.mp3",
  "./assets/voice/w_seven.mp3",
  "./assets/voice/w_sheep.mp3",
  "./assets/voice/w_ship.mp3",
  "./assets/voice/w_sister.mp3",
  "./assets/voice/w_six.mp3",
  "./assets/voice/w_snake.mp3",
  "./assets/voice/w_soup.mp3",
  "./assets/voice/w_star.mp3",
  "./assets/voice/w_strawberry.mp3",
  "./assets/voice/w_subway.mp3",
  "./assets/voice/w_sun.mp3",
  "./assets/voice/w_teacher.mp3",
  "./assets/voice/w_ten.mp3",
  "./assets/voice/w_tent.mp3",
  "./assets/voice/w_three.mp3",
  "./assets/voice/w_tiger.mp3",
  "./assets/voice/w_tomato.mp3",
  "./assets/voice/w_tooth.mp3",
  "./assets/voice/w_train.mp3",
  "./assets/voice/w_tree.mp3",
  "./assets/voice/w_truck.mp3",
  "./assets/voice/w_two.mp3",
  "./assets/voice/w_umbrella.mp3",
  "./assets/voice/w_unicorn.mp3",
  "./assets/voice/w_uniform.mp3",
  "./assets/voice/w_universe.mp3",
  "./assets/voice/w_up.mp3",
  "./assets/voice/w_van.mp3",
  "./assets/voice/w_vegetables.mp3",
  "./assets/voice/w_vest.mp3",
  "./assets/voice/w_violin.mp3",
  "./assets/voice/w_volcano.mp3",
  "./assets/voice/w_watch.mp3",
  "./assets/voice/w_water.mp3",
  "./assets/voice/w_watermelon.mp3",
  "./assets/voice/w_whale.mp3",
  "./assets/voice/w_white.mp3",
  "./assets/voice/w_wind.mp3",
  "./assets/voice/w_window.mp3",
  "./assets/voice/w_worm.mp3",
  "./assets/voice/w_xmastree.mp3",
  "./assets/voice/w_xray.mp3",
  "./assets/voice/w_xylophone.mp3",
  "./assets/voice/w_yacht.mp3",
  "./assets/voice/w_yarn.mp3",
  "./assets/voice/w_yellow.mp3",
  "./assets/voice/w_yogurt.mp3",
  "./assets/voice/w_yoyo.mp3",
  "./assets/voice/w_zebra.mp3",
  "./assets/voice/w_zero.mp3",
  "./assets/voice/w_zoo.mp3",
  "./js/audio.js",
  "./js/data.js",
  "./js/games.js",
  "./js/main.js",
  "./js/pwa.js",
];

self.addEventListener("install", function (event) {
  event.waitUntil((async function () {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(ASSETS);
    } catch (e) {
      await Promise.all(ASSETS.map(function (url) {
        return cache.add(url).catch(function () { });
      }));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", function (event) {
  event.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  event.respondWith(respond(req));
});

async function respond(req) {
  const cache = await caches.open(CACHE);
  const range = req.headers.get("range");
  const hit = await cache.match(req.url, { ignoreVary: true, ignoreSearch: true });
  if (hit && !range) return hit;
  if (hit && range) {
    const part = await slice(hit, range);
    if (part) return part;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok && !range && req.mode !== "navigate") cache.put(req.url, res.clone());
    return res;
  } catch (e) {
    if (req.mode === "navigate") {
      const page = await cache.match("./index.html", { ignoreVary: true });
      if (page) return page;
    }
    if (hit) return hit;
    return new Response("Offline", { status: 504, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function slice(res, header) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  let start, end;
  if (m[1] === "") {
    start = size - Number(m[2]);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Number(m[2]);
  }
  if (!isFinite(start) || !isFinite(end)) return null;
  if (start < 0) start = 0;
  if (end > size - 1) end = size - 1;
  if (start > end) return null;
  const headers = new Headers(res.headers);
  headers.set("Content-Range", "bytes " + start + "-" + end + "/" + size);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers: headers });
}
