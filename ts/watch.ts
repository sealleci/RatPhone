import { Dictionary, Tuple, NumberRange } from './type.js'
import { sleep, rangeRoll, padLeft, convertSecondsToTime, removeChildren } from './util.js'
import { Phone } from './phone.js'

class WatchAPI {
    static readonly HEIGHT: number = 125
    static readonly WIDTH: number = 125
}

interface AppIconInfo {
    name: string
    svg: string
    css_dict: Dictionary
    is_notification_enable: boolean
}

// TODO: 按钮绑定都放到Watch的init里
interface IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
    onEnter(): void
    onExit(): void
}

// TODO: 手表提供屏幕宽高，计时接口
class Watch {
    private app_list: IWatchApp[]
    private watch_elm: HTMLElement
    private home_page: HTMLElement
    private app_list_elm: HTMLElement
    private main_page_switch_lock: boolean

    constructor() {
        this.app_list = []
        this.watch_elm = document.querySelector('#watch')!
        this.home_page = document.querySelector('#watch-main-page')!
        this.app_list_elm = document.querySelector('#watch-main-slide')!
        this.main_page_switch_lock = false
    }

    getAppById(id: string): IWatchApp | null {
        for (const app of this.app_list) {
            if (app.id === id) {
                return app
            }
        }

        return null
    }

    clickWatchPrevBtn() {
        if (this.main_page_switch_lock) {
            return
        }

        if (this.home_page.style.display === 'none') {
            return
        }

        const app_cnt = document.querySelectorAll('#watch-main-slide>.icon-row').length
        const next_l = parseInt(this.app_list_elm.style.left) - WatchAPI.WIDTH

        if (next_l >= WatchAPI.WIDTH) {
            const pre_node = document.querySelector('#watch-main-slide>.icon-row:last-child')

            if (pre_node === null) {
                return
            }

            const new_node = pre_node.cloneNode(true)

            this.app_list_elm.prepend(new_node)
            this.app_list_elm.style.transition = 'none'
            this.app_list_elm.style.left = `${next_l - WatchAPI.WIDTH * 2}px`
            this.main_page_switch_lock = true

            // TODO: 这里是在干吗
            sleep(25).then(() => {
                this.app_list_elm.style.transition = 'left 0.25s'
                this.app_list_elm.style.left = `${next_l - WatchAPI.WIDTH}px`

                sleep(250).then(() => {
                    this.app_list_elm.style.transition = 'none'
                    this.app_list_elm.style.left = `${-(app_cnt - 1) * WatchAPI.WIDTH}px`

                    if (this.app_list_elm.firstElementChild != null) {
                        this.app_list_elm.removeChild(this.app_list_elm.firstElementChild)
                    }

                    this.main_page_switch_lock = false
                })
            })
        } else {
            this.app_list_elm.style.transition = 'left 0.25s'
            this.app_list_elm.style.left = `${next_l}px`
        }
    }

    clickWatchNextBtn() {
        if (this.main_page_switch_lock) {
            return
        }

        if (this.home_page.style.display === 'none') {
            return
        }

        const app_cnt = document.querySelectorAll('#watch-main-slide>.icon-row').length
        const next_l = parseInt(this.app_list_elm.style.left) - WatchAPI.WIDTH

        if (next_l <= -(app_cnt) * WatchAPI.WIDTH) {
            const pre_node = document.querySelector('#watch-main-slide>.icon-row:first-child')

            if (pre_node === null) {
                return
            }

            const new_node = pre_node.cloneNode(true)

            this.app_list_elm.append(new_node)
            this.app_list_elm.style.transition = 'left 0.25s'
            this.app_list_elm.style.left = `${next_l}px`
            this.main_page_switch_lock = true

            sleep(250).then(() => {
                this.app_list_elm.style.transition = 'none'
                this.app_list_elm.style.left = '0px'

                if (this.app_list_elm.firstElementChild != null) {
                    this.app_list_elm.removeChild(this.app_list_elm.firstElementChild)
                }

                this.main_page_switch_lock = false
            })
        } else {
            this.app_list_elm.style.transition = 'left 0.25s'
            this.app_list_elm.style.left = `${next_l}px`
        }
    }

