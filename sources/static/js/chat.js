$(() => {

    // При нажатии "Поехали", открываем окно чата
    let nspGame;
    
    // 
    let escape = (string) => {
        
    }
    
    // Функция для проверки от xxs
    let protectedXXS = (string) => {
        let htmlEscapes = {
            '&': ' ',
            '<': ' ',
            '>': ' ',
            '"': ' ',
            "'": " "
        };

        return string.replace(/[&<>"']/g, (match) => {
            return htmlEscapes[match];
        });
    };

    let startChat = new Promise((resolve, reject) => {
        $("body").on("click", ".modal__submit", function () {

            let nick = $(".modal__input_name").val(),
                game = $(".modal__select").val(),
                usersAmount = $(".modal__usersMax:visible .modal__usersMax-item_active").data("amount");

            // Подписываем на пространство имен "чат"
            nspGame = io('/chat');

            // Информация с формы
            let dataUser = {
                name: nick,
                gameName: game,
                usersAmount: usersAmount
            };

            // Отсылаем имя и название игры
            nspGame.emit("getInfoByUser", dataUser);
            $(".modalChat").slideDown();
            $( this ).parents(".modal").slideUp();
            resolve(dataUser);
        });
    });


    startChat.then((dataUser) => {
        // Отсылаем сообщение пользователя
        $("body").on("click", ".modalChat__panelSub", function () {
            let userMsg = $(".modalChat__panelMes").val();
            
            // Происходит событие
            nspGame.emit("send mess", protectedXXS(userMsg) );
            // Чистим от прошлого сообщения
            $(".modalChat__panelMes").val("");
        });

        $("body").on("keydown", ".modalChat__panelSub", function (event) {
            window.test = event;
        });

        nspGame.on("connectNewUser", (data) => {
            $(".modalChat__textMes").append(`
        <p class="modalChat__alert modalChat__alert_newUser">Подключился ${data.name}</p>
      `);

            $(".usersBlock").append(`
            <div class="usersBlock__item" title="${data.name}">
                <div class="usersBlock__photo">
                    <span class="icon-user"></span>
                </div>
            </div>
        `);
        });

        nspGame.on("disconnectUser", (data) => {
            $(".modalChat__textMes").append(`
        <p class="modalChat__alert modalChat__alert_disconnectUser">Отключился ${data.name}</p>
      `);
        });

        nspGame.on("add mess", (data) => {
            $(".modalChat__textMes").append(`
        <p class="modalChat__item">
          <span class="modalChat__name">${data.name}</span>
          <span class="modalChat__msg">${data.msg}</span>
        </p>
      `);
        });

        nspGame.on("adminMsg", (data) => {
            $(".modalChat__textMes").append(`
        <p class="modalChat__item">
          <span class="modalChat__name">Администратор</span>
          <span class="modalChat__msg">${data.msg}</span>
        </p>
      `);
        });

        $(".modalChat__Title_game").text(dataUser["gameName"]);
    });

});