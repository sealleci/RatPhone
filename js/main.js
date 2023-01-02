let clock_timer = null;
let clock_intv = 2000;
let battery_timer = null;
let power_intv = 9000;
let signal_timer = null;
let signal_intv = 30000;
let text_timer = null;
let text_cnt = 0;
let cur_block = "A1";
let pre_date = null;
let lock_color = '#A7919F';
let chat_color = '#E6739F';
let msg_send_intv = 750;
let event_do_intv = 200;

function rangeRandom(a, b) {
    return Math.floor(Math.random() * (b - a + 1) + a);
}

function sleep(time) {
    return new Promise((resovle) => setTimeout(resovle, time));
}

function setRandomOperator() {
    let ops = ['中国电信', '中国联通', '中国移动'];
    document.querySelector('#operator').innerHTML = ops[rangeRandom(0, 2)];
}

function removeChildren(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.firstChild);
    }
}

function createCursor() {
    let cursor = document.createElement('span');
    cursor.id = 'input-cursor';
    return cursor;
}

let hanzi_arr = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function convertNumToHanzi(num) {
    if (num >= 0 && num <= 10) {
        return hanzi_arr[num];
    } else if (num <= 19) {
        return '十' + hanzi_arr[num % 10];
    } else if (num === 20) {
        return '二十';
    } else if (num <= 29) {
        return '廿' + hanzi_arr[num % 20];
    } else if (num === 30) {
        return '三十';
    } else if (num <= 31) {
        return '卅' + hanzi_arr[num % 30];
    } else {
        return '';
    }
}

function convertNumToXingqi(num) {
    if (num === 0) {
        return '日';
    } else {
        return convertNumToHanzi(num);
    }
}

function clockTick() {
    let date = new Date();
    let cur_h = date.getHours().toString().padStart(2, '0');
    let cur_m = date.getMinutes().toString().padStart(2, '0');
    document.querySelector('#cur-time').innerHTML =
        `${cur_h}:${cur_m}`;
    document.querySelector('#watch-time>span:nth-child(1)').textContent = cur_h;
    document.querySelector('#watch-time>span:nth-child(3)').textContent = cur_m;
    let cur_mon = convertNumToHanzi(date.getMonth() + 1);
    let cur_date = convertNumToHanzi(date.getDate());
    document.querySelector('#watch-date').textContent =
        `${cur_mon}月${cur_date}日周${convertNumToXingqi(date.getDay())}`;
    document.querySelector('#wth-date').textContent = `${date.getMonth() + 1}月${date.getDate()}日`;
    if (pre_date !== null) {
        if (pre_date.getMonth() !== date.getMonth() &&
            pre_date.getDate() !== date.getDate()) {
            updateWeather();
        }
    }
    pre_date = date;
}

function updateWatchBattery(val) {
    let txt = document.querySelector('#power-page-battery>span');
    let bg = document.querySelector('#power-page-battery-bg');
    txt.textContent = `${val}%`;
    bg.style.width = `${val / 100 * 60}px`;
}

function updateBattery(val) {
    let btry_val = document.querySelector('#battery-val');
    let btry_bg = document.querySelector('#battery-bg');
    btry_val.innerHTML = val;
    btry_bg.style.width = `${val / 100 * 24}px`;
    if (val <= 10) {
        btry_bg.style.backgroundColor = 'rgba(218,0,55,.6)';
    } else if (val <= 20) {
        btry_bg.style.backgroundColor = 'rgba(255,193,7,.6)';
    } else {
        btry_bg.style.backgroundColor = 'rgba(0, 0, 0, .25)';
    }
}

function powerTick() {
    let next_power = Math.max(0,
        parseInt(document.querySelector('#battery-val')
            .textContent) - 1);
    updateBattery(next_power);
    updateWatchBattery(next_power);
    if (next_power <= 0) {
        shutDownPhone();
    }
}

function signalTick() {
    let num = rangeRandom(0, 100);
    let strength;
    if (num >= 0 && num <= 5) {
        strength = 1;
    } else if (num <= 10) {
        strength = 2;
    } else if (num <= 25) {
        strength = 3;
    } else if (num <= 62) {
        strength = 4;
    } else {
        strength = 5;
    }
    for (let i = 1; i <= 5; ++i) {
        document.querySelector(`#signal > div:nth-child(${i})`).style.borderColor =
            i > strength ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.75)';
    }
}

function disapearDownBub() {
    let down_bub = document.querySelector('#down-bub');
    down_bub.style.display = 'none';
}

function showDownBub() {
    let chat_body = document.querySelector('#chat-body');
    if (Math.round(chat_body.scrollTop) < Math.round(chat_body.scrollHeight - chat_body.clientHeight * 2)) {
        let down_bub = document.querySelector('#down-bub');
        down_bub.style.display = 'block';
    } else {
        disapearDownBub();
    }
}

let chat_body_flex_time = 0.25;

function upChatBody() {
    let chat_body = document.querySelector('#chat-body');
    if (chat_body.scrollTop === 0) {
        chat_body.style.animation = `chat-body-up ${chat_body_flex_time}s ease-out 0s 1`;
    }
    sleep(chat_body_flex_time * 1000).then(function () {
        chat_body.style.animation = 'none';
    });
}

function downChatBody() {
    let chat_body = document.querySelector('#chat-body');
    // console.log(chat_body.scrollTop, chat_body.scrollHeight, chat_body.clientHeight);
    if (chat_body.clientHeight < chat_body.scrollHeight &&
        Math.round(chat_body.scrollTop + chat_body.clientHeight + 35) >= Math.round(chat_body.scrollHeight)) {
        chat_body.style.animation = `chat-body-down ${chat_body_flex_time}s ease-out 0s 1`;
        sleep(chat_body_flex_time * 1000).then(function () {
            chat_body.style.animation = 'none';
        });
    }
}

function clickDownBub() {
    let chat_body = document.querySelector('#chat-body');
    chat_body.scrollTop = chat_body.scrollHeight;
    disapearDownBub();
}

function initChatApp() {
    removeChildren(document.querySelector('#chat-body'));
    let input_box = document.querySelector('#input-box');
    removeChildren(input_box);
    input_box.append(createCursor());
    let opt_bar = document.querySelector('#opt-btn-bar');
    removeChildren(opt_bar);
    opt_bar.style.display = 'none';
    let tri_btn = document.querySelector('#btn-tri');
    tri_btn.style.transform = 'rotate(0deg)';
    tri_btn.style.left = '-5px';
}

function clickOptButton() {
    let opt_block = this.getAttribute('to');
    let input_box = document.querySelector('#input-box');
    let pre_box_h = input_box.clientHeight;
    removeChildren(input_box);
    let me_index = 0;
    for (let i = 0; i < dialogs[opt_block].length; ++i) {
        if (dialogs[opt_block][i].type === 1) {
            me_index = i;
            break;
        }
    }
    input_box.textContent = dialogs[opt_block][me_index].dialog;
    input_box.append(createCursor());
    if (dialogs[opt_block][me_index].dialog !== '') {
        let send_btn = document.querySelector('#send-btn');
        send_btn.classList.toggle('active-send-btn', !send_btn.classList.contains('send_btn.classList'));
        send_btn.setAttribute('to', opt_block);
    }
    let cur_pre_box_h = input_box.clientHeight;
    let chat_body = document.querySelector('#chat-body');
    chat_body.scrollTop = Math.min(chat_body.scrollTop + Math.abs(cur_pre_box_h - pre_box_h), chat_body.scrollHeight);
}

let global_text_speed = 1.0;
let text_intv = 60;
let read_mul = 2.4;
let think_intv = 350;

function getTextTime() {
    let read_time = 0;
    let tmp_text_cnt = text_cnt - 1;
    while (tmp_text_cnt >= 0) {
        if (dialogs[cur_block][tmp_text_cnt].type === 0 ||
            dialogs[cur_block][tmp_text_cnt].type === 1) {
            read_time = Math.floor(text_intv *
                dialogs[cur_block][tmp_text_cnt]
                    .dialog.length / read_mul);
            break;
        }
        tmp_text_cnt--;
    }

    switch (dialogs[cur_block][text_cnt].type) {
        case 0:
        case 1:
            return Math.floor(
                (read_time + think_intv +
                    text_intv * Math.max(dialogs[cur_block][text_cnt]
                        .dialog.length, 4)) / global_text_speed
            );
        case -1:
        case -2:
        case -3:
            return Math.floor(read_time / global_text_speed);
        default:
            return 0;
    }
}

