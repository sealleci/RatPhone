// TODO: 参照Telegram风格修改聊天界面的样式
// TODO: 聊天方式可以是自动弹出和手动按钮
// TODO: 增加好友列表页面，增加群组聊天
// TODO: 聊天可以添加Reaction
// TODO: 可以发Emoji表情
// TODO: 更改手表的样式，从圆形变成长方形，增大手表的触屏面积
// TODO: 支持本地化
// TODO: 适配移动端，包括响应式布局和输入动作
// TODO: BEM风格的CSS变量名？

import { sleep, rangeRandom, padLeft, removeChildren } from './util.js'

class BlockTree {

}

class Watch {

}

interface WatchApp {

}

class BatteryApp implements WatchApp {

}

class ClockApp implements WatchApp {
    private static HANZI_NUMBERS: readonly string[]

    constructor() {
        ClockApp.HANZI_NUMBERS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    }

    static convertNumToHanzi(num: number): string {
        if (num >= 0 && num <= 10) {
            return ClockApp.HANZI_NUMBERS[num];
        } else if (num <= 19) {
            return '十' + ClockApp.HANZI_NUMBERS[num % 10];
        } else if (num === 20) {
            return '二十';
        } else if (num <= 29) {
            return '廿' + ClockApp.HANZI_NUMBERS[num % 20];
        } else if (num === 30) {
            return '三十';
        } else if (num <= 31) {
            return '卅' + ClockApp.HANZI_NUMBERS[num % 30];
        } else {
            return '';
        }
    }

    static convertNumToXingqi(num: number): string {
        if (num === 0) {
            return '日';
        } else {
            return ClockApp.convertNumToHanzi(num);
        }
    }
    tick() {
        // TODO: 手机和手表的时钟应该分开，天气的随日期更换功能应该自己实现
        const date = new Date();
        const cur_h = padLeft(date.getHours().toString(), 2, '0');
        const cur_m = padLeft(date.getMinutes().toString(), 2, '0');
        const cur_mon = ClockApp.convertNumToHanzi(date.getMonth() + 1);
        const cur_date = ClockApp.convertNumToHanzi(date.getDate());

        document.querySelector('#cur-time')!.innerHTML = `${cur_h}:${cur_m}`;
        document.querySelector('#watch-time>span:nth-child(1)')!.textContent = cur_h;
        document.querySelector('#watch-time>span:nth-child(3)')!.textContent = cur_m;
        document.querySelector('#watch-date')!.textContent =
            `${cur_mon}月${cur_date}日周${ClockApp.convertNumToXingqi(date.getDay())}`;
        document.querySelector('#wth-date')!.textContent = `${date.getMonth() + 1}月${date.getDate()}日`;
        // if (this.pre_date !== null) {
        //     if (this.pre_date.getMonth() !== date.getMonth() &&
        //         this.pre_date.getDate() !== date.getDate()) {
        //         updateWeather();
        //     }
        // }
    }
}

type JumpGameObject = {
    x: number
    y: number
    w: number
    h: number
}

class JumpGameApp implements WatchApp {
    private jump_player: HTMLElement
    private jump_stage: HTMLElement
    private jump_street: HTMLElement
    private is_jump: boolean
    private is_jump_start: boolean
    private jump_intv: number
    private jump_game_timer: number | undefined
    private jump_jump_timer: number | undefined
    private jump_cur_score: number
    private jump_high_score: number
    private jump_max_speed: number
    private jump_speed: number
    private jump_eclipse: number
    private gen_obj_intv: number

    constructor() {
        this.jump_player = document.querySelector('#jump-player')!
        this.jump_stage = document.querySelector('#jump-stage')!
        this.jump_street = document.querySelector('#jump-objs')!
        this.is_jump = false
        this.is_jump_start = false
        this.jump_intv = 40
        this.jump_game_timer = undefined
        this.jump_jump_timer = undefined
        this.jump_cur_score = 0
        this.jump_high_score = 0
        this.jump_max_speed = 11
        this.jump_speed = this.jump_max_speed
        this.jump_eclipse = 0
        this.gen_obj_intv = 1.5
    }

    updateJumpCurScore(score: number) {
        this.jump_cur_score = score
        document.querySelector('#jump-score>span:nth-child(1)')!.textContent = score.toString()
        if (this.jump_cur_score > this.jump_high_score) {
            this.jump_high_score = this.jump_cur_score;
            document.querySelector('#jump-score>span:nth-child(2)')!.textContent = this.jump_high_score.toString();
        }
    }

    static isJumpCollision(obj1: JumpGameObject, obj2: JumpGameObject): boolean {
        return !(obj1.x >= obj2.x + obj2.w ||
            obj2.x >= obj1.x + obj1.w ||
            obj1.y + obj1.h <= obj2.y ||
            obj2.y + obj2.h <= obj1.y)
    }

    checkJumpCollision(): boolean {
        let obj_player: JumpGameObject = {
            x: this.jump_player.offsetLeft + this.jump_player.clientLeft,
            y: this.jump_player.offsetTop + this.jump_player.clientTop,
            w: this.jump_player.clientWidth,
            h: this.jump_player.clientHeight
        }
        let objs = document.querySelectorAll('#jump-objs>.jump-obj') as NodeListOf<HTMLElement>
        let result = false
        for (let i = 0; i < objs.length; ++i) {
            let obj_block: JumpGameObject = {
                x: objs[i].offsetLeft,
                y: objs[i].offsetTop,
                w: objs[i].clientWidth,
                h: objs[i].clientHeight
            }
            if (JumpGameApp.isJumpCollision(obj_player, obj_block)) {
                result = true
            }
        }
        return result
    }
}

class Phone {

}

class Battery {

}

class Game {
    constructor() {
    }
    init() {

    }
    tick() {

    }
}

const game = new Game()

// Entrance.
document.addEventListener('DOMContentLoaded', async () => {
    game.init()
})