
const canvas = document.createElement("canvas");
canvas.setAttribute("id", "DOM-Measure-Extension-Canvas");
const canvasWrapper = document.createElement("div");
canvasWrapper.setAttribute("id", "DOM-Measure-Extension-Canvas-Wrapper");
const context = canvas.getContext("2d");

let base, target;
let rulerList = [], guideList = [];

function Rect(element) {
  const rectObject = element.getBoundingClientRect();
  this.offset = {
    top: rectObject.top + window.scrollY,
    right: rectObject.right + window.scrollX,
    bottom: rectObject.bottom + window.scrollY,
    left: rectObject.left + window.scrollX,
  };
}

Rect.prototype = {
  calcArea: function () {
    // 面積を計算する
    return (this.offset.right - this.offset.left) * (this.offset.bottom - this.offset.top);
  },
};

// popupからのメッセージを受信したとき
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log(message.isEnabled);
  if (message.isEnabled) {
    // canvas要素を追加する
    canvasWrapper.appendChild(canvas);
    document.body.appendChild(canvasWrapper);
    canvas.setAttribute("width", canvasWrapper.offsetWidth);
    canvas.setAttribute("height", canvasWrapper.offsetHeight);
    // クリック時のイベントハンドラを登録する
    window.addEventListener("click", onClick, false);
    window.addEventListener("scroll", onScroll, false);
  } else {
    // canvas要素を削除する
    // イベントハンドラを削除する
    window.removeEventListener("click", onClick, false);
    window.removeEventListener("mouseover", onMouseEnter, false);
    window.removeEventListener("scroll", onScroll, false);
  }
});

function onClick(event) {
  // クリックした座標から要素を取得する
  base = new Rect(document.elementFromPoint(event.clientX, event.clientY));
  console.log("base", base.offset);

  window.addEventListener("mouseover", onMouseEnter, false);
}

function onMouseEnter(event) {
  // ホバーした座標から要素を取得する
  target = new Rect(document.elementFromPoint(event.clientX, event.clientY));
  console.log("target", target.offset);

  updateCanvas();
}

function onScroll(event) {
  // 再描画する
}

function updateCanvas() {
  // 接触判定
  if (isCollided()) {
    const outer = base.calcArea() >= target.calcArea() ? base : target;
    const inner = base.calcArea() < target.calcArea() ? base : target;
    // 内包判定
    if (isContained(outer, inner)) {
      console.log("contained.");
      // 内包される側を基点として線を描画する
      updateRuler(inner, outer);
    } else {
      // 接触している
      console.log("collided.");
    }
  } else {
    // 接触していない
    console.log("not collided.");

    // 基点の軸が当たる
    // 基点の軸が当たらず、他方の軸が当たる
    // 基点、他方の軸が当たらず、基点の辺から伸ばす
    // 基点の辺から伸ばす線が当たらない
  }
  // 再描画
  drawRuler();
}

function isCollided() {
  return target.offset.left < base.offset.right && base.offset.left < target.offset.right && target.offset.top < base.offset.bottom && base.offset.top < target.offset.bottom;
}

function isContained(outer, inner) {
  return (
    (outer.offset.top <= inner.offset.top && inner.offset.top <= outer.offset.bottom) &&
    (outer.offset.top <= inner.offset.bottom && inner.offset.bottom <= outer.offset.bottom) &&
    (outer.offset.left <= inner.offset.left && inner.offset.left <= outer.offset.right) &&
    (outer.offset.left <= inner.offset.right && inner.offset.right <= outer.offset.right)
  );
}

function updateRuler(a, b) {
  rulerList.splice(0, rulerList.length);
  pushLine(rulerList, (a.offset.left + a.offset.right) / 2, a.offset.top, (a.offset.left + a.offset.right) / 2, b.offset.top);
  pushLine(rulerList, (a.offset.left + a.offset.right) / 2, a.offset.bottom, (a.offset.left + a.offset.right) / 2, b.offset.bottom);
  pushLine(rulerList, a.offset.left, (a.offset.top + a.offset.bottom) / 2, b.offset.left, (a.offset.top + a.offset.bottom) / 2);
  pushLine(rulerList, a.offset.right, (a.offset.top + a.offset.bottom) / 2, b.offset.right, (a.offset.top + a.offset.bottom) / 2);
}

function pushLine(dest, startX, startY, endX, endY) {
  if (!Array.isArray(dest)) {
    return;
  }

  dest.push({
    start: {
      x: startX,
      y: startY,
    },
    end: {
      x: endX,
      y: endY,
    }
  });
}

function drawRuler() {
  context.clearRect(0, 0, canvasWrapper.offsetWidth, canvasWrapper.offsetHeight);
  rulerList.forEach(function(ruler) {
    drawLine(ruler.start.x, ruler.start.y, ruler.end.x, ruler.end.y);
  });
}

// 描画する際にscrollを考慮する(常にViewPortの左上を基準に描画する)
function drawLine(startX, startY, endX, endY) {
  // 1pxの線がぼやけないように描画座標を0.5ずらす
  const isVertial = startX === endX ? true : false;
  const extraX = isVertial ? 0.5 : 0;
  const extraY = isVertial ? 0 : 0.5;
  context.beginPath();
  context.moveTo(startX + window.scrollX + extraX, startY + window.scrollY + extraY);
  context.lineTo(endX + window.scrollX + extraX, endY + window.scrollY + extraY);
  context.closePath();
  context.stroke();
  console.count("draw");
}