function clickSendBtn() {
    if (this.classList.contains('active-send-btn')) {
        let opt_bar = document.querySelector('#opt-btn-bar');
        removeChildren(opt_bar);
        opt_bar.style.display = 'none';
        this.classList.toggle('active-send-btn');
        let input_box = document.querySelector('#input-box');
        removeChildren(input_box);
        input_box.append(createCursor());
        updateTreeNodeDisplay(document.querySelector(`#block-tree > div[block=${cur_block}]`));
        let tri_btn = document.querySelector('#btn-tri');
        tri_btn.style.transform = 'rotate(0deg)';
        tri_btn.style.left = '-5px';

        if (this.getAttribute('to') !== '') {
            cur_block = this.getAttribute('to');
            this.setAttribute('to', '');
            updateTreeNodeDisplay(document.querySelector(`#block-tree > div[block=${cur_block}]`));
            text_cnt = 0;
            text_timer = setTimeout(textTick, 0);
        }
    }
}

function justifyCurScrollTop(chat_body, el) {
    if (chat_body.clientHeight < chat_body.scrollHeight &&
        chat_body.scrollTop + chat_body.clientHeight + 35 >= chat_body.scrollHeight - el.offsetHeight) {
        chat_body.scrollTop = chat_body.scrollHeight;
    }
}

function createTimeRow() {
    let time_row = document.createElement('div');
    time_row.className = 'chat-time-row';
    let time = new Date();
    time_row.textContent = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
    let chat_body = document.querySelector('#chat-body');
    chat_body.append(time_row);
    justifyCurScrollTop(chat_body, time_row);
}

function textTick() {
    if (text_cnt >= dialogs[cur_block].length) {
        return;
    }

    function tickNext() {
        text_cnt++;
        if (text_cnt >= dialogs[cur_block].length) {
            createTimeRow();
            clearTimeout(text_timer);
            // text_cnt = 0;
        } else {
            text_timer = setTimeout(textTick, getTextTime());

        }
    }

    let chat_body = document.querySelector('#chat-body');
    switch (dialogs[cur_block][text_cnt].type) {
        case -1:
            let opt_bar = document.querySelector('#opt-btn-bar');
            removeChildren(opt_bar);
            for (let i = 0; i < dialogs[cur_block][text_cnt].opts.length; ++i) {
                let opt = document.createElement("div");
                opt.className = 'opt-btn';
                opt.textContent = dialogs[cur_block][text_cnt].opts[i].desc;
                opt.setAttribute("to", dialogs[cur_block][text_cnt].opts[i].to);
                opt.onclick = clickOptButton;
                opt_bar.append(opt);
            }
            opt_bar.style.display = 'flex';
            chat_body.scrollTop = Math.min(chat_body.scrollTop + opt_bar.clientHeight, chat_body.scrollHeight);
            let tri_btn = document.querySelector('#btn-tri');
            tri_btn.style.transform = 'rotate(-90deg)';
            tri_btn.style.left = '0';
            text_cnt++;
            if (text_cnt >= dialogs[cur_block].length) {
                createTimeRow();
                clearTimeout(text_timer);
                // text_cnt = 0;
            }
            break;
        case 0:
        case 1:
            let dialog_el = document.createElement("div");
            let cur_dialog = dialogs[cur_block][text_cnt].dialog;
            dialog_el.className = ['chat-line', dialogs[cur_block][text_cnt].type === 0 ? 'friend-chat' : 'me-chat'].join(' ');
            dialog_el.innerHTML = dialogs[cur_block][text_cnt].type === 0 ?
                ` 
            <div class="avatar">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="bub-body">${cur_dialog}</div>
            ` :
                `
            <div class="bub-body">${cur_dialog}</div>
            <div class="avatar"></div>
            `;
            chat_body.append(dialog_el);
            // console.log(chat_body.scrollTop + chat_body.clientHeight, chat_body.scrollHeight - dialog_el.offsetHeight)
            justifyCurScrollTop(chat_body, dialog_el);

            tickNext();
            break;
        case 3:
            dialogs[cur_block][text_cnt].messages.forEach((msg, i) => {
                sleep(msg_send_intv * (i + 1)).then(() => {
                    appendMsg(msg);
                });
            });

            tickNext();
            break;
        case -2:
            cur_block = dialogs[cur_block][text_cnt].to;
            text_cnt = 0;
            updateTreeNodeDisplay(document.querySelector(`#block-tree > div[block=${cur_block}]`));
            createTimeRow();
            text_timer = setTimeout(textTick, getTextTime());
            break;
        case -3:
            setTimeout(dialogs[cur_block][text_cnt].call, event_do_intv);
            tickNext();
            break;
        case -4:
            clearTimeout(text_timer);
            createTimeRow();
            let game_over_msg = document.createElement('div');
            game_over_msg.className = 'chat-time-row';
            game_over_msg.textContent = `${dialogs[cur_block][text_cnt].ending}`;
            setTimeout(() => {
                chat_body.append(game_over_msg);
            }, getTextTime());
            break;
        default:
            break;
    }
}

function handleScroll(e) {
    e = e || window.event;
    if (e.wheelDelta) { //先判断浏览器IE，谷歌滑轮事件
        if (e.wheelDelta > 0) { //当滑轮向上滚动时
            disapearDownBub();
            upChatBody();
        }
        if (e.wheelDelta < 0) { //当滑轮向下滚动时 
            showDownBub();
            downChatBody();
        }
    } else if (e.detail) { //Firefox滑轮事件 
        if (e.detail > 0) { //当滑轮向下滚动时 
            showDownBub();
            downChatBody();
        }
        if (e.detail < 0) { //当滑轮向上滚动时
            disapearDownBub();
            upChatBody();
        }
    }
}

function showTextSpeed(speed) {
    document.querySelector('#text-speed-show').textContent = parseFloat(speed).toFixed(1) + '倍';
}

function initTextSpeed(speed) {
    showTextSpeed(speed);
    document.querySelector('#text-speed').value = speed;
}

function changeTextSpeed() {
    showTextSpeed(this.value);
}

function changeTextIntv() {
    if (is_nopower || is_black_screen || is_lock || !is_phone_on) {
        this.value = global_text_speed;
        showTextSpeed(this.value);
        return;
    }
    global_text_speed = this.value;
    if (text_cnt < dialogs[cur_block].length) {
        clearTimeout(text_timer);
        text_timer = setTimeout(textTick, getTextTime());
    }
}

let main_page_switch_lock = false;

function clickWatchPrevBtn() {
    if (main_page_switch_lock) {
        return;
    }
    if (document.querySelector('#watch-main-page').style.display === 'none') {
        return;
    }
    let main_slide = document.querySelector('#watch-main-slide');
    let icon_num = document.querySelectorAll('#watch-main-slide>.icon-row').length;
    let next_l = parseInt(main_slide.style.left) + 125;

    if (next_l >= 125) {
        let pre_node = document.querySelector('#watch-main-slide>.icon-row:last-child');
        let new_node = pre_node.cloneNode(true);
        main_slide.prepend(new_node);
        main_slide.style.transition = 'none';
        main_slide.style.left = `${next_l - 125 * 2}px`;
        main_page_switch_lock = true;
        sleep(20).then(() => {
            main_slide.style.transition = 'left 0.25s';
            main_slide.style.left = `${next_l - 125}px`;
        })
        sleep(250).then(() => {
            main_slide.style.transition = 'none';
            main_slide.style.left = `${-(icon_num - 1) * 125}px`;
            main_slide.removeChild(main_slide.firstChild);
            main_page_switch_lock = false;
        })
    } else {
        main_slide.style.transition = 'left 0.25s';
        main_slide.style.left = `${next_l}px`;
    }
}

function clickWatchNextBtn() {
    if (main_page_switch_lock) {
        return;
    }
    if (document.querySelector('#watch-main-page').style.display === 'none') {
        return;
    }
    let main_slide = document.querySelector('#watch-main-slide');
    let icon_num = document.querySelectorAll('#watch-main-slide>.icon-row').length;
    let next_l = parseInt(main_slide.style.left) - 125;

    if (next_l <= -(icon_num) * 125) {
        let pre_node = document.querySelector('#watch-main-slide>.icon-row:first-child');
        let new_node = pre_node.cloneNode(true);
        main_slide.append(new_node);
        main_slide.style.transition = 'left 0.25s';
        main_slide.style.left = `${next_l}px`;
        main_page_switch_lock = true;
        sleep(250).then(() => {
            main_slide.style.transition = 'none';
            main_slide.style.left = '0px';
            main_slide.removeChild(main_slide.lastChild)
            main_page_switch_lock = false;
        })
    } else {
        main_slide.style.transition = 'left 0.25s';
        main_slide.style.left = `${next_l}px`;
    }
}

