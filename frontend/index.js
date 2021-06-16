const HOST = 'http://localhost:3000'

const { head } = document
head.insertAdjacentHTML(`beforeend`, `
    <!-- Compiled and minified CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
`)


const html = `
  <!-- Modal Trigger -->
  <a class="waves-effect waves-light btn modal-trigger download-button" href="#downloadModal">Modal</a>

  <!-- Modal Structure -->
  <div id="downloadModal" class="modal">
    <div class="modal-content">
      <h4>Запись отсутствует</h4>
      <p>Вы можете поставить запись на обработку, чтобы подготовить запись вебинара. Это может занять несколько часов.</p>
      <a class="waves-effect waves-light btn" style="display: flex;">
        <i class="material-icons">attachment</i>
        Поставить на обработку
      </a>
    </div>
    <div class="modal-footer">
      <a href="#!" class="modal-close waves-effect waves-green btn-flat">Закрыть</a>
    </div>
  </div>

  <style>
    .download-button {
      position: absolute;
      z-index: 9999;
    }
  </style>
`

document.body.insertAdjacentHTML('afterbegin', html)

const elems = document.querySelectorAll('.modal');
const instances = M.Modal.init(elems, {
  onOpenStart() {
    fetch(`${HOST}/check?bbb_url=${window.location.href}`)
      .then(res => res.json())
      .then(({ result: existed, status }) => {
        const $downloadModal = document.getElementById('downloadModal')
        const $btn = $downloadModal.querySelector('a.btn')
        if (existed) {
          $downloadModal.querySelector('h4').innerText = 'Запись есть в системе'
          $downloadModal.querySelector('p').innerText = 'Вы можете скачать запись.'
          $btn.innerHTML = `
        <i class="material-icons">file_download</i>Скачать
      `
        } else if (status === 'PREPARING') {
          $downloadModal.querySelector('h4').innerText = 'Запись обрабатывается'
          $downloadModal.querySelector('p').innerText = 'Запись уже обрабатывается и скоро будет доступна для скачивания. Вернитесь сюда чуточку позже.'
          $btn.hidden = true;
        } else {
          $downloadModal.querySelector('h4').innerText = 'Записи пока нет в системе'
          $downloadModal.querySelector('p').innerText = 'Вы не можете скачать запись, поскольку её ещё пока нет в нашей базе. Вы можете поставить запись на обработку. Обработка занимает примерно столько же, сколько длится сам вебинар.'
          $btn.innerHTML = `
            <i class="material-icons">file_download</i>Поставить на обработку
          `
        }

        $btn.addEventListener('click', e => {
          e.preventDefault()
          fetch(`${HOST}?bbb_url=${window.location.href}`)
            .then(res => res.json())
            .then(console.log)
            .catch(console.error)
        })
      })
      .catch(console.error)

  }
});

console.log({ instances })

