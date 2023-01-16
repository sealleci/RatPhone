// TODO: 参照Telegram风格修改聊天界面的样式
// TODO: 聊天方式可以是自动弹出和手动按钮
// TODO: 增加好友列表页面，增加群组聊天
// TODO: 聊天可以添加Reaction
// TODO: 可以发Emoji表情
// TODO: 更改手表的样式，从圆形变成长方形，增大手表的触屏面积
// TODO: 支持本地化
// TODO: 适配移动端，包括响应式布局和输入动作
// TODO: BEM风格的CSS变量名？

import { sleep, rangeRandom, padLeft, converntSecondsToTime, removeChildren } from './util.js'

class BlockTree {

}

// TODO: 按钮绑定都放到App的构造函数里
interface IWatchApp {
    id: string
    onEnter(): void
    onExit(): void
}

class Watch {
    app_list: IWatchApp[]
    constructor() {
        this.app_list = []
    }
}

class BatteryApp implements IWatchApp {
    id: string
    constructor() {
        this.id = ''
    }

    onEnter() {

    }

    onExit() {

    }
}

class ClockApp implements IWatchApp {
    id: string
    private static HANZI_NUMBERS: readonly string[]
    private hour_element: HTMLElement
    private minute_element: HTMLElement
    private date_element: HTMLElement

    constructor() {
        this.id = ''
        ClockApp.HANZI_NUMBERS =
            ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
        this.hour_element = document.querySelector('#watch-time>span:nth-child(1)')!
        this.minute_element = document.querySelector('#watch-time>span:nth-child(3)')!
        this.date_element = document.querySelector('#watch-date')!
    }

    onEnter() {

    }

    onExit() {

    }

    static convertNumToHanzi(num: number): string {
        if (num >= 0 && num <= 10) {
            return ClockApp.HANZI_NUMBERS[num]
        } else if (num <= 19) {
            return '十' + ClockApp.HANZI_NUMBERS[num % 10]
        } else if (num === 20) {
            return '二十'
        } else if (num <= 29) {
            return '廿' + ClockApp.HANZI_NUMBERS[num % 20]
        } else if (num === 30) {
            return '三十'
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

        this.hour_element.textContent = cur_h
        this.minute_element.textContent = cur_m
        this.date_element.textContent =
            `${cur_mon}月${cur_date}日周${ClockApp.convertNumToXingqi(date.getDay())}`

        // 手机上的时间
        // document.querySelector('#cur-time')!.innerHTML = `${cur_h}:${cur_m}`
        // 天气里的日期
        // document.querySelector('#wth-date')!.textContent =
        //     `${date.getMonth() + 1}月${date.getDate()}日`
        // 天气切换
        // if (this.pre_date !== null) {
        //     if (this.pre_date.getMonth() !== date.getMonth() &&
        //         this.pre_date.getDate() !== date.getDate()) {
        //         updateWeather();
        //     }
        // }
    }
}

interface JumpGameCollisionObject {
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

class JumpGameApp implements IWatchApp {
    id: string
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
    private jump_btn: HTMLElement
    private cur_score_element: HTMLElement
    private high_score_element: HTMLElement
    private bg_element: HTMLElement

    constructor() {
        this.id = ''
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
        this.jump_btn = document.querySelector('#jump-btn')!
        this.cur_score_element = document.querySelector('#jump-score>span:nth-child(1)')!
        this.high_score_element = document.querySelector('#jump-score>span:nth-child(2)')!
        this.bg_element = document.querySelector('#jump-bg')!
    }

    onEnter() {

    }

    onExit() {

    }

    updateScore(score: number) {
        this.cur_score = score
        this.cur_score_element.textContent = score.toString()
        if (this.cur_score > this.high_score) {
            this.high_score = this.cur_score
            this.high_score_element.textContent = this.high_score.toString()
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

        const player_obj: JumpGameCollisionObject = {
            x: this.player.offsetLeft + this.player.clientLeft,
            y: this.player.offsetTop + this.player.clientTop,
            w: this.player.clientWidth,
            h: this.player.clientHeight
        }
        const blocks =
            document.querySelectorAll('#jump-objs>.jump-obj') satisfies NodeListOf<HTMLElement>

        for (const block of blocks) {
            const block_obj: JumpGameCollisionObject = {
                x: block.offsetLeft,
                y: block.offsetTop,
                w: block.clientWidth,
                h: block.clientHeight
            }

            if (isCollision(player_obj, block_obj)) {
                return true
            }
        }

        return false
    }

    moveBlock(obj: JumpGameBlock) {
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
        })
        removeChildren(this.lane)
        clearInterval(this.game_timer)
        clearInterval(this.jump_timer)
        this.is_jumping = false
        this.updateScore(0)
        this.cur_speed = this.max_speed
        this.eclipse = 0
        this.player.style.bottom = '0px'
        this.jump_btn.textContent = '启'
        this.bg_element.classList.remove('jump-bg-anm-stop')
        this.bg_element.classList.remove('jump-bg-anm')
    }

