let isEnabled = false;
const canvas = document.createElement("canvas");
canvas.setAttribute("id", "DOM-Measure-Extension-Canvas");
const canvasWrapper = document.createElement("div");
canvasWrapper.setAttribute("id", "DOM-Measure-Extension-Canvas-Wrapper");
const context = canvas.getContext("2d");

let base, target;
let rulerList = [], guideList = [];

function Rect(element) {
  this.element = element;
  const rectObject = element.getBoundingClientRect();
  this.offset = {
    top: rectObject.top + window.scrollY,
    right: rectObject.right + window.scrollX,
    bottom: rectObject.bottom + window.scrollY,
    left: rectObject.left + window.scrollX,
  };
  this.center = {
    x: (this.offset.left + this.offset.right) / 2,
    y: (this.offset.top + this.offset.bottom) / 2,
  }
}

Rect.prototype = {
  calcArea: function () {
    // 面積を計算する
    return (this.offset.right - this.offset.left) * (this.offset.bottom - this.offset.top);
  },
};

// popupからのメッセージを受信したとき
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.type) {
    case "TOGGLE_ENABLE":
      isEnabled = isEnabled ? false : true;
      console.log(isEnabled);
      if (isEnabled) {
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
        canvasWrapper.remove();
        // イベントハンドラを削除する
        window.removeEventListener("click", onClick, false);
        window.removeEventListener("mouseover", onMouseEnter, false);
        window.removeEventListener("scroll", onScroll, false);
      }
      sendResponse(isEnabled);
      break;
    case "GET_ENABLE":
      sendResponse(isEnabled);
      break;
    default:
      break;
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

  if (base.element === target.element) {
    context.clearRect(0, 0, canvasWrapper.offsetWidth, canvasWrapper.offsetHeight);
  } else {
    updateCanvas();
  }
}

function onScroll(event) {
  // 再描画する
  context.clearRect(0, 0, canvasWrapper.offsetWidth, canvasWrapper.offsetHeight);
  drawRuler();
  drawGuide();
}

