window.addEventListener("load", renderBtn, false);

function renderBtn(e) {
  const header = document.getElementsByTagName('header')[0];

  // create button
  const btn = document.createElement('button');
  btn.id = "pod-dl";
  btn.textContent = "下载音频";
  
  if (header) header.prepend(btn);
  
  // get url
  const audio = document.getElementsByTagName('audio')[0];
  const url = audio.getAttribute('src')

  // get names
  let name = document.getElementsByTagName('head')[0].querySelector('title').textContent;
  name = name.split('|')[0]
  const filename = name.split(' - ')[1].replace(/\s/g, '') + ' - ' + name.split(' - ')[0]

  // send msg
  btn.addEventListener("click", (async() => {
    chrome.runtime.sendMessage({message: "download", url: url, filename: filename});
  }));
}