$(() => {

    // При нажатии "Поехали", открываем окно чата
    let nspGame;

    let startChat = new Promise((resolve, reject) => {
        $("body").on("click", ".modal__submit", function (e) {

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
            $(".modalChat").slideDown(function() {
                $(".modalChat__panelMes").focus();
//                // Устанавливаем cookie при поиске комнаты
//                document.cookie = "room=true";
            });
            
            $( this ).parents(".modal").slideUp();
            resolve(dataUser);
        });
    });


    startChat.then((dataUser) => {
        // Отсылаем сообщение пользователя при нажатии на энтер
        // Функция enterKey в view.js (поправить позднее)
        $("#chatArea").enterKey(function (e) {
            $("#sendChatMessage").trigger("click");
            e.preventDefault();
        });
        
        // Отсылаем сообщение пользователя при клике на блок
        $("body").on("click", ".modalChat__panelSub", function () {
            let userMsg = $(".modalChat__panelMes").val();
            
            // Происходит событие если в сообщении что-либо было
            if (userMsg != "") {
                nspGame.emit("send mess", userMsg);
            }
            
            // Чистим от прошлого сообщения
            $(".modalChat__panelMes").val("");
        });

        // Подключаемся
        nspGame.on("connectNewUser", (data) => {
            $(".modalChat__textMes").append(`
                <p class="modalChat__alert modalChat__alert_newUser">Подключился ${data.name}</p>
            `);
            setTimeout(() => {
                $(".modalChat__alert_newUser:last").slideUp(350, function() {
                    $( this ).detach();
                });
            }, 2000);
        });
        
        // Уходим
        nspGame.on("disconnectUser", (data) => {
            $(".modalChat__textMes").append(`
                <p class="modalChat__alert modalChat__alert_disconnectUser">Отключился ${data.name}</p>
            `);
            setTimeout(() => {
                $(".modalChat__alert_disconnectUser:last").slideUp(350, function() {
                    $( this ).detach();
                });
            }, 2000);
        });
        
        
        // Блок со всеми пользователями
        nspGame.on("usersOnRoom", (data) => {
            $(".usersBlock").empty();
            
            Object.keys(data.usersOnRoom).forEach((userId) => {
                let userName = data.usersOnRoom[userId];
                $(".usersBlock").append(`
                    <div class="usersBlock__item" title="${userName}">
                        <div class="usersBlock__photo">
                            <span class="icon-user"></span>
                        </div>
                    </div>
                `);
            });
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