function clickWatchBackBtn() {
    let main_page = document.querySelector('#watch-main-page');
    for (let i of document.querySelectorAll('#watch>div')) {
        if (/^.+-page$/.test(i.id)) {
            if (i !== main_page) {
                if (i.style.display !== 'none') {
                    switch (i.id) {
                        case 'jump-page':
                            initJump();
                            break;
                        case 'music-page':
                            pauseMusic();
                            break;
                        case 'spt-page':
                            pauseRun();
                            break;
                        case 'msg-page':
                            clearNotRead();
                            break;
                        default:
                            break;
                    }
                    i.style.position = 'absolute';
                    i.style.animation = 'watch-page-out 0.2s ease-out 0s 1';
                    sleep(200).then(() => {
                        i.style.display = 'none';
                        i.style.position = 'relative';
                    })
                } else {
                    i.style.display = 'none';
                }
            } else {
                i.style.display = 'flex';
            }
        }
    }
}

function clickWatchIcon() {
    for (let i of document.querySelectorAll('#watch>div')) {
        if (/^.+-page$/.test(i.id)) {
            if (i.id !== this.getAttribute('data-page')) {
                i.style.display = 'none';
            } else {
                i.style.animation = 'watch-page-in 0.3s ease-out 0s 1';
                i.style.display = 'flex';
                switch (i.id) {
                    case 'msg-page':
                        clearNotRead();
                        break;
                    default:
                        break;
                }
            }
        }
    }
}

let is_power_still = true;
let watch_power_timer = null;
let watch_power_intv = 100;

function pressWatchPowerBtn() {
    is_power_still = true;

    function charge() {
        let new_val = Math.min(100,
            parseInt(document.querySelector('#battery-val')
                .textContent) + 1);
        updateBattery(new_val);
        updateWatchBattery(new_val);
        if (is_nopower) {
            if (new_val >= 20) {
                is_nopower = false;
                openPhone();
            }
        }
        if (is_power_still) {
            watch_power_timer = setTimeout(charge, watch_power_intv);
        }
    }

    watch_power_timer = setTimeout(charge, watch_power_intv);
}

function releaseWatchPowerBtn() {
    is_power_still = false;
}

let rat_rail_deg = 30;
let rat_pet_lock = false;
let pet_cnt = 0;

let jump_player = null;
let jump_stage = null;
let jump_street = null;
let is_jump = false;
let is_jump_start = false;
let jump_intv = 40;
let jump_game_timer = null;
let jump_jump_timer = null;
let jump_cur_score = 0;
let jump_high_score = 0;
let jump_max_speed = 11;
let jump_speed = jump_max_speed;
let jump_eclipse = 0;
let gen_obj_intv = 1.5;

function updateJumpCurScore(score) {
    jump_cur_score = score;
    document
        .querySelector('#jump-score>span:nth-child(1)')
        .textContent = score;
    if (jump_cur_score > jump_high_score) {
        jump_high_score = jump_cur_score;
        document
            .querySelector('#jump-score>span:nth-child(2)')
            .textContent = jump_high_score;
    }
}

function isJumpCollision(obj1, obj2) {
    return !(obj1.x >= obj2.x + obj2.w ||
        obj2.x >= obj1.x + obj1.w ||
        obj1.y + obj1.h <= obj2.y ||
        obj2.y + obj2.h <= obj1.y);
}

function checkJumpCollision() {
    let obj1 = {
        x: jump_player.offsetLeft + jump_player.clientLeft,
        y: jump_player.offsetTop + jump_player.clientTop,
        w: jump_player.clientWidth,
        h: jump_player.clientHeight
    };
    let objs = document.querySelectorAll('#jump-objs>.jump-obj');
    let res = false;
    for (let i = 0; i < objs.length; ++i) {
        let obj2 = {
            x: objs[i].offsetLeft,
            y: objs[i].offsetTop,
            w: objs[i].clientWidth,
            h: objs[i].clientHeight
        };
        if (isJumpCollision(obj1, obj2)) {
            res = true;
        }
    }
    return res;
}

function moveJumpBlock(obj) {
    obj.style.right = `${parseInt(obj.style.right) + 6}px`;
    if (obj.offsetLeft < -obj.clientWidth) {
        clearInterval(obj.timer);
        jump_street.removeChild(obj);
    } else {
        if (obj.offsetLeft + obj.clientWidth <= jump_player.offsetLeft + jump_player.clientLeft &&
            !obj.is_pass) {
            updateJumpCurScore(jump_cur_score + 1);
            obj.is_pass = true;
        }
    }
}

function genJumpBlock() {
    let obj = document.createElement('div');
    let obj2 = null;
    let obj3 = null;
    let r1 = rangeRandom(0, 40);
    let r2 = rangeRandom(0, 20);
    obj.className = 'jump-obj';
    obj.style.right = '15px';
    obj.is_pass = false;
    jump_street.append(obj);
    if (r1 >= 30) {
        obj2 = document.createElement('div');
        obj2.className = 'jump-obj';
        obj2.is_pass = true;
        obj2.style.right = '15px';
        obj2.style.bottom = `${obj.clientHeight}px`;
        jump_street.append(obj2);
        if (r2 > 10) {
            obj3 = document.createElement('div');
            obj3.className = 'jump-obj';
            obj3.is_pass = true;
            obj3.style.right = `${15 + obj.clientWidth}px`;
            obj3.style.bottom = '0px';
            jump_street.append(obj3);
        }
    }
    if (r1 >= 30 && r2 > 10 && obj3) {
        obj3.timer = setInterval(function () {
            moveJumpBlock(obj3);
        }, jump_intv);

    }
    if (r1 >= 30 && obj2) {
        obj2.timer = setInterval(function () {
            moveJumpBlock(obj2);
        }, jump_intv);
    }
    obj.timer = setInterval(function () {
        moveJumpBlock(obj);
    }, jump_intv);
}

function initJump() {
    is_jump_start = false;
    document.querySelectorAll('#jump-objs>.jump-obj').forEach((obj) => {
        clearInterval(obj.timer);
    });
    removeChildren(document.querySelector('#jump-objs'));
    clearInterval(jump_game_timer);
    clearInterval(jump_jump_timer);
    is_jump = false;
    updateJumpCurScore(0);
    jump_speed = jump_max_speed;
    jump_eclipse = 0;
    jump_player.style.bottom = '0px';
    document.querySelector('#jump-btn').textContent = '启';
    document.querySelector('#jump-bg').classList.remove('jump-bg-anm-stop');
    document.querySelector('#jump-bg').classList.remove('jump-bg-anm');
}

function deadJump() {
    is_jump_start = false;
    document.querySelectorAll('#jump-objs>.jump-obj').forEach((obj) => {
        clearInterval(obj.timer);
    });
    clearInterval(jump_game_timer);
    clearInterval(jump_jump_timer);
    document.querySelector('#jump-btn').textContent = '启';
    document.querySelector('#jump-bg').classList.add('jump-bg-anm-stop');
}

function clickJumpBtn() {
    if (!is_jump_start) {
        initJump();
        is_jump_start = true;
        jump_game_timer = setInterval(function () {
            if ((jump_eclipse + 40) % Math.floor(1000 / jump_intv * gen_obj_intv) === 0) {
                genJumpBlock();
            }
            jump_eclipse++;
            if (checkJumpCollision()) {
                deadJump();
            }
        }, jump_intv);
        document.querySelector('#jump-btn').textContent = '跳';
        document.querySelector('#jump-bg').classList.add('jump-bg-anm');
        return;
    }
    if (is_jump) {
        return;
    }
    is_jump = true;
    jump_jump_timer = setInterval(function () {
        // console.log(jump_player.offsetTop - jump_speed, jump_stage.offsetHeight - jump_player.offsetHeight);
        if (jump_player.offsetTop - jump_speed > jump_stage.offsetHeight - jump_player.offsetHeight) {
            jump_player.style.bottom = '0px';
            jump_speed = jump_max_speed;
            is_jump = false;
            clearInterval(jump_jump_timer);
        } else {
            jump_player.style.bottom = `${parseInt(jump_player.style.bottom) + jump_speed}px`;
            jump_speed--;
        }
    }, jump_intv);
}

function renderMsgSlide() {
    let msg_list = document.querySelector('#msg-list');
    let msg_up = document.querySelector('#msg-up');
    let msg_down = document.querySelector('#msg-down');
    let cur_top = parseInt(msg_list.style.top);
    msg_up.style.display = 'none';
    msg_down.style.display = 'none';
    if (cur_top < 0) {
        msg_up.style.display = 'flex';
    }
    if (cur_top - 125 > -msg_list.children.length * 125) {
        msg_down.style.display = 'flex';
    }
}

function clickMsgUp() {
    let msg_list = document.querySelector('#msg-list');
    let next_top = parseInt(msg_list.style.top) + 125;
    if (next_top > 125) {
        next_top = 0;
    }
    msg_list.style.top = `${next_top}px`;
    renderMsgSlide();
}

function clickMsgDown() {
    let msg_list = document.querySelector('#msg-list');
    let next_top = parseInt(msg_list.style.top) - 125;
    // msg_list.c
    if (next_top < -(msg_list.children.length - 1) * 125) {
        next_top = -(msg_list.children.length - 1) * 125;
    }
    msg_list.style.top = `${next_top}px`;
    renderMsgSlide();

}

