const BASE_URL = "https://dummyjson.com/posts"; // Đề bài chỉ yêu cầu lấy bài viết nên sử dụng luôn /posts

const $ = document.querySelector.bind(document);
const overlay = $(".overlay");
const modal = $(".modal");
const close = $(".close");
const postList = $(".post-list");
const inputEl = $(".search");
let debounce;

//Tính chiều rộng thanh cuộn trình duyệt
const calcScrollBar = () => {
  const outer = document.createElement("div");
  outer.style.overflow = "scroll";
  document.body.append(outer);

  const inner = document.createElement("div");
  outer.append(inner);

  const outerWidth = outer.offsetWidth;
  const innerWidth = inner.clientWidth;
  const scrollBarWidth = outerWidth - innerWidth;
  outer.remove();

  return scrollBarWidth;
}

//Contructor Modal Dialog
function Modal(modal, closeEl, overlay) {
  this.modal = modal;
  this.closeEl = closeEl;
  this.overlay = overlay;

  this.open = function () {
    this.modal.classList.remove("hidden");
    this.closeEl.classList.replace("hidden", "flex");
    this.overlay.classList.remove("hidden");
    document.body.style.paddingRight = `${calcScrollBar()}px`;
    document.body.classList.add("overflow-hidden");
  };
  this.close = function () {
    this.modal.classList.add("hidden");
    this.closeEl.classList.replace("flex", "hidden");
    this.overlay.classList.add("hidden");
    $(".modal-title").innerHTML = "";
    $(".modal-body").innerHTML = "Loading...";
    $(".modal-body").classList.replace("text-left", "text-center");
    document.body.style.paddingRight = `0px`;
    document.body.classList.remove("overflow-hidden");
  };
  this.displayContent = function (title, body) {
    $(".modal-title").innerHTML = title;
    $(".modal-body").classList.replace("text-center", "text-left");
    $(".modal-body").innerHTML = body;
  };
}

const modalDialog = new Modal(modal, close, overlay);
//Chống XSS
const escapeHTML = (value) => {
  const div = document.createElement("div");
  const text = document.createTextNode(value);
  div.append(text);
  return div.innerHTML;
};

//Xử lý lấy dữ liệu chung
const getDatas = async (endpoint) => {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error("No data found"); //Kiểm tra trước khi dùng res.json
    const datas = await res.json();
    if(datas.posts) {
      if (!datas.posts.length) {
        const error = new Error("No matching posts found");
        error.name = "Sorry";
        throw error;
      }
    }
    return datas;
  } catch (error) {
    throw error;
  }
};

//Render
const render = (datas) => {
  const html = datas.posts
    .map(
      ({ title, body, id }) => `
      <li class="post-list-item" data-id=${escapeHTML(id)}>
        <h2 class="mb-3 text-xl font-bold">${escapeHTML(title)}</h2>
        <p class="font-[400] mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
          ${escapeHTML(body)}
        </p>
        <div class="controls flex justify-between">
          <div class="detail btn rounded-3xl">Xem chi tiết</div>
          <div class="edit flex gap-2">
            <div class="fix font-bold cursor-pointer">Sửa</div>
            <div class="delete font-bold text-red-400 cursor-pointer">Xóa</div>
          </div>
        </div>
      </li>  
    `
    )
    .join("");
  postList.innerHTML = html;
};

document.addEventListener("DOMContentLoaded", async (e) => {
  try {
    postList.innerHTML = "Loading..."; //Hiển thị 1 thông báo chờ cho người dùng khi data chưa gửi từ server về
    const datas = await getDatas("");
    render(datas);
  } catch (error) {
    if (error instanceof TypeError) { //kiểm tra lỗi mạng
      error.name = "Sorry";
      error.message = "An error has occurred";
    }
    postList.innerHTML = escapeHTML(error);
  }
});

//Xử lý các sự kiện click
document.addEventListener("click", async (e) => {
  try {
    if (e.target.matches(".detail")) {
      const idPost = e.target.closest(".post-list-item").dataset.id;
      modalDialog.open();
      const { title, body } = await getDatas(`/${idPost}`);
      modalDialog.displayContent(title, body);
    }
    if (e.target.closest(".close") || e.target.matches(".overlay")) {
      modalDialog.close();
    }
    if(e.target.closest(".header-controls")) {
      $(".header-controls").querySelectorAll(".btn").forEach(btn => btn.classList.remove("active"));
    }

    if (e.target.matches(".oldest")) {
      $(".oldest").classList.add("active");
      const datas = await getDatas(`?sortBy=id&order=asc`);
      render(datas);
    }
    if (e.target.matches(".latest")) {
      $(".latest").classList.add("active");
      const datas = await getDatas(`?sortBy=id&order=desc`);
      render(datas);
    }
  } catch(error) {
    if(error instanceof TypeError) {
      error.name = "Sorry";
      error.message = "An error has occurred";
    }
    postList.innerHTML = escapeHTML(error);
  }
});

//Xử lý sự kiện search
inputEl.addEventListener("input", (e) => {
  $(".header-controls").querySelectorAll(".btn").forEach(btn => btn.classList.remove("active"));
  clearTimeout(debounce); // Thực hiện lấy dữ liệu sau 1 khoảng thời gian, tránh giật lag
  debounce = setTimeout(async () => {
    try {
    let inputValue = inputEl.value.trim();
    const datas = await getDatas(`/search?q=${inputValue}`);
    render(datas);
  } catch (error) {
    if (error instanceof TypeError) {
      error.name = "Sorry";
      error.message = "An error has occurred";
    }
    postList.innerHTML = escapeHTML(error);
  }
  }, 400)
})

