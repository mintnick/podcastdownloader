let url = "";
let filename = "";

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

  // get names
  const header = document.getElementsByTagName('head')[0];
  let name = header.querySelector('title').textContent;
  name = name.split('|')[0]
  filename = name.split(' - ')[1].replace(/\s/g, '') + ' - ' + name.split(' - ')[0]

  // send msg
  btn.addEventListener("click", (async() => {
    chrome.runtime.sendMessage({message: "download", url: url, filename: filename});
  }));
}