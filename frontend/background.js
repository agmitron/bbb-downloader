const HOST = 'http://localhost:3000'

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.existed) {
    console.log(`Tab`)

    function modifyDOM() {
      //You can play with your DOM here or check URL against your regex
      console.log('Tab script:');
      console.log(document.body);
      return document.body.innerHTML;
    }

    //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
    chrome.tabs.executeScript({
      code: `
        console.log('existed?? ${message.existed}')
        const $available = document.getElementById('available');
        $available.innerHTML = ${message.existed};
      `
    });
  }
});

