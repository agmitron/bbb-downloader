fetch(`http://localhost:3000/check?bbb_url=${window.location.href}`)
  .then(res => res.json())
  .then(({ result: existed }) => {
    chrome.runtime.sendMessage({ existed });
  })
  .catch(console.error)