function closeRatEyes() {
    document.querySelector('#pet-rat>div:nth-child(6)').style.display = 'none';
    document.querySelector('#pet-rat>div:nth-child(7)').style.display = 'none';
    document.querySelector('#pet-rat>div:nth-child(8)').style.display = 'block';
    document.querySelector('#pet-rat>div:nth-child(9)').style.display = 'block';
}

function openRatEyes() {
    document.querySelector('#pet-rat>div:nth-child(6)').style.display = 'block';
    document.querySelector('#pet-rat>div:nth-child(7)').style.display = 'block';
    document.querySelector('#pet-rat>div:nth-child(8)').style.display = 'none';
    document.querySelector('#pet-rat>div:nth-child(9)').style.display = 'none';
}

function shakeRatTail() {
    if (rat_pet_lock) {
        return;
    }
    rat_pet_lock = true;
    rat_rail_deg = rat_rail_deg ^ 30 ^ 60;
    document.querySelector('#pet-rat>div:nth-child(5)').style.transform = `rotate(${rat_rail_deg}deg)`;
    let heart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let heart_list = document.querySelector('#heart-list');

    heart.setAttribute('height', `24px`);
    heart.setAttribute('width', `24px`);
    heart.setAttribute('viewBox', '0 0 16 16');

    path.setAttribute('d', "M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z");
    heart.append(path);
    heart.timer = setTimeout(() => {
        heart_list.removeChild(heart);
    }, 300);
    heart_list.append(heart);
    pet_cnt++;
    document.querySelector('#pet-rat-cnt').textContent = pet_cnt.toString();
    sleep(100).then(() => {
        rat_pet_lock = false;
    });
}

function getMonNoonAvgTempRange(moon) {
    switch (moon) {
        case 1:
            return [2, 8];
        case 2:
            return [5, 11];
        case 3:
            return [11, 16];
        case 4:
            return [17, 23];
        case 5:
            return [22, 28];
        case 6:
            return [25, 31];
        case 7:
            return [27, 33];
        case 8:
            return [26, 32];
        case 9:
            return [23, 28];
        case 10:
            return [17, 23];
        case 11:
            return [12, 15];
        case 12:
            return [5, 9];
        default:
            return [25, 26];
    }
}

function getMonNightAvgTempRange(moon) {
    switch (moon) {
        case 1:
            return [-8, -2];
        case 2:
            return [-4, 0];
        case 3:
            return [-1, 5];
        case 4:
            return [6, 12];
        case 5:
            return [11, 16];
        case 6:
            return [15, 20];
        case 7:
            return [20, 24];
        case 8:
            return [18, 23];
        case 9:
            return [13, 19];
        case 10:
            return [7, 13];
        case 11:
            return [0, 6];
        case 12:
            return [-5, 1];
        default:
            return [20, 21];
    }
}

function randomWeatherTemps() {
    let noon_temp_node = document.querySelector('.wth-col:nth-child(1) .wth-temp');
    let night_temp_node = document.querySelector('.wth-col:nth-child(2) .wth-temp');
    let date = new Date();
    let moon = date.getMonth() + 1;
    let noon_temp_r = getMonNoonAvgTempRange(moon);
    let night_temp_r = getMonNightAvgTempRange(moon);
    let temp_noon = rangeRandom(noon_temp_r[0], noon_temp_r[1]);
    let temp_night = rangeRandom(night_temp_r[0], night_temp_r[1]);
    noon_temp_node.textContent = `${temp_noon}℃`;
    night_temp_node.textContent = `${temp_night}℃`;

}

function getWeatherIconRange(moon) {
    switch (moon) {
        case 1:
            return [0, 1, 2, 6, 7];
        case 2:
            return [0, 1, 2, 6, 7];
        case 3:
            return [0, 1, 2, 3];
        case 4:
            return [0, 1, 2, 3];
        case 5:
            return [0, 1, 2, 3];
        case 6:
            return [0, 1, 2, 3, 4, 5];
        case 7:
            return [0, 1, 2, 3, 4, 5];
        case 8:
            return [0, 1, 2, 3, 4, 5];
        case 9:
            return [0, 1, 2, 3, 5];
        case 10:
            return [0, 1, 2, 3, 5];
        case 11:
            return [0, 1, 2, 3, 5];
        case 12:
            return [0, 1, 2, 6, 7];
        default:
            return [0, 1, 2, 3, 4, 5, 6, 7];
    }
}

function showCertainWeatherToday(noon_i, night_i) {
    let noon_icons = document.querySelector('.wth-col:nth-child(1)>.wth-type-icon').children;
    let night_icons = document.querySelector('.wth-col:nth-child(2)>.wth-type-icon').children;
    for (let i = 0; i < noon_icons.length; ++i) {
        if (i !== noon_i) {
            noon_icons[i].style.display = 'none';
        } else {
            noon_icons[i].style.display = 'block';
        }
    }
    for (let i = 0; i < night_icons.length; ++i) {
        if (i !== night_i) {
            night_icons[i].style.display = 'none';
        } else {
            night_icons[i].style.display = 'block';
        }
    }
}

function randomWeatherToday() {
    let date = new Date();
    let icon_arr = getWeatherIconRange(date.getMonth() + 1);
    let noon_r = rangeRandom(0, icon_arr.length - 1);
    let night_r = rangeRandom(0, icon_arr.length - 1);
    let noon_icons = document.querySelector('.wth-col:nth-child(1)>.wth-type-icon').children;
    let night_icons = document.querySelector('.wth-col:nth-child(2)>.wth-type-icon').children;
    for (let i = 0; i < noon_icons.length; ++i) {
        if (i !== icon_arr[noon_r]) {
            noon_icons[i].style.display = 'none';
        } else {
            noon_icons[i].style.display = 'block';
        }
    }
    for (let i = 0; i < night_icons.length; ++i) {
        if (i !== icon_arr[night_r]) {
            night_icons[i].style.display = 'none';
        } else {
            night_icons[i].style.display = 'block';
        }
    }
}

function updateWeather() {
    randomWeatherTemps();
    randomWeatherToday();
}

let cur_music_index = 0;
let music_intv = 250;
let music_timer = null;
let cur_len = 0;
let music_play_state = 0;

function formatNumToTime(num) {
    return `${Math.floor(num / 60)
        .toString()
        .padStart(2, '0')}:${Math.floor(num % 60)
            .toString()
            .padStart(2, '0')}`;
}

function updateMusicCurLen(len) {
    cur_len = len;
    let cur_len_node = document.querySelector('#music-time-row>.music-time:nth-child(1)');
    cur_len_node.textContent = formatNumToTime(cur_len);
}

function switchMusicBtn(state) {
    let music_go_btn = document.querySelector('#music-go');
    let music_stop_btn = document.querySelector('#music-stop');
    switch (state) {
        case 0:
            music_go_btn.style.display = 'flex';
            music_stop_btn.style.display = 'none';
            break;
        case 1:
            music_go_btn.style.display = 'none';
            music_stop_btn.style.display = 'flex';
            break;
        default:
            break;
    }
}

function initMusicProg() {
    let music_prog = document.querySelector('#music-prog');
    let music_dot = document.querySelector('#music-dot');
    music_prog.style.width = '0px';
    music_dot.style.left = '0px';
}

function loadMusic(index) {
    pauseMusic();
    updateMusicCurLen(0);
    let title_node = document.querySelector('#music-title>span:nth-child(1)');
    let author_node = document.querySelector('#music-title>span:nth-child(2)');
    let len_node = document.querySelector('#music-time-row>.music-time:nth-child(2)');
    let prog_node = document.querySelector('#music-prog');
    title_node.textContent = musics[index].title;
    author_node.textContent = musics[index].author;
    len_node.textContent = formatNumToTime(musics[index].len);
    prog_node.style.backgroundColor = musics[index].color;
    initMusicProg();
}

function startMusic() {
    music_play_state = 1;
    switchMusicBtn(1);
    music_timer = setInterval(musicTick, music_intv);
}

function pauseMusic() {
    clearInterval(music_timer);
    switchMusicBtn(0);
    music_play_state = 0;
}

function musicTick() {
    updateMusicCurLen(Math.min(cur_len + 1, musics[cur_music_index].len));
    let music_slide = document.querySelector('#music-slide');
    let music_prog = document.querySelector('#music-prog');
    let music_dot = document.querySelector('#music-dot');
    let cur_width = Math.floor(cur_len / musics[cur_music_index].len * music_slide.clientWidth);
    music_prog.style.width = `${cur_width}px`;
    if (cur_width > 8) {
        music_dot.style.left = `${cur_width - 8}px`;
    }
    if (cur_len >= musics[cur_music_index].len) {
        pauseMusic();
    }
}

