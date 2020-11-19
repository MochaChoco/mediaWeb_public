import css from '../css/pipWindow.css';

function SetPiP(dom){
  makeResizableDom(dom, 640, 360, 320, 180);        // 최소, 최대 크기 지정
  makeMoveableDom(dom);
}

export default SetPiP;

function makeResizableDom(dom, max_width, max_height, min_width, min_height) {      // PiPwindow 크기 조절 매핑
  const element = document.querySelector(dom);
  const resizers = document.querySelectorAll(dom + ' .resizer');
  let original_width = 0;                     // 초기 width
  let original_height = 0;                    // 초기 height
  let original_pos_x = 0;                     // 초기 window x좌표
  let original_pos_y = 0;                     // 초기 window y좌표
  let original_mouse_x = 0;                   // 초기 마우스 x좌표
  let original_mouse_y = 0;                   // 초기 마우스 y좌표

  for (let i = 0 ; i < resizers.length ; i++) {
    const currentResizer = resizers[i];
    currentResizer.addEventListener('mousedown', function(e) {
      e.preventDefault();
      original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
      original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
      original_pos_x = element.getBoundingClientRect().left;
      original_pos_y = element.getBoundingClientRect().top;
      original_mouse_x = e.clientX;
      original_mouse_y = e.clientY;
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    });

    function resize(e) {        // 여기서 크기 조절 처리
      if (currentResizer.classList.contains('top')) {         // 위쪽 드래그 했을 때 처리
        const height = original_height - (e.clientY - original_mouse_y);
        if (height >= min_height && height <= max_height) {
          element.style.height = height + 'px';
          element.style.top = original_pos_y + (e.clientY - original_mouse_y) + 'px';
        }
      }
      if (currentResizer.classList.contains('right')) {         // 오른쪽 드래그 했을 때 처리
        const width = original_width + (e.clientX - original_mouse_x)
        if (width >= min_width && width <= max_width) {
          element.style.width = width + 'px';
        }
      }
      if (currentResizer.classList.contains('bottom')) {         // 아래쪽 드래그 했을 때 처리
        const height = original_height + (e.clientY - original_mouse_y);
        if (height >= min_height && height <= max_height) {
          element.style.height = height + 'px';
        }
      }
      if (currentResizer.classList.contains('left')) {         // 왼쪽 드래그 했을 때 처리
        const width = original_width - (e.clientX - original_mouse_x)
        if (width >= min_width && width <= max_width) {
          element.style.width = width + 'px';
          element.style.left = original_pos_x + (e.clientX - original_mouse_x) + 'px';
        }
      }
      if (currentResizer.classList.contains('bottom-right')) {         // 우하단 드래그 했을 때 처리
        const width = original_width + (e.clientX - original_mouse_x);
        const height = original_height + (e.clientY - original_mouse_y)
        if (width >= min_width && width <= max_width) {
          element.style.width = width + 'px';
        }
        if (height >= min_height && height <= max_height) {
          element.style.height = height + 'px';
        }
      }
      else if (currentResizer.classList.contains('bottom-left')) {         // 좌하단 드래그 했을 때 처리
        const height = original_height + (e.clientY - original_mouse_y)
        const width = original_width - (e.clientX - original_mouse_x)
        if (height >= min_height && height <= max_height) {
          element.style.height = height + 'px';
        }
        if (width >= min_width && width <= max_width) {
          element.style.width = width + 'px';
          element.style.left = original_pos_x + (e.clientX - original_mouse_x) + 'px';
        }
      }
      else if (currentResizer.classList.contains('top-right')) {         // 우상단 드래그 했을 때 처리
        const width = original_width + (e.clientX - original_mouse_x)
        const height = original_height - (e.clientY - original_mouse_y)
        if (width >= min_width && width <= max_width) {
          element.style.width = width + 'px';
        }
        if (height >= min_height && height <= max_height) {
          element.style.height = height + 'px';
          element.style.top = original_pos_y + (e.clientY - original_mouse_y) + 'px';
        }
      }
      else if (currentResizer.classList.contains('top-left')){         // 좌상단 드래그 했을 때 처리
        const width = original_width - (e.clientX - original_mouse_x)
        const height = original_height - (e.clientY - original_mouse_y)
        if (width >= min_width && width <= max_width) {
          element.style.width = width + 'px';
          element.style.left = original_pos_x + (e.clientX - original_mouse_x) + 'px';
        }
        if (height >= min_height && height <= max_height) {
          element.style.height = height + 'px';
          element.style.top = original_pos_y + (e.clientY - original_mouse_y) + 'px';
        }
      }
    }

    function stopResize() {
      window.removeEventListener('mousemove', resize);
    }
  }
}

function makeMoveableDom(dom){                // PiPWindow 이동 처리 매핑
  const element = document.querySelector(dom);
  const mover = document.querySelector(dom + ' .mover');
  let original_mouse_x = 0, original_mouse_y = 0;
  let original_touch_x = 0, original_touch_y = 0;

  mover.addEventListener('mousedown', function(e) {
    e.preventDefault();
    original_mouse_x = e.offsetX;
    original_mouse_y = e.offsetY;
    window.addEventListener('mousemove', moveDom);
    window.addEventListener('mouseup', stopMove);

    function moveDom(e) {
      e.preventDefault();
      element.style.top = (e.clientY - original_mouse_y) + "px";
      element.style.left = (e.clientX - original_mouse_x) + "px";
    }

    function stopMove() {
      window.removeEventListener('mousemove', moveDom);
    }
  });

  mover.addEventListener('touchstart', function(e) {
    e.preventDefault();             // getBoundingClientRect()는 요소의 크기와 viewport를 기준으로 한 position을 반환한다.
    original_touch_x = e.touches[0].clientX - e.target.getBoundingClientRect().left;
    original_touch_y = e.touches[0].clientY - e.target.getBoundingClientRect().top;
    window.addEventListener('touchmove', moveDom);
    window.addEventListener('touchend', stopMove);

    function moveDom(e) {
      element.style.top = (e.touches[0].clientY - original_touch_y) + "px";
      element.style.left = (e.touches[0].clientX - original_touch_x) + "px";
    }

    function stopMove() {
      window.removeEventListener('touchmove', moveDom);
    }
  });
}