function updateCanvas() {
  rulerList.splice(0, rulerList.length);
  guideList.splice(0, guideList.length);
  // 接触判定
  if (isCollided()) {
    const outer = base.calcArea() >= target.calcArea() ? base : target;
    const inner = base.calcArea() < target.calcArea() ? base : target;
    // 内包判定
    if (isContained(outer, inner)) {
      console.log("contained.");
      // 内包される側を基点として線を描画する
      pushLine(rulerList, inner.center.x, inner.offset.top, inner.center.x, outer.offset.top);
      pushLine(rulerList, inner.center.x, inner.offset.bottom, inner.center.x, outer.offset.bottom);
      pushLine(rulerList, inner.offset.left, inner.center.y, outer.offset.left, inner.center.y);
      pushLine(rulerList, inner.offset.right, inner.center.y, outer.offset.right, inner.center.y);
    } else {
      // 接触している
      console.log("collided.");
    }
  } else {
    // 接触していない
    console.log("not collided.");

    // 位置関係を判定する
    const isTopPosition = base.offset.top >= target.offset.bottom;
    const isRightPosition = base.offset.right <= target.offset.left;
    const isBottomPosition = base.offset.bottom <= target.offset.top;
    const isLeftPosition = base.offset.left >= target.offset.right;
    /*
    let pos = isTopPosition ? "Top" : "";
    pos += isRightPosition ? "Right" : ""
    pos += isBottomPosition ? "Bottom" : "";
    pos += isLeftPosition ? "Left" : "";
    console.log(pos);
    */

    if (isLeftPosition || isRightPosition) {
      let y;
      if (target.offset.top <= base.center.y && base.center.y <= target.offset.bottom) {
        // 基点の軸が当たる
        y = base.center.y;
      } else if (base.offset.top <= target.center.y && target.center.y <= base.offset.bottom) {
        //基点の軸が当たらず、他方の軸が当たる
        y = target.center.y;
      } else if ((target.offset.top <= base.offset.top && base.offset.top <= target.offset.bottom) || (target.offset.top <= base.offset.bottom && base.offset.bottom <= target.offset.bottom)) {
        // 基点、他方の軸が当たらず、基点の辺の延長線が当たる
        y = Math.abs(base.offset.top - target.center.y) < Math.abs(base.offset.bottom - target.center.y) ? base.offset.top : base.offset.bottom;
      } else {
        // 基点の辺の延長線が当たらない
        // 線自体は基点の軸が当たるケースと同じ
        y = base.center.y;
        // ガイド線が必要
        const guideEndY = Math.abs(base.center.y - target.offset.top) < Math.abs(base.center.y - target.offset.bottom) ? target.offset.top : target.offset.bottom;
        const guideX = isLeftPosition ? target.offset.right - 1 : target.offset.left;
        pushLine(guideList, guideX, base.center.y, guideX, guideEndY);
      }
      const start = isLeftPosition ? "left" : "right";
      const end = isLeftPosition ? "right" : "left";
      pushLine(rulerList, base.offset[start], y, target.offset[end], y);
    }
    if (isTopPosition || isBottomPosition) {
      let x;
      if (target.offset.left <= base.center.x && base.center.x <= target.offset.right) {
        // 基点の軸が当たる
        x = base.center.x;
      } else if (base.offset.left <= target.center.x && target.center.x <= base.offset.right) {
        //基点の軸が当たらず、他方の軸が当たる
        x = target.center.x;
      } else if ((target.offset.left <= base.offset.left && base.offset.left <= target.offset.right) || (target.offset.left <= base.offset.right && base.offset.right <= target.offset.right)) {
        // 基点、他方の軸が当たらず、基点の辺の延長線が当たる
        x = Math.abs(base.offset.left - target.center.x) < Math.abs(base.offset.right - target.center.x) ? base.offset.left : base.offset.right;
      } else {
        // 基点の辺の延長線が当たらない
        // 線自体は基点の軸が当たるケースと同じ
        x = base.center.x;
        // ガイド線が必要
        const guideEndX = Math.abs(base.center.x - target.offset.left) < Math.abs(base.center.x - target.offset.right) ? target.offset.left : target.offset.right;
        const guideY = isTopPosition ? target.offset.bottom - 1 : target.offset.top;
        pushLine(guideList, base.center.x, guideY, guideEndX, guideY);
      }
      const start = isTopPosition ? "top" : "bottom";
      const end = isTopPosition ? "bottom" : "top";
      pushLine(rulerList, x, base.offset[start], x, target.offset[end]);
    }
  }
  // 再描画
  context.clearRect(0, 0, canvasWrapper.offsetWidth, canvasWrapper.offsetHeight);
  drawRuler();
  drawGuide();
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
  context.setLineDash([]);
  rulerList.forEach(function (ruler) {
    const isVertial = ruler.start.x === ruler.end.x ? true : false;
    drawLine(ruler.start.x, ruler.start.y, ruler.end.x, ruler.end.y, isVertial);
    const distance = isVertial ? Math.abs(ruler.start.y - ruler.end.y) : Math.abs(ruler.start.x - ruler.end.x);
    context.font = "12px sans-serif";
    context.fillText("" + distance, (isVertial ? ruler.start.x : (ruler.start.x + ruler.end.x) / 2) - window.scrollX, (isVertial ? (ruler.start.y + ruler.end.y) / 2 : ruler.start.y) - window.scrollY);
  });
}

function drawGuide() {
  context.setLineDash([3, 3]);
  guideList.forEach(function(guide) {
    drawLine(guide.start.x, guide.start.y, guide.end.x, guide.end.y);
  });
}

// 描画する際にscrollを考慮する(常にViewPortの左上を基準に描画する)
function drawLine(startX, startY, endX, endY, isVertial) {
  // 1pxの線がぼやけないように描画座標を0.5ずらす
  const extraX = isVertial ? 0.5 : 0;
  const extraY = isVertial ? 0 : 0.5;
  context.beginPath();
  context.moveTo(startX - window.scrollX + extraX, startY - window.scrollY + extraY);
  context.lineTo(endX - window.scrollX + extraX, endY - window.scrollY + extraY);
  context.stroke();
}