function clickMusicPlayBtn() {
    music_play_state ^= 1;
    if (music_play_state === 1) {
        if (cur_len === musics[cur_music_index].len) {
            updateMusicCurLen(0);
            initMusicProg();
        }
        startMusic();
    } else {
        pauseMusic();
    }
}

function clickMusicUpBtn() {
    cur_music_index = (cur_music_index - 1 + musics.length) % musics.length;
    loadMusic(cur_music_index);
}

function clickMusicDownBtn() {
    cur_music_index = (cur_music_index + 1 + musics.length) % musics.length;
    loadMusic(cur_music_index);
}

let shici_mask_list = [0];

function loadShici(index) {
    let title = document.querySelector('#shici-name');
    let dyn = document.querySelector('#shici-auth>span:nth-child(1)');
    let auth = document.querySelector('#shici-auth>span:nth-child(2)');
    let poem = document.querySelector('#shici-text');
    title.textContent = shici[index].title;
    dyn.textContent = shici[index].dynasty;
    auth.textContent = shici[index].author;
    removeChildren(poem);
    for (let i = 0; i < shici[index].sentences.length; ++i) {
        let sentence = document.createElement('div');
        sentence.className = 'shici-row';
        sentence.textContent = shici[index].sentences[i];
        poem.append(sentence);
    }
}

function clickShiciRandBtn() {
    let r_arr = [];
    for (let i = 0; i < shici.length; ++i) {
        if (shici_mask_list.indexOf(i) === -1) {
            r_arr.push(i);
        }
    }
    if (r_arr.length !== 0) {
        let r_num = rangeRandom(0, r_arr.length - 1);
        shici_mask_list.push(r_arr[r_num]);
        loadShici(r_arr[r_num]);
    }
    if (shici_mask_list.length >= shici.length) {
        shici_mask_list = [];
    }
}

let cur_run_bg_color = 'rgb(100,100,100)';
let run_colors = ['#39A2DB', '#8DE03A', '#39A2DB', '#DB69D2'];
let cur_run_color_index = 0;
let run_timer = null;
let run_intv = 25;
let run_speed = 0.0005;
let run_len = 0.0;
let run_cnt = 0;
let run_time = 0;
let run_btn_state = 0;
let run_prog_arc_len = 1.0;
let pre_deg = 0;

function updateRunLen(len) {
    run_len = len;
    let run_len_node = document.querySelector('#run-meter>span:nth-child(1)');
    run_len_node.textContent = run_len.toFixed(2);
}

function updateRunTime(time) {
    run_time = time;
    let run_time_node = document.querySelector('#run-time>span:nth-child(2)');
    run_time_node.textContent = formatNumToTime(run_time);
}


function runTick() {
    updateRunLen(run_len + run_speed);
    run_cnt++;
    if (run_cnt % Math.floor(1000 / run_intv) === 0) {
        updateRunTime(run_time + 1);
        run_cnt = 0;
    }
    let cur_deg = Math.floor(run_len / run_prog_arc_len * 360) % 360;
    let run_prog_color = document.querySelector('#run-prog-color');
    let run_dot = document.querySelector('#run-prog-color>.edge-cir:nth-child(2)');
    if (cur_deg < 180) {
        run_prog_color.style
            .backgroundImage = `linear-gradient(${-90 + cur_deg}deg, transparent 50%, ${cur_run_bg_color} 50%),
            linear-gradient(90deg, ${run_colors[cur_run_color_index]} 50%, transparent 50%)`;
    } else {
        run_prog_color.style
            .backgroundImage = `linear-gradient(${-90 + cur_deg - 180}deg, transparent 50%, ${run_colors[cur_run_color_index]} 50%),
            linear-gradient(90deg, ${run_colors[cur_run_color_index]} 50%, transparent 50%)`;
    }
    run_dot.style.transform = `rotate(${cur_deg}deg)`;
    if (Math.abs(pre_deg - cur_deg) > 180) {
        cur_run_bg_color = run_colors[cur_run_color_index];
        cur_run_color_index = (cur_run_color_index + 1) % run_colors.length;
        let run_prog = document.querySelector('#run-prog');
        run_prog.style.backgroundColor = cur_run_bg_color;
        let dot1 = document.querySelector('#run-prog-color>.edge-cir:nth-child(1)>div');
        let dot2 = document.querySelector('#run-prog-color>.edge-cir:nth-child(2)>div');
        dot1.style.backgroundColor = run_colors[cur_run_color_index];
        dot2.style.backgroundColor = run_colors[cur_run_color_index];
        run_prog_color.style
            .backgroundImage = `linear-gradient(-90deg, transparent 50%, ${cur_run_bg_color} 50%),
            linear-gradient(90deg, ${run_colors[cur_run_color_index]} 50%, transparent 50%)`;
    }
    pre_deg = cur_deg;
}

function startRun() {
    run_btn_state = 1;
    run_timer = setInterval(runTick, run_intv);
    let run_go = document.querySelector('#run-go');
    let run_stop = document.querySelector('#run-stop');
    run_go.style.display = 'none';
    run_stop.style.display = 'flex';
}

function pauseRun() {
    run_btn_state = 0;
    clearInterval(run_timer);
    let run_go = document.querySelector('#run-go');
    let run_stop = document.querySelector('#run-stop');
    run_go.style.display = 'flex';
    run_stop.style.display = 'none';
}

function clickRunBtn() {
    run_btn_state ^= 1;
    if (run_btn_state === 0) {
        pauseRun();
    } else {
        startRun();
    }
}

let is_opening = false;
let is_phone_on = false;
let is_nopower = false;
let is_lock = false;
let is_black_screen = true;
let cur_pwd_arr = [];

function shutDownPhone() {
    is_nopower = true;
    is_opening = false;
    is_phone_on = false;
    is_lock = false;
    is_black_screen = true;
    clearTimeout(text_timer);
    clearInterval(battery_timer);
    clearInterval(signal_timer);
    let phone_body = document.querySelector('#phone-body');
    phone_body.style.display = 'none';
    document.querySelector('#rat-os').style.display = 'none';
    document.querySelector('#black-screen').style.display = 'flex';
}

function debugOpenPhone() {
    is_opening = true;
    openPhoneSwitchScreen();
    unlockScreen();
}

function openPhoneSwitchScreen() {
    document.querySelector('#black-screen').style.display = 'none';
    lockScreen();
    battery_timer = setInterval(powerTick, power_intv);
    signal_timer = setInterval(signalTick, signal_intv);
    is_opening = false;
    is_phone_on = true;
}

function openPhone() {
    is_opening = true;
    sleep(600).then(() => {
        document.querySelector('#rat-os').style.display = 'flex';
    });
    sleep(3200).then(() => {
        document.querySelector('#rat-os').style.display = 'none';
        openPhoneSwitchScreen();
    });
}

function turnBlackScreen() {
    is_black_screen = true;
    is_lock = false;
    clearTimeout(text_timer);
    let phone_body = document.querySelector('#phone-body');
    phone_body.style.display = 'none';
    document.querySelector('#black-screen').style.display = 'flex';
}

function lockScreen() {
    is_black_screen = false;
    is_lock = true;
    clearTimeout(text_timer);
    let phone_body = document.querySelector('#phone-body');
    Array.from(phone_body.children).forEach((child) => {
        if (child.id === 'lock-screen' || child.id === 'info-header') {
            child.style.display = 'flex';
        } else {
            child.style.display = 'none';
        }
    });
    document.querySelector('#info-header').style.backgroundColor = lock_color;
    phone_body.style.display = 'flex';
}

function unlockScreen() {
    is_lock = false;
    cur_pwd_arr = [];
    updatePwdShow();
    document.querySelector(`#block-tree > div[block="${cur_block}"]`).classList.add('active-tree-node')
    document.querySelector('#lock-screen').style.display = 'none';
    document.querySelector('#chat-app').style.display = 'flex';
    document.querySelector('#btn-footer').style.display = 'flex';
    document.querySelector('#info-header').style.backgroundColor = chat_color;
    text_timer = setTimeout(textTick, getTextTime());
}

function checkPwd() {
    let cur_pwd = 0;
    for (let i = 0; i < cur_pwd_arr.length; ++i) {
        cur_pwd += cur_pwd_arr[i] * Math.round(Math.pow(10, cur_pwd_arr.length - i - 1));
    }
    return cur_pwd === Math.floor((Math.E - Math.floor(Math.E)) * 10000);
}

function updatePwdShow() {
    document.querySelectorAll('#lock-pwd-row>.lock-pwd-col')
        .forEach((pwd_node, i) => {
            pwd_node.classList.remove('lock-pwd-col-see');
            if (i < cur_pwd_arr.length) {
                pwd_node.classList.add('lock-pwd-col-see');
            }
        });
}

let is_clear_pwd = false;
let clear_single_intv = 80;

