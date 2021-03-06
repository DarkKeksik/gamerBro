$(document).ready(function () {
    
    // Подписываем на пространство имен "пользователи"
    let nspAllUsers = io('/allUsers');
    
    // Обновляем блок со всеми пользователями
    nspAllUsers.on("usersListUpdate", (data) => {        
        let usersList = [];
        $.each(data["usersList"], (item0)=> {
            let user = data["usersList"][item0]["allUsersNow"];
            usersList.push(user);
        });
        $(".s-preview__game_count").each(function(item1) {
            $( this ).text( usersList[item1] );
        });
    });
    
    
    // Плагин под нажатие клавиши на блоке
    $.fn.enterKey = function (fnc) {
        return this.each(function () {
            $(this).keypress(function (ev) {
                var keycode = (ev.keyCode ? ev.keyCode : ev.which);
                if (keycode == '13') {
                    fnc.call(this, ev);
                }
            })
        })
    }
    // При нажатии на энтер по элементу модального окна, подключаемся к комнате
    $(".modal__input").enterKey(function (e) {
        $("#findRoom").trigger("click");
        e.preventDefault();
        return false;
    });

    // Увеличение картинки
    $(".s-preview__wrapZoom").click(function () {
        let img = $(this).children(".fancybox");
        let src = img.attr('src');

        $("body").append(`
        <div class='popup'>
          <div class='popup_bg'></div>
          <img src='${src}' class='popup_img' />
        </div>`);

        $(".popup").fadeIn(200); // Медленно выводим изображение
        $(".popup_bg").click(function () {
            $(".popup").fadeOut(200);
            setTimeout(function () {
                $(".popup").remove();
            }, 200);
        });
    });
    
    

    // Блоки обработки событий
    $("body").on("click", "#minimizeChat", function () {
        modalChatIsShow = $(".modalChat").is(":visible");
        $(this).parents(".modalChat").slideUp(function () {
            if (modalChatIsShow) $(".popupB").animate({
                bottom: '25'
            }, "slow");
        });
    });

    
    $("body").on("mousedown", ".button__search", function () {
        let gameChecked = $(".modal__select option:checked").val();
        $(`.modal__usersMax[data-game]`).hide();
        $(`.modal__usersMax[data-game='${gameChecked}']`).show();
        $(".modal__input_name").val("");
        $(".modal").slideDown(function () {
            $(".modal__input_name").focus();
        });
    });
    
    // При нажатии на крестик, скрываем форму
    $( document ).on("click", ".modal__close", function () {
        $( this ).parents(".modal").hide();
    });
    
    // При нажатии на esc сворачиваем модальное окно
    $("body").on("keydown", function (event) {
        let checkEsc = event.keyCode == 27,
            modalChatIsShow = $(".modalChat").is(":visible");

        if (checkEsc) $(".modal, .modalChat").slideUp(function () {
            if (modalChatIsShow) $(".popupB").animate({
                bottom: '25'
            }, "slow");
        });
    });

    $("body").on("click", ".popupB", function () {
        $(this).animate({
            bottom: "-100"
        }, "slow");
        $(".modalChat .modal, .modalChat").slideDown();
    });

    $("body").on("change", ".modal__select", function () {
        let optionVal = $(".modal__select option:checked").val();
        $(".modal__usersMax").hide();
        $(`.modal__usersMax[data-game='${optionVal}']`).show();
    });

    // Логика при выборе кого искать (Команду или напарника)
    $("body").on("click", ".modal__usersMax-item", function () {
        let activeClass = "modal__usersMax-item_active";
        $(this).parent().children(".modal__usersMax-item").removeClass(activeClass);
        $(this).addClass(activeClass);
    });
    
    // Если игрок начинает искать новую команду и не вышел со старой
//    $( document ).on("click", ".modal .alert__button", function() {
//        let choise = $( this ).data("choice");
//        
//        if ( choise == "no" ) {
//            $(".modalChat").slideDown(function() {
//                $(".modal__input").val("");
//                $(".alert").parent().hide();
//                $(".modal").hide();
//            });
//        } else {
//            document.cookie = "room=true; max-age=0";
//        }
//    });


    // Логика при скроле
    $(document).on("scroll", function (event) {
        let positionScreen = $("html").scrollTop();

        // Меню
        if (positionScreen > 100) {
            $(".menu").addClass("menu__scroll");
            $(".menu__logo").addClass("menu__logo_scroll");
            $(".menu__item").addClass("menu__item_scroll");
        } else {
            $(".menu").removeClass("menu__scroll");
            $(".menu__logo").removeClass("menu__logo_scroll");
            $(".menu__item").removeClass("menu__item_scroll");
        }

        // На каком блоке сейчас пользователь
        if (positionScreen < 500) {
            $(".menu__item").removeClass("menu__item_active");
            $(".menu__item[data-href='about']").addClass("menu__item_active");
        } else if (positionScreen >= 500 && positionScreen < 1500) {
            $(".menu__item").removeClass("menu__item_active");
            $(".menu__item[data-href='beginFind']").addClass("menu__item_active");
        } else if (positionScreen >= 1500) {
            $(".menu__item").removeClass("menu__item_active");
            $(".menu__item[data-href='review']").addClass("menu__item_active");
        }

        // console.log(`Проверка ${positionScreen}`);
    });

    // Прокрутка до секции при клике
    $("body").on("click", ".menu__item, .nextSection", function () {
        let href = $(this).data("href");

        if (href == "about") {
            $('html').animate({
                scrollTop: 0
            }, 500);
        } else if (href == "beginFind") {
            $('html').animate({
                scrollTop: 908
            }, 500);
        } else if (href == "review") {
            $('html').animate({
                scrollTop: 1750
            }, 500);
        }
    });
    // Блок обработки событий, конец

    // При клике на "Доступные игры"
    $("body").on("click", ".s-preview__game_available", function () {
        let gameName = $( this ).children(".s-preview__game_val").text();
        let formSelect = $(`.modal .modal__select>option:contains(${gameName})`);
        
        $(`.modal .modal__select>option`).attr("selected", false);
        formSelect.attr("selected", true);

        $(`.modal__usersMax[data-game]`).hide();
        $(`.modal__usersMax[data-game='${gameName}']`).show();
        $(".modal__input:first").val("");
        $(".modal").slideDown(function() {
            $(".modal__input:first").focus();
        });

        let bgWay = "../static/img/bg/";
        let arrBG = {
            "Dota 2": `${bgWay}dota.jpg`,
            "CS Go": `${bgWay}CSGo.jpg`,
            "Lost Castle": `${bgWay}LostCastle.jpg`,
            "Castle Crashers": `${bgWay}castleCrashers.jpg`,
            "Magicka 2": `${bgWay}Magicka2.jpg`,
            "Borderlands 2": `${bgWay}Borderlands2.jpg`,
            "Portal 2": `${bgWay}portal2.jpg`,
        };
        $(".s-preview").css('background-image', 'url(' + arrBG[gameName] + ')');
    });
});