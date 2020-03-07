
// popupからのメッセージを受信したとき
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log(message.isEnabled);
  if (message.isEnabled) {
    // canvas要素を追加する
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

        // Bの右辺位置がAの左辺位置より小さかったら左確定、逆および上下も同様
        // Bの右辺位置がAの左辺位置より大きかったら左辺との差で確定、逆も同様
        // ターゲットが上に位置する場合
        if (basePoint.top > targetPoint.bottom) {
          console.log(Math.abs(basePoint.top - targetPoint.bottom));
          // BaseとTargetは接触しないので、上への線のみ
        } else {
          console.log(basePoint.top - targetPoint.top > 0 ? basePoint.top - targetPoint.top : 0);
        }
        // ターゲットが下に位置する場合
        if (basePoint.bottom < targetPoint.top) {
          console.log(Math.abs(basePoint.bottom - targetPoint.top));
        } else {
          console.log(targetPoint.bottom - basePoint.bottom > 0 ? targetPoint.bottom - basePoint.bottom : 0);
        }
        // ターゲットが左に位置する場合
        if (basePoint.left > targetPoint.right) {
          console.log(Math.abs(basePoint.left - targetPoint.right));
        } else {
          console.log(basePoint.left - targetPoint.left > 0 ? basePoint.left - targetPoint.left : 0);
        }
        // ターゲットが右に位置する場合
        if (basePoint.right < targetPoint.left) {
          console.log(Math.abs(basePoint.right - targetPoint.left));
        } else {
          console.log(targetPoint.right - basePoint.right > 0 ? targetPoint.right - basePoint.right : 0);
        }
      }
    });
  });
}