function clearPwdShow() {
    is_clear_pwd = true;
    cur_pwd_arr = [];
    document.querySelectorAll('#lock-pwd-row>.lock-pwd-col')
        .forEach((pwd_node, i) => {
            sleep(clear_single_intv * (4 - i)).then(() => {
                pwd_node.classList.remove('lock-pwd-col-see');
            })
        });
    sleep(clear_single_intv * 5).then(() => {
        is_clear_pwd = false;
    });
}

function clickNumKey(num) {
    if (cur_pwd_arr.length < 4) {
        cur_pwd_arr.push(num);
        updatePwdShow();
        if (cur_pwd_arr.length === 4) {
            if (checkPwd()) {
                unlockScreen();
            } else {
                clearPwdShow();
            }
        }
    }
}

function clickDelKey() {
    if (cur_pwd_arr.length > 0) {
        cur_pwd_arr.pop();
        updatePwdShow();
    }
}

function clickPwdKey() {
    if (is_clear_pwd) {
        return;
    }
    let cur_key = parseInt(this.getAttribute('data-key'));
    if (cur_key >= 0 && cur_key <= 9) {
        clickNumKey(cur_key);
    } else if (cur_key === -1) {
        clickDelKey();
    }
}

function openPwdEye() {
    let close_eye = document.querySelector('.lock-eye-col:nth-child(1)');
    let open_eye = document.querySelector('.lock-eye-col:nth-child(2)');
    close_eye.style.display = 'none';
    open_eye.style.display = 'flex';
    document.querySelectorAll('#lock-pwd-row>.lock-pwd-col')
        .forEach((pwd_node, i) => {
            if (pwd_node.classList.contains('lock-pwd-col-see')) {
                pwd_node.textContent = cur_pwd_arr[i];
            }
        });
}

function closePwdEye() {
    let close_eye = document.querySelector('.lock-eye-col:nth-child(1)');
    let open_eye = document.querySelector('.lock-eye-col:nth-child(2)');
    close_eye.style.display = 'flex';
    open_eye.style.display = 'none';
    document.querySelectorAll('#lock-pwd-row>.lock-pwd-col')
        .forEach((pwd_node) => {
            pwd_node.textContent = '';
        });
}

function clickSdiePhoneOnBtn() {
    if (is_opening) {
        return;
    }
    if (!is_nopower) { //有电
        if (!is_phone_on) { //没开机就开机
            openPhone();
        } else { //开了机
            if (is_black_screen) { //熄屏
                lockScreen();
            } else { //没熄屏
                if (!is_lock) { //没锁屏
                    turnBlackScreen();
                } else { //锁屏 
                    turnBlackScreen();
                }
            }
        }
    }
}

let cur_not_read_cnt = 0;
let is_msg_null = true;

function clearNotRead() {
    cur_not_read_cnt = 0;
    let msg_cnt_icon = document.querySelector('#msg-cnt');
    msg_cnt_icon.textContent = '';
    msg_cnt_icon.style.display = 'none';
}

function updateNotReadShow() {
    let msg_page = document.querySelector('#msg-page');
    if (msg_page.style.display !== 'none') { //信息页面被点开
        clearNotRead();
    } else {
        let msg_cnt_icon = document.querySelector('#msg-cnt');
        msg_cnt_icon.textContent = cur_not_read_cnt;
        if (cur_not_read_cnt > 0) {
            msg_cnt_icon.style.display = 'flex';
        } else {
            msg_cnt_icon.style.display = 'none';
        }
    }
}

function appendMsg(msg) {
    let date = new Date();
    let new_msg = document.createElement('div');
    new_msg.className = 'msg-row';
    new_msg.innerHTML = `
    <div class="msg-from">
        <span>${msg.from}</span>
        <span>${date.getHours()
            .toString()
            .padStart(2, '0')}:${date.getMinutes()
                .toString()
                .padStart(2, '0')
        }</span>
    </div>
    <div class="msg-text">${msg.text}</div>
    `;
    let msg_list = document.querySelector('#msg-list');
    if (is_msg_null) {
        is_msg_null = false;
        msg_list.removeChild(
            document.querySelector('#msg-null')
        );
    }
    let is_repeat = false;
    Array.from(msg_list.children).forEach((el) => {
        if (el.querySelector('.msg-text').textContent === msg.text &&
            el.querySelector('.msg-from>span:nth-child(1)').textContent === msg.from) {
            is_repeat = true;
        }
    });
    if (!is_repeat) {
        msg_list.append(new_msg);
        cur_not_read_cnt++;
        renderMsgSlide();
        updateNotReadShow();
    }

}

function loadMeSpeak(text) {
    document.querySelector('#rat-formula').style.display = 'none';
    let me_speak = document.querySelector('#me-speak');
    me_speak.textContent = text;
    me_speak.style.display = 'flex';
}

window.onload = function () {
    formatDialogs();
    formatShici();
    formatMusics();
    document.querySelector('#down-bub').onclick = clickDownBub;
    document.querySelector('#send-btn').onclick = clickSendBtn;
    let text_speed = document.querySelector('#text-speed');
    text_speed.oninput = changeTextSpeed;
    text_speed.onchange = changeTextIntv;
    text_speed.value = text_intv;
    initTextSpeed(global_text_speed);
    if (document.addEventListener) { //firefox 
        document.addEventListener('DOMMouseScroll', handleScroll, false);
    } else { //ie 谷歌 
        window.onmousewheel = document.onmousewheel = handleScroll;
    }
    let icons = document.querySelectorAll('#watch-main-slide .watch-icon');
    for (let i = 0; i < icons.length; ++i) {
        icons[i].onclick = clickWatchIcon;
    }
    document.querySelector('#main-page-l').onclick = clickWatchPrevBtn;
    document.querySelector('#main-page-r').onclick = clickWatchNextBtn;
    document.querySelectorAll('.lock-key-col').forEach((key_node) => {
        key_node.onclick = clickPwdKey;
    });
    document.querySelector('#lock-eye').onmouseover = openPwdEye;
    document.querySelector('#lock-eye').onmouseleave = closePwdEye;
    document.querySelector('#side-btn>div:nth-child(2)').onclick = clickSdiePhoneOnBtn;
    document.querySelector('#watch-back-btn').onclick = clickWatchBackBtn;
    document.querySelector('#power-page-btn').onmousedown = pressWatchPowerBtn;
    document.querySelector('#power-page-btn').onmouseup = releaseWatchPowerBtn;
    document.querySelector('#pet-rat').onmouseover = closeRatEyes;
    document.querySelector('#pet-rat').onmouseleave = openRatEyes;
    document.querySelector('#pet-rat').onmousemove = shakeRatTail;
    document.querySelector('#msg-up').onclick = clickMsgUp;
    document.querySelector('#msg-down').onclick = clickMsgDown;
    renderMsgSlide();
    document.querySelector('#music-play').onclick = clickMusicPlayBtn;
    document.querySelector('#music-prev').onclick = clickMusicUpBtn;
    document.querySelector('#music-next').onclick = clickMusicDownBtn;
    document.querySelector('#run-btn').onclick = clickRunBtn;
    document.querySelector('#shici-rand-btn').onclick = clickShiciRandBtn;
    jump_player = document.querySelector('#jump-player');
    jump_stage = document.querySelector('#jump-stage');
    jump_street = document.querySelector('#jump-objs');
    document.querySelector('#jump-btn').onmousedown = clickJumpBtn;
    setRandomOperator();
    clockTick();
    signalTick();
    genDocTree();
    updateWeather();
    loadShici(0);
    loadMusic(cur_music_index);
    clock_timer = setInterval(clockTick, clock_intv);
    // debugOpenPhone();
    console.log('password: ' + 7182);
    // battery_timer = setInterval(powerTick, power_intv);
    // signal_timer = setInterval(signalTick, signal_intv);
    // text_timer = setTimeout(textTick, getTextTime());
};

function cmpBlockNumStr(n1, n2) {
    let reg_let = /[a-zA-Z]+?/;
    let lett1 = reg_let.exec(n1)[0];
    let lett2 = reg_let.exec(n2)[0];
    if (lett1 < lett2) {
        return false;
    } else if (lett1 > lett2) {
        return true;
    }
    let reg_num = /[0-9-]+/;

    let arr1 = [];
    if (n1.search(reg_num) !== -1) {
        arr1 = reg_num.exec(n1)[0].split('-').map(x => parseInt(x));
    }
    let arr2 = [];
    if (n2.search(reg_num) !== -1) {
        arr2 = reg_num.exec(n2)[0].split('-').map(x => parseInt(x));
    }
    let min_len = Math.min(arr1.length, arr2.length);
    for (let i = 0; i < min_len; ++i) {
        if (arr1[i] < arr2[i]) {
            return false;
        } else if (arr1[i] > arr2[i]) {
            return true;
        }
    }
    return arr1.length >= arr2.length;
}