    // TODO: 传入元素参数后重写
    clickWatchBackBtn() {
        for (const item_elm of this.watch_elm.querySelectorAll<HTMLElement>('div')) {
            if (item_elm.id === 'watch-main-page') {
                item_elm.style.display = 'flex'
                continue
            }

            const cur_app = this.getAppById(item_elm.getAttribute('app-id') ?? '')

            if (cur_app === null) {
                continue
            }

            // TODO: 添加App是否active的标志
            if (item_elm.style.display !== 'none') {
                cur_app.onExit()
                item_elm.style.position = 'absolute'
                item_elm.style.animation = 'watch-page-out 0.2s ease-out 0s 1'

                sleep(200).then(() => {
                    item_elm.style.display = 'none'
                    item_elm.style.position = 'relative'
                })
            } else {
                item_elm.style.display = 'none'
            }
        }
    }

    // TODO: 传入元素参数后重写
    clickWatchIcon(icon_elm: HTMLElement) {
        for (const item_elm of document.querySelectorAll<HTMLElement>('#watch>div')) {
            if (item_elm.id !== icon_elm.getAttribute('app-id')) {
                item_elm.style.display = 'none'
                continue
            }

            const cur_app = this.getAppById(item_elm.getAttribute('app-id') ?? '')

            if (cur_app === null) {
                item_elm.style.display = 'none'
                continue
            }

            item_elm.style.animation = 'watch-page-in 0.3s ease-out 0s 1'
            item_elm.style.display = 'flex'
            cur_app.onEnter()
        }
    }

    renderIcon(app_id: string, icon_info: AppIconInfo, on_enter_fn: () => void) {
        const icon_wrapper_elm = document.createElement('div')
        const icon_elm = document.createElement('div')
        const icon_name_elm = document.createElement('div')

        icon_wrapper_elm.classList.add('icon-row')
        icon_elm.classList.add('watch-icon', `${app_id}-icon`)
        icon_elm.setAttribute('data-page', `${app_id}-page`)
        icon_elm.setAttribute('app-id', app_id)
        icon_elm.innerHTML =
            `${icon_info.is_notification_enable ?
                '<div id="msg-cnt" style="display: none;"></div>' : ''}
            ${icon_info.svg}`
        icon_name_elm.textContent = icon_info.name

        for (const property_key of Object.keys(icon_info.css_dict)) {
            icon_elm.style.setProperty(property_key,
                icon_info.css_dict[property_key] ?? null)
        }

        icon_elm.addEventListener('click', () => {
            on_enter_fn()
        })
        icon_wrapper_elm.appendChild(icon_elm)
        icon_wrapper_elm.appendChild(icon_name_elm)
        this.app_list_elm.appendChild(icon_wrapper_elm)
    }

    init() {
        // TODO: 动态添加图标
    }
}

// TODO: 如何控制手机电池
class BatteryApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
    private text_elm: HTMLElement
    private bg_elm: HTMLElement
    private is_power_still: boolean
    private watch_power_timer: number | undefined
    private watch_power_intv: number

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
        this.text_elm = document.querySelector('#power-page-battery>span')!
        this.bg_elm = document.querySelector('#power-page-battery-bg')!
        this.is_power_still = false
        this.watch_power_timer = undefined
        this.watch_power_intv = 100
    }

    onEnter() {
    }

    onExit() {

    }

    updateBatteryLevel(percentage: number) {
        this.text_elm.textContent = `${percentage}%`
        this.bg_elm.style.width = `${percentage / 100 * 60}px`
    }

    // TODO: 按压电池事件
    pressWatchPowerBtn() {
        this.is_power_still = true
        this.watch_power_timer = setTimeout(() => { }, this.watch_power_intv)
    }

    releaseWatchPowerBtn() {
        this.is_power_still = false
    }
}

class ClockApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
    private hour_elm: HTMLElement
    private minute_elm: HTMLElement
    private date_elm: HTMLElement
    private static readonly HANZI_NUMBERS: readonly string[] =
        ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
        this.hour_elm = document.querySelector('#watch-time>span:nth-child(1)')!
        this.minute_elm = document.querySelector('#watch-time>span:nth-child(3)')!
        this.date_elm = document.querySelector('#watch-date')!

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

    // TODO: 手表中的时钟模块
    colckTick() {
        // TODO: 手机和手表的时钟应该分开，天气的随日期更换功能应该自己实现
        const date = new Date()
        const cur_h = padLeft(date.getHours().toString(), 2, '0')
        const cur_m = padLeft(date.getMinutes().toString(), 2, '0')
        const cur_mon = ClockApp.convertNumToHanzi(date.getMonth() + 1)
        const cur_date = ClockApp.convertNumToHanzi(date.getDate())

        this.hour_elm.textContent = cur_h
        this.minute_elm.textContent = cur_m
        this.date_elm.textContent =
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
    elm: HTMLElement
    timer: number | undefined
    is_pass: boolean
}

class JumpGameApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
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
    private cur_score_elm: HTMLElement
    private high_score_elm: HTMLElement
    private bg_elm: HTMLElement

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
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
        this.cur_score_elm = document.querySelector('#jump-score>span:nth-child(1)')!
        this.high_score_elm = document.querySelector('#jump-score>span:nth-child(2)')!
        this.bg_elm = document.querySelector('#jump-bg')!
    }

    onEnter() {

    }

    onExit() {

    }

    updateScore(score: number) {
        this.cur_score = score
        this.cur_score_elm.textContent = score.toString()
        if (this.cur_score > this.high_score) {
            this.high_score = this.cur_score
            this.high_score_elm.textContent = this.high_score.toString()
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
            document.querySelectorAll<HTMLElement>('#jump-objs>.jump-obj')

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

    moveBlock(block: JumpGameBlock) {
        block.elm.style.right = `${parseInt(block.elm.style.right) + 6}px`

        if (block.elm.offsetLeft < -block.elm.clientWidth) {
            clearInterval(block.timer)
            this.lane.removeChild(block.elm)
        } else {
            if (block.elm.offsetLeft + block.elm.clientWidth <=
                this.player.offsetLeft + this.player.clientLeft &&
                !block.is_pass) {
                this.updateScore(this.cur_score + 1)
                block.is_pass = true
            }
        }
    }

    genBlock() {
        const block1: JumpGameBlock = {
            elm: document.createElement('div'),
            timer: undefined,
            is_pass: false
        }
        const inactive_blocks: JumpGameBlock[] = []
        const proportions: Tuple<number, 3> = [6, 5, 4]
        const r = rangeRoll(Math.ceil(proportions.reduce((a, b) => a + b, 0)))

        block1.elm.className = 'jump-obj'
        block1.elm.style.right = '15px'
        this.lane.appendChild(block1.elm)
        inactive_blocks.push(block1)

        if (r >= proportions[0]) {
            const block2: JumpGameBlock = {
                elm: document.createElement('div'),
                timer: undefined,
                is_pass: true
            }
            block2.elm.className = 'jump-obj'
            block2.elm.style.right = '15px'
            block2.elm.style.bottom = `${block1.elm.clientHeight}px`
            this.lane.appendChild(block2.elm)
            inactive_blocks.push(block2)
        }

        if (r >= proportions[0] + proportions[1]) {
            const block3: JumpGameBlock = {
                elm: document.createElement('div'),
                timer: undefined,
                is_pass: true
            }
            block3.elm.className = 'jump-obj'
            block3.elm.style.right = `${15 + block1.elm.clientWidth}px`
            block3.elm.style.bottom = '0px'
            this.lane.appendChild(block3.elm)
            inactive_blocks.push(block3)
        }

        for (const block of inactive_blocks) {
            block.timer = setInterval(() => {
                this.moveBlock(block)
            }, this.moving_intv)
            block.elm.setAttribute("timer", block.timer.toString())
        }
    }

    init() {
        this.is_started = false
        document.querySelectorAll<HTMLElement>('#jump-objs>.jump-obj').forEach((block_elm) => {
            clearInterval(parseInt(block_elm.getAttribute('timer') ?? ''))
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
        this.bg_elm.classList.remove('jump-bg-anm-stop')
        this.bg_elm.classList.remove('jump-bg-anm')
    }

    terminate() {
        this.is_started = false
        document.querySelectorAll<HTMLElement>('#jump-objs>.jump-obj').forEach((block_elm) => {
            clearInterval(parseInt(block_elm.getAttribute('timer') ?? ''))
        })
        clearInterval(this.game_timer)
        clearInterval(this.jump_timer)
        this.jump_btn.textContent = '启'
        this.bg_elm.classList.add('jump-bg-anm-stop')
    }

    clickJumpBtn() {
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
            this.bg_elm.classList.add('jump-bg-anm')

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
    readonly id: string
    readonly icon_info: AppIconInfo
    private max_tail_deg: number
    private min_tail_deg: number
    private tail_deg: number
    private is_locked: boolean
    private pet_cnt: number
    private readonly left_eye_parts: readonly HTMLElement[]
    private readonly right_eye_parts: readonly HTMLElement[]
    private tail: HTMLElement
    private heart_list: HTMLElement
    private pet_cnt_display: HTMLElement

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
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
        heart.appendChild(path)
        this.heart_list.appendChild(heart)
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

class WeatherApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
    private day_icon_elm: HTMLElement
    private night_icon_elm: HTMLElement
    private dat_temp_elm: HTMLElement
    private night_temp_elm: HTMLElement
    private pre_date: Date
    private static SVG_ICONS: { day: Tuple<string, 8>; night: Tuple<string, 8> } = {
        day: [
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-brightness-high" viewBox="0 0 16 16">
                    <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-sun" viewBox="0 0 16 16">
                    <path d="M7 8a3.5 3.5 0 0 1 3.5 3.555.5.5 0 0 0 .624.492A1.503 1.503 0 0 1 13 13.5a1.5 1.5 0 0 1-1.5 1.5H3a2 2 0 1 1 .1-3.998.5.5 0 0 0 .51-.375A3.502 3.502 0 0 1 7 8zm4.473 3a4.5 4.5 0 0 0-8.72-.99A3 3 0 0 0 3 16h8.5a2.5 2.5 0 0 0 0-5h-.027z" />
                    <path d="M10.5 1.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1zm3.743 1.964a.5.5 0 1 0-.707-.707l-.708.707a.5.5 0 0 0 .708.708l.707-.708zm-7.779-.707a.5.5 0 0 0-.707.707l.707.708a.5.5 0 1 0 .708-.708l-.708-.707zm1.734 3.374a2 2 0 1 1 3.296 2.198c.199.281.372.582.516.898a3 3 0 1 0-4.84-3.225c.352.011.696.055 1.028.129zm4.484 4.074c.6.215 1.125.59 1.522 1.072a.5.5 0 0 0 .039-.742l-.707-.707a.5.5 0 0 0-.854.377zM14.5 6.5a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clouds" viewBox="0 0 16 16">
                    <path d="M16 7.5a2.5 2.5 0 0 1-1.456 2.272 3.513 3.513 0 0 0-.65-.824 1.5 1.5 0 0 0-.789-2.896.5.5 0 0 1-.627-.421 3 3 0 0 0-5.22-1.625 5.587 5.587 0 0 0-1.276.088 4.002 4.002 0 0 1 7.392.91A2.5 2.5 0 0 1 16 7.5z" />
                    <path d="M7 5a4.5 4.5 0 0 1 4.473 4h.027a2.5 2.5 0 0 1 0 5H3a3 3 0 0 1-.247-5.99A4.502 4.502 0 0 1 7 5zm3.5 4.5a3.5 3.5 0 0 0-6.89-.873.5.5 0 0 1-.51.375A2 2 0 1 0 3 13h8.5a1.5 1.5 0 1 0-.376-2.953.5.5 0 0 1-.624-.492V9.5z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-drizzle" viewBox="0 0 16 16">
                    <path d="M4.158 12.025a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 0 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm6 0a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 0 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm-3.5 1.5a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 0 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm6 0a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm.747-8.498a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 11H13a3 3 0 0 0 .405-5.973zM8.5 2a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 2z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-rain-heavy" viewBox="0 0 16 16">
                    <path d="M4.176 11.032a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 1 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293zm3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 1 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293zm3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 1 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293zm3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 0 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293zm.229-7.005a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973zM8.5 1a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-lightning-rain" viewBox="0 0 16 16">
                    <path d="M2.658 11.026a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm9.5 0a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm-7.5 1.5a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm9.5 0a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm-.753-8.499a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973zM8.5 1a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1zM7.053 11.276A.5.5 0 0 1 7.5 11h1a.5.5 0 0 1 .474.658l-.28.842H9.5a.5.5 0 0 1 .39.812l-2 2.5a.5.5 0 0 1-.875-.433L7.36 14H6.5a.5.5 0 0 1-.447-.724l1-2z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-snow" viewBox="0 0 16 16">
                    <path d="M13.405 4.277a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10.25H13a3 3 0 0 0 .405-5.973zM8.5 1.25a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1-.001 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1.25zM2.625 11.5a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm2.75 2a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm5.5 0a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm-2.75-2a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm5.5 0a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-sleet" viewBox="0 0 16 16">
                    <path d="M13.405 4.027a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973zM8.5 1a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1zM2.375 13.5a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm1.849-2.447a.5.5 0 0 1 .223.67l-.5 1a.5.5 0 1 1-.894-.447l.5-1a.5.5 0 0 1 .67-.223zM6.375 13.5a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm1.849-2.447a.5.5 0 0 1 .223.67l-.5 1a.5.5 0 1 1-.894-.447l.5-1a.5.5 0 0 1 .67-.223zm2.151 2.447a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm1.849-2.447a.5.5 0 0 1 .223.67l-.5 1a.5.5 0 1 1-.894-.447l.5-1a.5.5 0 0 1 .67-.223z" />
                </svg>`
        ],
        night: [
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moon-stars" viewBox="0 0 16 16">
                    <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z" />
                    <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-moon" viewBox="0 0 16 16">
                    <path d="M7 8a3.5 3.5 0 0 1 3.5 3.555.5.5 0 0 0 .625.492A1.503 1.503 0 0 1 13 13.5a1.5 1.5 0 0 1-1.5 1.5H3a2 2 0 1 1 .1-3.998.5.5 0 0 0 .509-.375A3.502 3.502 0 0 1 7 8zm4.473 3a4.5 4.5 0 0 0-8.72-.99A3 3 0 0 0 3 16h8.5a2.5 2.5 0 0 0 0-5h-.027z" />
                    <path d="M11.286 1.778a.5.5 0 0 0-.565-.755 4.595 4.595 0 0 0-3.18 5.003 5.46 5.46 0 0 1 1.055.209A3.603 3.603 0 0 1 9.83 2.617a4.593 4.593 0 0 0 4.31 5.744 3.576 3.576 0 0 1-2.241.634c.162.317.295.652.394 1a4.59 4.59 0 0 0 3.624-2.04.5.5 0 0 0-.565-.755 3.593 3.593 0 0 1-4.065-5.422z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clouds" viewBox="0 0 16 16">
                    <path d="M16 7.5a2.5 2.5 0 0 1-1.456 2.272 3.513 3.513 0 0 0-.65-.824 1.5 1.5 0 0 0-.789-2.896.5.5 0 0 1-.627-.421 3 3 0 0 0-5.22-1.625 5.587 5.587 0 0 0-1.276.088 4.002 4.002 0 0 1 7.392.91A2.5 2.5 0 0 1 16 7.5z" />
                    <path d="M7 5a4.5 4.5 0 0 1 4.473 4h.027a2.5 2.5 0 0 1 0 5H3a3 3 0 0 1-.247-5.99A4.502 4.502 0 0 1 7 5zm3.5 4.5a3.5 3.5 0 0 0-6.89-.873.5.5 0 0 1-.51.375A2 2 0 1 0 3 13h8.5a1.5 1.5 0 1 0-.376-2.953.5.5 0 0 1-.624-.492V9.5z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-drizzle" viewBox="0 0 16 16">
                    <path d="M4.158 12.025a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 0 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm6 0a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 0 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm-3.5 1.5a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 0 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm6 0a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm.747-8.498a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 11H13a3 3 0 0 0 .405-5.973zM8.5 2a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 2z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-rain-heavy" viewBox="0 0 16 16">
                    <path d="M4.176 11.032a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 1 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293zm3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 1 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293zm3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 1 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293zm3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 0 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293zm.229-7.005a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973zM8.5 1a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-lightning-rain" viewBox="0 0 16 16">
                    <path d="M2.658 11.026a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm9.5 0a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm-7.5 1.5a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm9.5 0a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm-.753-8.499a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973zM8.5 1a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1zM7.053 11.276A.5.5 0 0 1 7.5 11h1a.5.5 0 0 1 .474.658l-.28.842H9.5a.5.5 0 0 1 .39.812l-2 2.5a.5.5 0 0 1-.875-.433L7.36 14H6.5a.5.5 0 0 1-.447-.724l1-2z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-snow" viewBox="0 0 16 16">
                    <path d="M13.405 4.277a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10.25H13a3 3 0 0 0 .405-5.973zM8.5 1.25a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1-.001 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1.25zM2.625 11.5a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm2.75 2a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm5.5 0a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm-2.75-2a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm5.5 0a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25z" />
                </svg>`,
            `<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-sleet" viewBox="0 0 16 16">
                    <path d="M13.405 4.027a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973zM8.5 1a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1zM2.375 13.5a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm1.849-2.447a.5.5 0 0 1 .223.67l-.5 1a.5.5 0 1 1-.894-.447l.5-1a.5.5 0 0 1 .67-.223zM6.375 13.5a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm1.849-2.447a.5.5 0 0 1 .223.67l-.5 1a.5.5 0 1 1-.894-.447l.5-1a.5.5 0 0 1 .67-.223zm2.151 2.447a.25.25 0 0 1 .25.25v.57l.501-.287a.25.25 0 0 1 .248.434l-.495.283.495.283a.25.25 0 0 1-.248.434l-.501-.286v.569a.25.25 0 1 1-.5 0v-.57l-.501.287a.25.25 0 0 1-.248-.434l.495-.283-.495-.283a.25.25 0 0 1 .248-.434l.501.286v-.569a.25.25 0 0 1 .25-.25zm1.849-2.447a.5.5 0 0 1 .223.67l-.5 1a.5.5 0 1 1-.894-.447l.5-1a.5.5 0 0 1 .67-.223z" />
                </svg>`
        ]
    }

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
        this.day_icon_elm = document.querySelector('.wth-col:nth-child(1)>.wth-type-icon')!
        this.night_icon_elm = document.querySelector('.wth-col:nth-child(2)>.wth-type-icon')!
        this.dat_temp_elm = document.querySelector('.wth-col:nth-child(1) .wth-temp')!
        this.night_temp_elm = document.querySelector('.wth-col:nth-child(2) .wth-temp')!
        this.pre_date = new Date()
    }

    onEnter() {

    }

    onExit() {

    }

    static getDayAvgTempRangeOfMonth(month: number): readonly [number, number] {
        switch (month) {
            case 1:
                return [2, 8]
            case 2:
                return [5, 11]
            case 3:
                return [11, 16]
            case 4:
                return [17, 23]
            case 5:
                return [22, 28]
            case 6:
                return [25, 31]
            case 7:
                return [27, 33]
            case 8:
                return [26, 32]
            case 9:
                return [23, 28]
            case 10:
                return [17, 23]
            case 11:
                return [12, 15]
            case 12:
                return [5, 9]
            default:
                return [25, 26]
        }
    }

    static getNightAvgTempRangeOfMonth(month: number): readonly [number, number] {
        switch (month) {
            case 1:
                return [-8, -2]
            case 2:
                return [-4, 0]
            case 3:
                return [-1, 5]
            case 4:
                return [6, 12]
            case 5:
                return [11, 16]
            case 6:
                return [15, 20]
            case 7:
                return [20, 24]
            case 8:
                return [18, 23]
            case 9:
                return [13, 19]
            case 10:
                return [7, 13]
            case 11:
                return [0, 6]
            case 12:
                return [-5, 1]
            default:
                return [20, 21]
        }
    }

    static getIconIndexRangeOfMonth(month: number): readonly NumberRange<0, 8>[] {
        switch (month) {
            case 1:
                return [0, 1, 2, 6, 7]
            case 2:
                return [0, 1, 2, 6, 7]
            case 3:
                return [0, 1, 2, 3]
            case 4:
                return [0, 1, 2, 3]
            case 5:
                return [0, 1, 2, 3]
            case 6:
                return [0, 1, 2, 3, 4, 5]
            case 7:
                return [0, 1, 2, 3, 4, 5]
            case 8:
                return [0, 1, 2, 3, 4, 5]
            case 9:
                return [0, 1, 2, 3, 5]
            case 10:
                return [0, 1, 2, 3, 5]
            case 11:
                return [0, 1, 2, 3, 5]
            case 12:
                return [0, 1, 2, 6, 7]
            default:
                return [0, 1, 2, 3, 4, 5, 6, 7]
        }
    }

    static convertCelsiusToFahrenheit(c: number): number {
        return c * 9 / 5 + 32
    }

    static formatCelsius(c: number): string {
        return `${c.toFixed(1)}℃`
    }

    static formatFahrenheit(f: number): string {
        return `${f.toFixed(1)}℉`
    }

    rollTemps() {
        const date = new Date()
        const month = date.getMonth() + 1
        const day_temp_range = WeatherApp.getDayAvgTempRangeOfMonth(month)
        const night_temp_range = WeatherApp.getNightAvgTempRangeOfMonth(month)
        const r_day_temp = rangeRoll(day_temp_range[0], day_temp_range[1])
        const r_night_temp = rangeRoll(night_temp_range[0], night_temp_range[1])

        this.dat_temp_elm.textContent = WeatherApp.formatCelsius(r_day_temp)
        this.night_temp_elm.textContent = WeatherApp.formatCelsius(r_night_temp)
    }

    rollIcons() {
        const date = new Date()
        const icon_index_range = WeatherApp.getIconIndexRangeOfMonth(date.getMonth() + 1)
        const r_day_index = rangeRoll(icon_index_range.length)
        const r_night_index = rangeRoll(icon_index_range.length)

        removeChildren(this.day_icon_elm)
        removeChildren(this.night_icon_elm)
        this.day_icon_elm.innerHTML =
            WeatherApp.SVG_ICONS.day[icon_index_range[r_day_index]]
        this.night_icon_elm.innerHTML =
            WeatherApp.SVG_ICONS.night[icon_index_range[r_night_index]]
    }

    renderCertainIcons(day_index: number, night_index: number) {
        removeChildren(this.day_icon_elm)
        removeChildren(this.night_icon_elm)
        this.day_icon_elm.innerHTML = WeatherApp.SVG_ICONS.day[day_index]
        this.night_icon_elm.innerHTML = WeatherApp.SVG_ICONS.night[night_index]
    }

    update() {
        this.rollTemps()
        this.rollIcons()
    }

}

interface MusicInfo {
    title: string
    author: string
    len: number
    color: string
}

class MusicApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
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
    private title_elm: HTMLElement
    private author_elm: HTMLElement
    private duration_elm: HTMLElement
    private cur_duration_elm: HTMLElement
    private music_info: MusicInfo[]

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
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
        this.title_elm = document.querySelector('#music-title>span:nth-child(1)')!
        this.author_elm = document.querySelector('#music-title>span:nth-child(2)')!
        this.duration_elm = document.querySelector('#music-time-row>.music-time:nth-child(2)')!
        this.cur_duration_elm = document.querySelector('#music-time-row>.music-time:nth-child(1)')!
        this.music_info = []
    }

    onEnter() {

    }

    onExit() {

    }

    updateCurDuration(duration: number) {
        this.cur_duration = duration
        this.cur_duration_elm.textContent = convertSecondsToTime(this.cur_duration)
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
        this.title_elm.textContent = this.music_info[index].title
        this.author_elm.textContent = this.music_info[index].author
        this.duration_elm.textContent = convertSecondsToTime(this.music_info[index].len)
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

interface ShiciInfo {
    title: string
    dynasty: string
    author: string
    sentences: string[]
}

class ShiciApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
    private shici_info: ShiciInfo[]
    private masks: number[]
    private title_elm: HTMLElement
    private dynasty_elm: HTMLElement
    private author_elm: HTMLElement
    private content_elm: HTMLElement

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
        this.shici_info = []
        this.masks = []
        this.title_elm = document.querySelector('#shici-name')!
        this.dynasty_elm = document.querySelector('#shici-auth>span:nth-child(1)')!
        this.author_elm = document.querySelector('#shici-auth>span:nth-child(2)')!
        this.content_elm = document.querySelector('#shici-text')!
    }

    onEnter() {

    }

    onExit() {

    }

    render(index: number) {
        this.title_elm.textContent = this.shici_info[index].title
        this.dynasty_elm.textContent = this.shici_info[index].dynasty
        this.author_elm.textContent = this.shici_info[index].author
        removeChildren(this.content_elm)

        for (const sentence of this.shici_info[index].sentences) {
            const sentence_elm = document.createElement('div')
            sentence_elm.className = 'shici-row'
            sentence_elm.textContent = sentence
            this.content_elm.appendChild(sentence_elm)
        }
    }

    clickRollBtn() {
        let available_indices = []

        for (let i = 0; i < this.shici_info.length; i += 1) {
            if (this.masks.indexOf(i) === -1) {
                available_indices.push(i)
            }
        }

        if (available_indices.length !== 0) {
            const r = rangeRoll(available_indices.length)
            this.render(available_indices[r])
            this.masks.push(available_indices[r])
        }

        if (this.masks.length >= this.shici_info.length) {
            this.masks = []
        }
    }
}

class SportApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
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
    private distance_elm: HTMLElement
    private elapse_elm: HTMLElement
    private progress_color: HTMLElement
    private progress_bar: HTMLElement
    private head_dot_wrapper: HTMLElement
    private tail_dot: HTMLElement
    private head_dot: HTMLElement
    private start_btn: HTMLElement
    private pause_btn: HTMLElement

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
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
        this.distance_elm = document.querySelector('#run-meter>span:nth-child(1)')!
        this.elapse_elm = document.querySelector('#run-time>span:nth-child(2)')!
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
        this.distance_elm.textContent = this.distance.toFixed(2)
    }

    updateElapse(elapse: number) {
        this.elapse = elapse
        this.elapse_elm.textContent = convertSecondsToTime(this.elapse)
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

interface MessageInfo {
    md5: string
    sender: string
    content: string
}

// TODO: 计算消息的md5
class MessageApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo
    private unchecked_cnt: number
    private is_empty: boolean
    private message_list_elm: HTMLElement
    private pre_message_btn: HTMLElement
    private next_message_btn: HTMLElement
    private notification_icon: HTMLElement
    private message_page_elm: HTMLElement
    private placeholder_elm: HTMLElement

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
        this.unchecked_cnt = 0
        this.is_empty = true
        this.message_list_elm = document.querySelector('#msg-list')!
        this.pre_message_btn = document.querySelector('#msg-up')!
        this.next_message_btn = document.querySelector('#msg-down')!
        this.notification_icon = document.querySelector('#msg-cnt')!
        this.message_page_elm = document.querySelector('#msg-page')!
        this.placeholder_elm = document.querySelector('#msg-null')!
    }

    onEnter() {

    }

    onExit() {

    }

    renderBtns() {
        const cur_top = parseInt(this.message_list_elm.style.top)

        this.pre_message_btn.style.display = 'none'
        this.next_message_btn.style.display = 'none'

        if (cur_top < 0) {
            this.pre_message_btn.style.display = 'flex'
        }
        if (cur_top - WatchAPI.HEIGHT >
            -this.message_list_elm.children.length * WatchAPI.HEIGHT) {
            this.next_message_btn.style.display = 'flex'
        }
    }

    clickPreMessageBtn() {
        let next_top =
            parseInt(this.message_list_elm.style.top) + WatchAPI.HEIGHT

        if (next_top > WatchAPI.HEIGHT) {
            next_top = 0
        }

        this.message_list_elm.style.top = `${next_top}px`
        this.renderBtns()
    }

    clickNextMessageBtn() {
        let next_top =
            parseInt(this.message_list_elm.style.top) - WatchAPI.HEIGHT
        const max_height =
            -(this.message_list_elm.children.length - 1) * WatchAPI.HEIGHT

        if (next_top < max_height) {
            next_top = max_height
        }

        this.message_list_elm.style.top = `${next_top}px`
        this.renderBtns()
    }

    clearNotification() {
        this.unchecked_cnt = 0
        this.notification_icon.textContent = ''
        this.notification_icon.style.display = 'none'
    }

    updateNotification() {
        if (this.message_page_elm.style.display !== 'none') { //信息页面被点开
            this.clearNotification()
        } else {
            this.notification_icon.textContent = this.unchecked_cnt.toString()

            if (this.unchecked_cnt > 0) {
                this.notification_icon.style.display = 'flex'
            } else {
                this.notification_icon.style.display = 'none'
            }
        }
    }

    receive(message_info: MessageInfo) {
        const date = new Date()
        const new_message_elm = document.createElement('div')

        new_message_elm.className = 'msg-row'
        new_message_elm.setAttribute('md5', message_info.md5)
        new_message_elm.innerHTML =
            `<div class="msg-from">
                <span>${message_info.sender}</span>
                <span>${padLeft(date.getHours().toString(), 2, '0')}:${padLeft(
                date.getMinutes().toString(), 2, '0')}</span>
            </div>
            <div class="msg-text">${message_info.content}</div>`

        if (this.is_empty) {
            this.message_list_elm.removeChild(this.placeholder_elm)
            this.is_empty = false
        }

        let is_repeated = false

        // Array.from(this.message_list_elm.children).forEach((message_elm) => {
        //     if (message_elm.getAttribute('md5') === message_info.md5) {
        //         is_repeat = true
        //     }
        // })

        for (const message_elm of this.message_list_elm.children) {
            if (message_elm.getAttribute('md5') === message_info.md5) {
                is_repeated = true
            }
        }

        if (!is_repeated) {
            this.message_list_elm.appendChild(new_message_elm)
            this.unchecked_cnt += 1
            this.renderBtns()
            this.updateNotification()
        }
    }
}

// TODO: 重写“设置”应用
class SettingApp implements IWatchApp {
    readonly id: string
    readonly icon_info: AppIconInfo

    constructor() {
        this.id = ''
        this.icon_info = {
            name: '',
            svg: '',
            css_dict: {},
            is_notification_enable: false
        }
    }

    onEnter() {

    }

    onExit() {

    }
}

export { Watch }
