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
        ClockApp.HANZI_NUMBERS =
            ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    }

    static convertNumToHanzi(num: number): string {
        if (num >= 0 && num <= 10) {
            return ClockApp.HANZI_NUMBERS[num];
        } else if (num <= 19) {
            return '十' + ClockApp.HANZI_NUMBERS[num % 10]
        } else if (num === 20) {
            return '二十';
        } else if (num <= 29) {
            return '廿' + ClockApp.HANZI_NUMBERS[num % 20]
        } else if (num === 30) {
            return '三十';
        } else if (num <= 31) {
            return '卅' + ClockApp.HANZI_NUMBERS[num % 30]
        } else {
            return ''
        }
    }

    static convertNumToXingqi(num: number): string {
        if (num === 0) {
            return '日'
        } else {
            return ClockApp.convertNumToHanzi(num)
        }
    }
    tick() {
        // TODO: 手机和手表的时钟应该分开，天气的随日期更换功能应该自己实现
        const date = new Date()
        const cur_h = padLeft(date.getHours().toString(), 2, '0')
        const cur_m = padLeft(date.getMinutes().toString(), 2, '0')
        const cur_mon = ClockApp.convertNumToHanzi(date.getMonth() + 1)
        const cur_date = ClockApp.convertNumToHanzi(date.getDate())

        document.querySelector('#cur-time')!.innerHTML = `${cur_h}:${cur_m}`
        document.querySelector('#watch-time>span:nth-child(1)')!.textContent = cur_h
        document.querySelector('#watch-time>span:nth-child(3)')!.textContent = cur_m
        document.querySelector('#watch-date')!.textContent =
            `${cur_mon}月${cur_date}日周${ClockApp.convertNumToXingqi(date.getDay())}`
        document.querySelector('#wth-date')!.textContent =
            `${date.getMonth() + 1}月${date.getDate()}日`
        // if (this.pre_date !== null) {
        //     if (this.pre_date.getMonth() !== date.getMonth() &&
        //         this.pre_date.getDate() !== date.getDate()) {
        //         updateWeather();
        //     }
        // }
    }
}

type JumpGameCollisionObject = {
    x: number
    y: number
    w: number
    h: number
}

interface JumpGameBlock {
    element: HTMLElement
    timer: number | undefined
    is_pass: boolean
}

class JumpGameApp implements WatchApp {
    private player: HTMLElement
    private stage: HTMLElement
    private lane: HTMLElement
    private is_jumping: boolean
    private is_started: boolean
    private moving_intv: number
    private gen_intv: number
    private game_timer: number | undefined
    private jump_timer: number | undefined
    private cur_score: number
    private high_score: number
    private max_speed: number
    private cur_speed: number
    private eclipse: number

    constructor() {
        this.player = document.querySelector('#jump-player')!
        this.stage = document.querySelector('#jump-stage')!
        this.lane = document.querySelector('#jump-objs')!
        this.is_jumping = false
        this.is_started = false
        this.moving_intv = 40
        this.gen_intv = 1.5
        this.game_timer = undefined
        this.jump_timer = undefined
        this.cur_score = 0
        this.high_score = 0
        this.max_speed = 11
        this.cur_speed = this.max_speed
        this.eclipse = 0
    }

    updateScore(score: number) {
        this.cur_score = score
        document.querySelector('#jump-score>span:nth-child(1)')!.textContent =
            score.toString()
        if (this.cur_score > this.high_score) {
            this.high_score = this.cur_score
            document.querySelector('#jump-score>span:nth-child(2)')!.textContent =
                this.high_score.toString()
        }
    }

    checkCollision(): boolean {
        function isCollision(obj1: JumpGameCollisionObject,
            obj2: JumpGameCollisionObject): boolean {
            return !(obj1.x >= obj2.x + obj2.w ||
                obj2.x >= obj1.x + obj1.w ||
                obj1.y + obj1.h <= obj2.y ||
                obj2.y + obj2.h <= obj1.y)
        }

        const obj_player: JumpGameCollisionObject = {
            x: this.player.offsetLeft + this.player.clientLeft,
            y: this.player.offsetTop + this.player.clientTop,
            w: this.player.clientWidth,
            h: this.player.clientHeight
        }
        const objs =
            document.querySelectorAll('#jump-objs>.jump-obj') as NodeListOf<HTMLElement>
        let result = false

        for (let i = 0; i < objs.length; i += 1) {
            const obj_block: JumpGameCollisionObject = {
                x: objs[i].offsetLeft,
                y: objs[i].offsetTop,
                w: objs[i].clientWidth,
                h: objs[i].clientHeight
            }
            if (isCollision(obj_player, obj_block)) {
                result = true
            }
        }

        return result
    }