function sortDictByKey(dict) {
    let new_key = Object.keys(dict).sort(cmpBlockNumStr);
    // console.log(new_key)
    let new_dict = {};
    for (let i = 0; i < new_key.length; ++i) {
        new_dict[new_key[i]] = dict[new_key[i]];
    }
    return new_dict;
}

function updateTreeNodeDisplay(cur) {
    let nodes = document.querySelectorAll('#block-tree>div');
    for (let i = 0; i < nodes.length; ++i) {
        if (nodes[i] !== cur) {
            nodes[i].classList.remove('active-tree-node');
        }
    }
    cur.classList.add('active-tree-node');
}

function clickTreeNode() {
    if (is_nopower || is_black_screen || is_lock || !is_phone_on) {
        return;
    }
    cur_block = this.getAttribute('block');
    text_cnt = 0;
    initChatApp();
    clearTimeout(text_timer);
    initEventVars();
    text_timer = setTimeout(textTick, getTextTime());
    updateTreeNodeDisplay(this);
}

function genDocTree() {
    let tree = document.querySelector('#block-tree');
    removeChildren(tree);
    let reg_let = /[a-zA-Z]+?/;
    let reg_num = /[0-9-]+/;
    let arr = {};

    function addName(name) {
        let lett = reg_let.exec(name)[0];
        if (name.search(reg_num) !== -1) {
            let num = reg_num.exec(name)[0];
            let num_arr = num.split('-');
            let cur_arr = arr;
            for (let i = 0; i <= num_arr.length - 1; ++i) {
                let f_name = lett + num_arr.slice(0, i).join('-');
                if (!(f_name in cur_arr)) {
                    cur_arr[f_name] = { c: {} };
                }
                cur_arr = cur_arr[f_name].c;
            }

            if (!(name in cur_arr)) {
                cur_arr[name] = { c: {} };
            }

        } else {
            if (!(name in arr)) {
                arr[name] = { c: {} };
            }
        }

    }

    for (let i in dialogs) {
        addName(i);
    }

    function traveseTree(name, cur_node, step) {
        let is_has_opts = false;
        for (let i in dialogs[name]) {
            if (dialogs[name][i].type === -1) {
                is_has_opts = true;
                break;
            }
        }
        let tree_node = document.createElement('div');
        tree_node.className = `block${Math.min(step, 4)}`;
        tree_node.setAttribute('block', name);
        tree_node.innerHTML = `${name}${is_has_opts ? '<span class="tree-opt-sign"></span>' : ''}`;
        tree_node.onclick = clickTreeNode;
        tree.append(tree_node);
        if ("c" in cur_node && Object.keys(cur_node.c).length !== 0) {
            let sorted_dict = sortDictByKey(cur_node.c);
            // console.log(sorted_dict);
            for (let i in sorted_dict) {
                traveseTree(i, sorted_dict[i], step + 1);
            }
        }
    }

    arr = sortDictByKey(arr);
    for (let i in arr) {
        traveseTree(i, arr[i], 1);
    }
    // document.querySelector(`#block-tree>div[block="${cur_block}"]`).classList.toggle('active-tree-node')
}

function formatMusics() {
    musics.forEach((e, i) => {
        musics[i] = {
            title: e[0],
            author: e[1],
            len: e[2],
            color: e[3]
        }
    });
}

let musics = [
    ['耗子叫', '鼠鼠', 2, 'lightgray'],
    ['渔舟唱晚', '浦琦璋', 99, '#B97A95'],
    ['茉莉花', '宋祖英', 249, '#BCFFB9'],
    ['梁祝', '何占豪/陈钢', 183, '#A03C78'],
    ['秋水悠悠', '巫娜', 219, '#FFE194'],
    ['To Each His Own', 'Talos', 190, '#64C9CF'],
    ['东方红', '李有源', 241, '#F8485E'],
    ['青花瓷', '周杰伦', 239, '#53B8BB'],
    ['Autumn', 'Kozoro', 206, '#B05B3B'],
    ['月儿弯弯照九州', ' 朱晓琳', 229, '#FFC947'],
    ['云水逸', '张晓红', 212, '#E8F0F2'],
    ['春江花月夜', '王玽', 563, '#FF94CC'],
    ['With an Orchid', 'Yanni', 307, '#C490E4'],
    ['夏雨风荷', '王俊熊', 350, '#91C788'],
    ['心字成灰', '徒有琴', 319, '#F2B4B4'],
    ['为霜', '羽肿', 296, '#E4FBFF'],
    ['日不落', '蔡依林', 228, '#3D84B8'],
    ['بهت قول می‌دم',
        'محسن یگانه',
        285,
        '#81B214'
    ],
    ['梁间燕', '洪尘', 257, '#1A508B'],
    ['Unstoppable', 'Sia', 217, '#FFD56B'],
    ['WAP', 'Cardi B', 187, '#EE9595'],
    ['难忘今宵', '李谷一', 232, '#F8F1F1'],
    ['一条哈巴狗', '宝宝巴士', 87, '#FECD1A'],
    ['Never Gonna Give You Up', 'Rick Astley', 212, 'red']
];

function formatShici() {
    shici.forEach((e, i) => {
        shici[i] = {
            title: e[0],
            dynasty: e[1],
            author: e[2],
            sentences: e[3]
        }
    });
}

