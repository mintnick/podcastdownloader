let url = "";

window.addEventListener("load", renderBtn, false);

function renderBtn(event) {
  const main = document.getElementsByTagName('main')[0];

  const btn = document.createElement('button');
  btn.textContent = "Download";

  if (main) {
    main.prepend(btn);
  }

  // get url
  const audio = document.getElementsByTagName('audio')[0];
  if (audio) {
    url = audio.getAttribute('src')
  }
}