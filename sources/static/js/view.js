$(document).ready(function () {
    // Блок функций

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
    // Блок функций, конец





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
        $(`.modal__usersMax[data-game`).hide();
        $(`.modal__usersMax[data-game='${gameChecked}']`).show();
        $(".modal").slideDown(function () {
            $(".modal__input_name").focus();
        });
    });

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
        $(".modal, .modalChat").slideDown();
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
        $(".modal").slideDown();

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

    const modalCloseButton = document.getElementById('modalClose');
    let modal = document.getElementsByClassName('modal')[0];

    if (modalCloseButton) {
        modalCloseButton.onclick = () => {
            modal.style.display = 'none';
        };
        startFindRoomAndDeleteModal(modal);
    }


    function startFindRoomAndDeleteModal(modal) {

        const startFindBtn = document.getElementById('findRoom');

        if (startFindBtn) {
            document.addEventListener('keypress', (event) => {
                const keyName = event.code;

                if (keyName === 'Enter') {
                    event.preventDefault();

                    startFindBtn.click();
                    modal.remove();
                }
            });

            return;
        }
    }

});