    terminate() {
        this.is_started = false
        document.querySelectorAll('#jump-objs>.jump-obj').forEach((obj) => {
            clearInterval(parseInt(obj.getAttribute('timer') ?? ''))
        })
        clearInterval(this.game_timer)
        clearInterval(this.jump_timer)
        this.jump_btn.textContent = '启'
        this.bg_element.classList.add('jump-bg-anm-stop')
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
            this.jump_btn.textContent = '跳'
            this.bg_element.classList.add('jump-bg-anm')

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

// TODO: 触摸事件
class PetRatApp implements IWatchApp {
    id: string
    private max_tail_deg: number
    private min_tail_deg: number
    private tail_deg: number
    private is_locked: boolean
    private pet_cnt: number
    private left_eye_parts: readonly HTMLElement[]
    private right_eye_parts: readonly HTMLElement[]
    private tail: HTMLElement
    private heart_list: HTMLElement
    private pet_cnt_display: HTMLElement

    constructor() {
        this.id = ''
        this.max_tail_deg = 60
        this.min_tail_deg = 30
        this.tail_deg = this.min_tail_deg
        this.is_locked = false
        this.pet_cnt = 0
        this.left_eye_parts = [
            document.querySelector('#pet-rat>div:nth-child(6)')!,
            document.querySelector('#pet-rat>div:nth-child(7)')!
        ]
        this, this.right_eye_parts = [
            document.querySelector('#pet-rat>div:nth-child(8)')!,
            document.querySelector('#pet-rat>div:nth-child(9)')!
        ]
        this.tail = document.querySelector('#pet-rat>div:nth-child(5)')!
        this.heart_list = document.querySelector('#heart-list')!
        this.pet_cnt_display = document.querySelector('#pet-rat-cnt')!
    }

    onEnter() {

    }

    onExit() {

    }

    closeEyes() {
        for (const part of this.left_eye_parts) {
            part.style.display = 'none'
        }
        for (const part of this.right_eye_parts) {
            part.style.display = 'block'
        }
    }

    openEyes() {
        for (const part of this.left_eye_parts) {
            part.style.display = 'block'
        }
        for (const part of this.right_eye_parts) {
            part.style.display = 'none'
        }
    }

    shakeTail() {
        if (this.is_locked) {
            return
        }

        this.is_locked = true
        this.tail_deg ^= this.min_tail_deg ^ this.max_tail_deg
        this.tail.style.transform = `rotate(${this.tail_deg}deg)`

        const heart = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

        heart.setAttribute('height', '24px')
        heart.setAttribute('width', '24px')
        heart.setAttribute('viewBox', '0 0 16 16')
        path.setAttribute('d',
            'M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z')
        heart.append(path)
        this.heart_list.append(heart)

        setTimeout(() => {
            this.heart_list.removeChild(heart)
        }, 300)

        this.pet_cnt += 1
        this.pet_cnt_display.textContent = this.pet_cnt.toString()

        sleep(100).then(() => {
            this.is_locked = false
        })
    }
}

// TODO: 把嵌在html的icon分离出来
class WeatherApp implements IWatchApp {
    id: string

    constructor() {
        this.id = ''
    }

    onEnter() {

    }

    onExit() {

    }
}

interface MusicInfo {
    title: string
    author: string
    len: number
    color: string
}

class MusicApp implements IWatchApp {
    id: string
    private cur_index: number
    private play_intv: number
    private play_timer: number | undefined
    private cur_duration: number
    private is_playing: boolean
    private play_btn: HTMLElement
    private pause_btn: HTMLElement
    private progress_bar: HTMLElement
    private progress_dot: HTMLElement
    private progress_slide: HTMLElement
    private title_element: HTMLElement
    private author_element: HTMLElement
    private duration_element: HTMLElement
    private cur_duration_element: HTMLElement
    private music_info: MusicInfo[]

    constructor() {
        this.id = ''
        this.cur_index = 0
        this.play_intv = 250
        this.play_timer = undefined
        this.cur_duration = 0
        this.is_playing = false
        this.play_btn = document.querySelector('#music-go')!
        this.pause_btn = document.querySelector('#music-stop')!
        this.progress_bar = document.querySelector('#music-prog')!
        this.progress_dot = document.querySelector('#music-dot')!
        this.progress_slide = document.querySelector('#music-slide')!
        this.title_element = document.querySelector('#music-title>span:nth-child(1)')!
        this.author_element = document.querySelector('#music-title>span:nth-child(2)')!
        this.duration_element = document.querySelector('#music-time-row>.music-time:nth-child(2)')!
        this.cur_duration_element = document.querySelector('#music-time-row>.music-time:nth-child(1)')!
        this.music_info = []
    }

    onEnter() {

    }

    onExit() {

    }

    updateCurDuration(duration: number) {
        this.cur_duration = duration
        this.cur_duration_element.textContent = converntSecondsToTime(this.cur_duration)
    }

    togglePlayBtn(is_playing: boolean) {
        if (is_playing) {
            this.play_btn.style.display = 'none'
            this.pause_btn.style.display = 'flex'
        } else {
            this.play_btn.style.display = 'flex'
            this.pause_btn.style.display = 'none'
        }
    }

    initMusicProgress() {
        this.progress_bar.style.width = '0px'
        this.progress_dot.style.left = '0px'
    }

    loadMusicInfo(index: number) {
        this.pauseMusic()
        this.updateCurDuration(0)
        this.title_element.textContent = this.music_info[index].title
        this.author_element.textContent = this.music_info[index].author
        this.duration_element.textContent = converntSecondsToTime(this.music_info[index].len)
        this.progress_bar.style.backgroundColor = this.music_info[index].color
        this.initMusicProgress()
    }

    playMusic() {
        this.is_playing = true
        this.togglePlayBtn(true)
        this.play_timer = setInterval(this.playTick, this.play_intv)
    }

    pauseMusic() {
        clearInterval(this.play_timer)
        this.togglePlayBtn(false)
        this.is_playing = false
    }

    playTick() {
        const cur_width = Math.floor(this.cur_duration /
            this.music_info[this.cur_index].len * this.progress_slide.clientWidth)

        this.updateCurDuration(Math.min(this.cur_duration + 1,
            this.music_info[this.cur_index].len))
        this.progress_bar.style.width = `${cur_width}px`

        if (cur_width > 8) {
            this.progress_dot.style.left = `${cur_width - 8}px`
        }

        if (this.cur_duration >= this.music_info[this.cur_index].len) {
            this.pauseMusic()
        }
    }

    clickPlayBtn() {
        this.is_playing = !(this.is_playing)

        if (this.is_playing) {
            if (this.cur_duration === this.music_info[this.cur_index].len) {
                this.updateCurDuration(0)
                this.initMusicProgress()
            }
            this.playMusic()
        } else {
            this.pauseMusic()
        }
    }

    clickPrevoiusBtn() {
        this.cur_index =
            (this.cur_index - 1 + this.music_info.length) % this.music_info.length
        this.loadMusicInfo(this.cur_index)
    }

    clickNextBtn() {
        this.cur_index =
            (this.cur_index + 1 + this.music_info.length) % this.music_info.length
        this.loadMusicInfo(this.cur_index)
    }
}

class ShiciApp implements IWatchApp {
    id: string

    constructor() {
        this.id = ''
    }

    onEnter() {

    }

    onExit() {

    }
}

class SportApp implements IWatchApp {
    id: string
    private cur_bg_color: string
    private run_colors: string[]
    private cur_color_index: number
    private timer: number | undefined
    private running_intv: number
    private speed: number
    private distance: number
    private tick_cnt: number
    private elapse: number
    private is_running: boolean
    private progress_arc_len: number
    private pre_degree: number
    private distance_element: HTMLElement
    private elapse_element: HTMLElement
    private progress_color: HTMLElement
    private progress_bar: HTMLElement
    private head_dot_wrapper: HTMLElement
    private tail_dot: HTMLElement
    private head_dot: HTMLElement
    private start_btn: HTMLElement
    private pause_btn: HTMLElement

    constructor() {
        this.id = ''
        this.cur_bg_color = 'rgb(100,100,100)'
        this.run_colors = ['#39A2DB', '#8DE03A', '#39A2DB', '#DB69D2']
        this.cur_color_index = 0
        this.timer = undefined
        this.running_intv = 25
        this.speed = 0.0005
        this.distance = 0.0
        this.tick_cnt = 0
        this.elapse = 0
        this.is_running = false
        this.progress_arc_len = 1.0
        this.pre_degree = 0
        this.distance_element = document.querySelector('#run-meter>span:nth-child(1)')!
        this.elapse_element = document.querySelector('#run-time>span:nth-child(2)')!
        this.progress_color = document.querySelector('#run-prog-color')!
        this.progress_bar = document.querySelector('#run-prog')!
        this.head_dot_wrapper = document.querySelector('#run-prog-color>.edge-cir:nth-child(2)')!
        this.tail_dot = document.querySelector('#run-prog-color>.edge-cir:nth-child(1)>div')!
        this.head_dot = document.querySelector('#run-prog-color>.edge-cir:nth-child(2)>div')!
        this.start_btn = document.querySelector('#run-go')!
        this.pause_btn = document.querySelector('#run-stop')!
    }

    onEnter() {

    }

    onExit() {

    }

    updateDistance(distance: number) {
        this.distance = distance
        this.distance_element.textContent = this.distance.toFixed(2)
    }

    updateElapse(elapse: number) {
        this.elapse = elapse
        this.elapse_element.textContent = converntSecondsToTime(this.elapse)
    }

    runTick() {
        this.updateDistance(this.distance + this.speed)
        this.tick_cnt += 1

        if (this.tick_cnt % Math.floor(1000 / this.running_intv) === 0) {
            this.updateElapse(this.elapse + 1)
            this.tick_cnt = 0
        }

        const cur_degree = Math.floor(this.distance / this.progress_arc_len * 360) % 360

        if (cur_degree < 180) {
            this.progress_color.style.backgroundImage = `linear-gradient(${-90 + cur_degree}deg, transparent 50%, ${this.cur_bg_color} 50%),
                                                        linear-gradient(90deg, ${this.run_colors[this.cur_color_index]} 50%, transparent 50%)`
        } else {
            this.progress_color.style.backgroundImage = `linear-gradient(${-90 + cur_degree - 180}deg, transparent 50%, ${this.run_colors[this.cur_color_index]} 50%), 
                                                        linear-gradient(90deg, ${this.run_colors[this.cur_color_index]} 50%, transparent 50%)`
        }

        this.head_dot_wrapper.style.transform = `rotate(${cur_degree}deg)`

        if (Math.abs(this.pre_degree - cur_degree) > 180) {
            this.cur_bg_color = this.run_colors[this.cur_color_index]
            this.cur_color_index = (this.cur_color_index + 1) % this.run_colors.length
            this.progress_bar.style.backgroundColor = this.cur_bg_color
            this.tail_dot.style.backgroundColor = this.run_colors[this.cur_color_index]
            this.head_dot.style.backgroundColor = this.run_colors[this.cur_color_index]
            this.progress_color.style.backgroundImage = `linear-gradient(-90deg, transparent 50%, ${this.cur_bg_color} 50%),
                                                        linear-gradient(90deg, ${this.run_colors[this.cur_color_index]} 50%, transparent 50%)`
        }

        this.pre_degree = cur_degree
    }

    startRunning() {
        this.is_running = true
        this.timer = setInterval(this.runTick, this.running_intv)
        this.start_btn.style.display = 'none'
        this.pause_btn.style.display = 'flex'
    }

    pauseRunning() {
        this.is_running = false
        clearInterval(this.timer)
        this.start_btn.style.display = 'flex'
        this.pause_btn.style.display = 'none'
    }

    clickRunBtn() {
        this.is_running = !(this.is_running)

        if (this.is_running) {
            this.startRunning()
        } else {
            this.pauseRunning()
        }
    }
}

class Battery {

}

class Phone {

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
    (document.querySelector('#jump-btn')! satisfies HTMLElement).addEventListener('mousedown', () => { })
})