    moveBlock(obj: JumpGameBlock) {
        // TODO: 建造一个Obj类
        obj.element.style.right = `${parseInt(obj.element.style.right) + 6}px`

        if (obj.element.offsetLeft < -obj.element.clientWidth) {
            clearInterval(obj.timer)
            this.lane.removeChild(obj.element)
        } else {
            if (obj.element.offsetLeft + obj.element.clientWidth <=
                this.player.offsetLeft + this.player.clientLeft &&
                !obj.is_pass) {
                this.updateScore(this.cur_score + 1)
                obj.is_pass = true
            }
        }
    }

    genBlock() {
        const block1: JumpGameBlock = {
            element: document.createElement('div'),
            timer: undefined,
            is_pass: false
        }
        const inactive_blocks: JumpGameBlock[] = []
        const proportions: readonly [number, number, number] = [6, 5, 4]
        const r = rangeRandom(Math.ceil(proportions.reduce((a, b) => a + b, 0)))

        block1.element.className = 'jump-obj'
        block1.element.style.right = '15px'
        this.lane.append(block1.element)
        inactive_blocks.push(block1)

        if (r >= proportions[0]) {
            const block2: JumpGameBlock = {
                element: document.createElement('div'),
                timer: undefined,
                is_pass: true
            }
            block2.element.className = 'jump-obj'
            block2.element.style.right = '15px'
            block2.element.style.bottom = `${block1.element.clientHeight}px`
            this.lane.append(block2.element)
            inactive_blocks.push(block2)
        }

        if (r >= proportions[0] + proportions[1]) {
            const block3: JumpGameBlock = {
                element: document.createElement('div'),
                timer: undefined,
                is_pass: true
            }
            block3.element.className = 'jump-obj'
            block3.element.style.right = `${15 + block1.element.clientWidth}px`
            block3.element.style.bottom = '0px'
            this.lane.append(block3.element)
            inactive_blocks.push(block3)
        }

        for (const block of inactive_blocks) {
            block.timer = setInterval(() => {
                this.moveBlock(block)
            }, this.moving_intv)
            block.element.setAttribute("timer", block.timer.toString())
        }
    }

    init() {
        this.is_started = false
        document.querySelectorAll('#jump-objs>.jump-obj').forEach((obj) => {
            clearInterval(parseInt(obj.getAttribute('timer') ?? ''))
        });
        removeChildren(document.querySelector('#jump-objs')!)
        clearInterval(this.game_timer)
        clearInterval(this.jump_timer)
        this.is_jumping = false
        this.updateScore(0)
        this.cur_speed = this.max_speed
        this.eclipse = 0
        this.player.style.bottom = '0px'
        document.querySelector('#jump-btn')!.textContent = '启'
        document.querySelector('#jump-bg')!.classList.remove('jump-bg-anm-stop')
        document.querySelector('#jump-bg')!.classList.remove('jump-bg-anm')
    }

    terminate() {
        this.is_started = false
        document.querySelectorAll('#jump-objs>.jump-obj').forEach((obj) => {
            clearInterval(parseInt(obj.getAttribute('timer') ?? ''))
        })
        clearInterval(this.game_timer)
        clearInterval(this.jump_timer)
        document.querySelector('#jump-btn')!.textContent = '启'
        document.querySelector('#jump-bg')!.classList.add('jump-bg-anm-stop')
    }

    click() {
        if (!this.is_started) {
            this.init()
            this.is_started = true
            this.game_timer = setInterval(() => {
                if ((this.eclipse + 40) %
                    Math.floor(1000 / this.moving_intv * this.gen_intv) === 0) {
                    this.genBlock()
                }
                this.eclipse += 1
                if (this.checkCollision()) {
                    this.terminate()
                }
            }, this.moving_intv)
            document.querySelector('#jump-btn')!.textContent = '跳'
            document.querySelector('#jump-bg')!.classList.add('jump-bg-anm')
            return
        }

        if (this.is_jumping) {
            return
        }

        this.is_jumping = true
        this.jump_timer = setInterval(() => {
            if (this.player.offsetTop - this.cur_speed >
                this.stage.offsetHeight - this.player.offsetHeight) {
                this.player.style.bottom = '0px'
                this.cur_speed = this.max_speed
                this.is_jumping = false
                clearInterval(this.jump_timer)
            } else {
                this.player.style.bottom =
                    `${parseInt(this.player.style.bottom) + this.cur_speed}px`
                this.cur_speed -= 1
            }
        }, this.moving_intv)
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
    game.init();
    (document.querySelector('#jump-btn')! as HTMLElement).addEventListener('mousedown', () => { })
})