let shici = [
    ["赴戍登程口占示家人其二", '清', "林则徐", [
        '苟利国家生死以', '岂因祸福避趋之'
    ]],
    ["洛神赋", '东汉', "曹植", [
        '翩若惊鸿，婉若游龙', '荣曜秋菊，华茂春松'
    ]],
    ['兰亭集序', '东晋', '王羲之', [
        '固知一死生为虚诞', '齐彭殇为妄作'
    ]],
    ['滕王阁序', '唐', '王勃', [
        '落霞与孤鹜齐飞', '秋水共长天一色'
    ]],
    ['古步出夏门行', '汉', '佚名', [
        '白骨不覆，疫疠流行', '市朝易人，千载墓平'
    ]],
    ['蜀相', '唐', '杜甫', [
        '出师未捷身先死', '长使英雄泪满襟'
    ]],
    ['鹊桥仙', '北宋', '秦观', [
        '金风玉露一相逢', '便胜却人间无数'
    ]],
    ['江城子', '北宋', '苏轼', [
        '纵使相逢应不识', '尘满面，鬓如霜'
    ]],
    ['水龙吟', '南宋', '辛弃疾', [
        '可惜流年', '忧愁风雨', '树犹如此'
    ]],
    ['水龙吟', '南宋', '辛弃疾', [
        '千古兴亡', '百年悲笑', '一时登览'
    ]],
    ['虞美人', '五代', '李煜', [
        '问君能有几多愁', '恰似一江春水向东流'
    ]],
    ['菩萨蛮', '唐', '温庭筠', [
        '小山重叠金明灭', '鬓云欲度香腮雪'
    ]],
    ['渔家傲', '南宋', '李清照', [
        '九万里风鹏正举', '风休住', '蓬舟吹取三山去'
    ]],
    ['夏日绝句', '南宋', '李清照', [
        '生当作人杰', '死亦为鬼雄'
    ]],
    ['武陵春', '南宋', '李清照', [
        '物是人非事事休', '欲语泪先流'
    ]],
    ['青玉案', '南宋', '辛弃疾', [
        '凤箫声动，玉壶光转', '一夜鱼龙舞'
    ]],
    ['点绛唇', '南宋', '李清照', [
        '和羞走，倚门回首', '却把青梅嗅'
    ]],
    ['一剪梅', '南宋', '李清照', [
        '云中谁寄锦书来', '雁字回时，月满西楼'
    ]],
    ['声声慢', '南宋', '李清照', [
        '梧桐更兼细雨', '到黄昏、点点滴滴'
    ]],
    ['如梦令', '南宋', '李清照', [
        '知否？知否？', '应是绿肥红瘦'
    ]],
    ['醉花阴', '南宋', '李清照', [
        '莫道不销魂', '帘卷西风', '人比黄花瘦'
    ]],
    ['飞雪', '清', '乾隆', [
        '六片七片八九片', '飞入芦花都不见'
    ]],
    ['钗头凤', '南宋', '唐婉', [
        '角声寒，夜阑珊', '怕人寻问，咽泪装欢', '瞒、瞒、瞒'
    ]],
    ['钗头凤', '南宋', '陆游', [
        '桃花落，闲池阁', '山盟虽在，锦书难托', '莫、莫、莫'
    ]],
    ['茅屋为秋风所破歌', '唐', '杜甫', [
        '安得广厦千万间', '大庇天下寒士俱欢颜', '风雨不动安如山'
    ]],
    ['阁夜', '唐', '杜甫', [
        '五更鼓角声悲壮', '三峡星河影动摇'
    ]],
    ['戏为六绝句其二', '唐', '杜甫', [
        '尔曹身与名俱灭', '不废江河万古流'
    ]],
    ['卖炭翁', '唐', '白居易', [
        '可怜身上衣正单', '心忧炭贱愿天寒'
    ]],
    ['暮江吟', '唐', '白居易', [
        '一道残阳铺水中', '半江瑟瑟半江红'
    ]],
    ['把酒问月', '唐', '李白', [
        '古人今人若流水', '共看明月皆如此'
    ]],
    ['峨眉山月歌', '唐', '李白', [
        '峨眉山月半轮秋', '影入平羌江水流'
    ]],
    ['南歌子', '唐', '温庭筠', [
        '玲珑骰子安红豆', '入骨相思知不知'
    ]],
    ['春江花月夜', '唐', '张若虚', [
        '江畔何人初见月', '江月何年初照人'
    ]],
    ['长恨歌', '唐', '白居易', [
        '在天愿作比翼鸟', '在地愿为连理枝'
    ]],
    ['关山月', '唐', '李白', [
        '由来征战地', '不见有人还'
    ]],
    ['侠客行', '唐', '李白', [
        '事了拂衣去', '深藏身与名'
    ]],
    ['宣州谢朓楼饯别校书叔云', '唐', '李白', [
        '俱怀逸兴壮思飞', '欲上青天览明月'
    ]],
    ['忆秦娥', '现代', '毛泽东', [
        '雄关漫道真如铁', '而今迈步从头越'
    ]],
    ['行路难其一', '唐', '李白', [
        '长风破浪会有时', '直挂云帆济沧海'
    ]],
    ['满江红', '现代', '毛泽东', [
        '蚂蚁缘槐夸大国', '蚍蜉撼树谈何易'
    ]],
    ['沁园春', '现代', '毛泽东', [
        '山舞银蛇，原驰蜡象', '欲与天公试比高',
    ]],
    ['江城子', '北宋', '苏轼', [
        '会挽雕弓如满月', '西北望，射天狼',
    ]],
    ["春望", '唐', "杜甫", [
        '国破山河在', '城春草木深'
    ]],
    ["梦游天姥吟留别", '唐', "李白", [
        '安能摧眉折腰事权贵', '使我不得开心颜'
    ]],
    ["破阵子", '南宋', "辛弃疾", [
        '八百里分麾下炙', '五十弦翻塞外声', '沙场秋点兵'
    ]],
    ["蝶恋花", '北宋', "柳永", [
        '衣带渐宽终不悔', '为伊消得人憔悴'
    ]],
    ["大风歌", '西汉', "刘邦", [
        '大风起兮云飞扬', '威加海内兮归故乡', '安得猛士兮守四方'
    ]],
    ["琵琶行", '唐', "白居易", [
        '千呼万唤始出来', '犹抱琵琶半遮面'
    ]],
    ["阿房宫赋", '唐', "杜牧", [
        '奈何取之尽锱铢', '用之如泥沙'
    ]],
    ["将进酒", '唐', "李白", [
        '天生我材必有用', '千金散尽还复来'
    ]],
    ["观沧海", '东汉', "曹操", [
        '日月之行，若出其中', '星汉灿烂，若出其里'
    ]],
    ["浣溪沙", '北宋', "苏轼", [
        '谁道人生无再少', '门前流水尚能西', '休将白发唱黄鸡'
    ]],
    ["左迁至蓝关示侄孙湘", '唐', "韩愈", [
        '欲为圣明除弊事', '肯将衰朽惜残年'
    ]],
    ['酬乐天扬州初逢席上见赠', '唐', '刘禹锡', [
        '沉舟侧畔千帆过', '病树前头万木春'
    ]],
    ['水调歌头', '北宋', '苏轼', [
        '人有悲欢离合', '月有阴晴圆缺', '此事古难全'
    ]],
    ['赤壁赋', '北宋', '苏轼', [
        '寄蜉蝣于天地', '渺沧海之一粟'
    ]],
    ['蜀道难', '唐', '李白', [
        '扪参历井仰胁息', '以手抚膺坐长叹'
    ]],
    ['短歌行', '东汉', '曹操', [
        '对酒当歌，人生几何', '譬如朝露，去日苦多'
    ]],
    ['阳关曲', '北宋', '苏轼', [
        '暮云收尽溢清寒', '银汉无声转玉盘'
    ]],
    ['定风波', '北宋', '苏轼', [
        '竹杖芒鞋轻胜马', '谁怕', '一蓑烟雨任平生'
    ]],

    ['念奴娇', '北宋', '苏轼', [
        '人生如梦', '一尊还酹江月'
    ]],
    ["离骚", '战国', "屈原", [
        '长太息以掩涕兮', '哀民生之多艰'
    ]]
];

function formatDialogs() {
    let keys = Object.keys(dialogs);
    keys.forEach((key) => {
        dialogs[key].forEach((e, i) => {
            switch (e[0]) {
                case 0:
                case 1:
                    dialogs[key][i] = {
                        type: e[0],
                        dialog: e[1]
                    }
                    break;
                case 3:
                    dialogs[key][i] = {
                        type: e[0],
                        messages: e[2].map(x => ({
                            from: e[1],
                            text: x
                        }))
                    }
                    break;
                case -1:
                    dialogs[key][i] = {
                        type: e[0],
                        opts: e[1].map(x => ({
                            desc: x[0],
                            to: x[1]
                        }))
                    }
                    break;
                case -2:
                    dialogs[key][i] = {
                        type: e[0],
                        to: e[1]
                    }
                    break;
                case -3:
                    dialogs[key][i] = {
                        type: e[0],
                        call: e[1]
                    }
                    break;
                case -4:
                    dialogs[key][i] = {
                        type: e[0],
                        ending: e[1]
                    }
                    break;
            }
        })
    });
}

let pre_power_intv = power_intv;

function shrinkPowerIntv() {
    pre_power_intv = power_intv;
    power_intv >>= 4;
    clearInterval(battery_timer);
    battery_timer = setInterval(powerTick, power_intv);
}

function resumePowerIntv() {
    power_intv = pre_power_intv;
    clearInterval(battery_timer);
    battery_timer = setInterval(powerTick, power_intv);
}

function prolongText(time) {
    clearTimeout(text_timer);
    let sleep_time = Math.floor(time / global_text_speed);
    text_timer = setTimeout(textTick, sleep_time);
}

function changeShuoshuo(text) {
    document.querySelector('#friend-shuoshuo').textContent = text;
}

function initEventVars() {
    resumePowerIntv();
    pauseRun();
}

/* type== 0|1，为人物：0为耗子，1为我；[type, text]
 * type==3，为手表信息；[type, from, [text,]]
 * type==-1，为选项结点；[type, [[text, to],]]
 * type==-2，为直接跳转结点；[type, to]
 * type==-3，为特殊事件；[type, function]
 * type==-4，为结局；
 */
const dialogs = {
    "A": [
        [-2, 'A1']
    ],
    "A1": [
        [3, '大猫娱乐', ['+vx，找您有事']],
        [0, "不得不说"],
        [0, "今天可真热"],
        [1, "确实"],
        [0, "该吃雪糕啦"],
        [1, "好糕"],
        [0, "哎呀，怎么就剩一根了"],
        [1, "没准被老鼠偷吃了"],
        [0, "可恶的老鼠"],
        [0, "等等，我就是老鼠啊"],
        [1, "乐"],
        [0, "呜呜呜，我是个贪吃鼠"],
        [1, "把剩下的那根雪糕送我吧"],
        [0, "啊这"],
        [0, "我已经吃完了"],
        [1, "？"],
        [0, "还是草莓味的，我最爱吃"],
        [1, "肥死你"],
        [0, "已经升天了"],
        [1, "？"],
        [0, "我变成老鼠天使了"],
        [1, "越来越离谱"],
        [0, "不信？我给你拍张天堂的照片"],
        [0, "[图片]"],
        [1, "？"],
        [1, "先不论图片真假"],
        [1, "天堂有信号？"],
        [0, "呃啊"],
        [0, "是热点，我用的是热点"],
        [0, "对了，你知道热点的反义词是什么吗"],
        [-1, [
            ["反义词是老鼠", "A1-1"],
            ["反义词是冷面", "A1-2"]
        ]]
    ],
    "A1-1": [
        [1, "反义词就是你这只老鼠"],
        [0, "哈哈哈"],
        [0, "猜的好"],
        [0, "其实答案是冷面"],
        [1, "？？"],
        [1, "我的母语是无语"],
        [0, "吱吱"],
        [-2, "A2"]
    ],
    "A1-2": [
        [1, "冷面。"],
        [0, "我去"],
        [0, "你咋知道是冷面"],
        [1, "别整烂活了，鼠哥"],
        [0, "呃啊"],
        [-2, "A2"]
    ],
    'A2': [
        [0, "好吧"],
        [0, "我还没变成天使"],
        [1, "嗯嗯"],
        [0, "其实我是超级大鼠！"]
    ]
};