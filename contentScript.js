
const canvas = $("<canvas>").attr("id", "DOM-Measure-Extension-Canvas");
const canvasWrapper = $("<div>").attr("id", "DOM-Measure-Extension-Canvas-Wrapper");
const context = canvas.get(0).getContext("2d");

// popupからのメッセージを受信したとき
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log(message.isEnabled);
  if (message.isEnabled) {
    // canvas要素を追加する
    $("body").prepend(canvasWrapper.append(canvas));
    canvas.attr({"width": canvasWrapper.width(), "height": canvasWrapper.height()});
    // クリック時のイベントハンドラを登録する
    activateEventListener();
  } else {
    // canvas要素を削除する
    // イベントハンドラを削除する
    $(window).off("click mouseenter");
  }
});

function activateEventListener() {
  $(window).on("click", function (clickEvent) {
    // クリックした座標から要素を取得する
    const $base = $(document.elementFromPoint(clickEvent.clientX, clickEvent.clientY));
    // 取得した要素の四辺の座標を取得する
    const basePoint = {
      top: $base.offset().top,
      right: $base.offset().left + $base.outerWidth(),
      bottom: $base.offset().top + $base.outerHeight(),
      left: $base.offset().left,
    };

    console.log("base", basePoint);

    $(window).on({
      mouseenter: function (hoverEvent) {
        // ホバーした要素の座標を取得する
        const $target = $(document.elementFromPoint(hoverEvent.clientX, hoverEvent.clientY));
        const targetPoint = {
          top: $target.offset().top,
          right: $target.offset().left + $target.outerWidth(),
          bottom: $target.offset().top + $target.outerHeight(),
          left: $target.offset().left,
        }

        console.log("target", targetPoint);

        const distance = {};
        // Bの右辺位置がAの左辺位置より小さかったら左確定、逆および上下も同様
        // Bの右辺位置がAの左辺位置より大きかったら左辺との差で確定、逆も同様
        // ターゲットが上に位置する場合
        if (basePoint.top > targetPoint.bottom) {
          distance.top = Math.abs(basePoint.top - targetPoint.bottom);
          // BaseとTargetは接触しないので、上への線のみ
          context.clearRect(0, 0, canvasWrapper.width(), canvasWrapper.height());
          const x = (basePoint.left + basePoint.right) / 2 - window.scrollX;
          const startY = basePoint.top - window.scrollY;
          const endY = targetPoint.bottom - window.scrollY;
          context.beginPath();
          context.moveTo(x, startY);
          context.lineTo(x, endY);
          context.closePath();
          context.stroke();
        } else {
          distance.top = basePoint.top - targetPoint.top > 0 ? basePoint.top - targetPoint.top : 0;
        }
        // ターゲットが下に位置する場合
        if (basePoint.bottom < targetPoint.top) {
          distance.bottom = Math.abs(basePoint.bottom - targetPoint.top);
        } else {
          distance.bottom = targetPoint.bottom - basePoint.bottom > 0 ? targetPoint.bottom - basePoint.bottom : 0;
        }
        // ターゲットが左に位置する場合
        if (basePoint.left > targetPoint.right) {
          distance.left = Math.abs(basePoint.left - targetPoint.right);
        } else {
          distance.left = basePoint.left - targetPoint.left > 0 ? basePoint.left - targetPoint.left : 0;
        }
        // ターゲットが右に位置する場合
        if (basePoint.right < targetPoint.left) {
          distance.right = Math.abs(basePoint.right - targetPoint.left);
        } else {
          distance.right = targetPoint.right - basePoint.right > 0 ? targetPoint.right - basePoint.right : 0;
        }
        console.log($target.get(0).tagName, distance);
      },
      mouseleave: function(hoverEvent) {
        context.clearRect(0, 0, canvasWrapper.width(), canvasWrapper.height());
      }
    });
  });

  $(window).on("scroll", function() {
    // 再描画する
  });
}
