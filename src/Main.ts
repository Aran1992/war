const unitArmatureName = 'bubing1';
let graphics = null;

let id = 0;

function createId(): number {
    id++;
    return id;
}

/**
 * 返回的radian范围是在0-Math.PI*2区间
 * @param radian
 */
function normalizeRadian(radian: number): number {
    radian %= Math.PI * 2;
    if (radian < 0) {
        radian += Math.PI * 2;
    }
    return radian;
}

function radian2angle(radian: number): number {
    return radian / Math.PI * 180;
}

function drawLine(p1: Vector2, p2: Vector2, thickness = 1, color = 0x000000) {
    // graphics.lineStyle(thickness, color);
    // graphics.moveTo(p1.x, p1.y);
    // graphics.lineTo(p2.x, p2.y);
}

class Vector2 {
    public x: number;
    public y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    public add(another: Vector2): Vector2 {
        return new Vector2(this.x + another.x, this.y + another.y);
    }

    public sub(another: Vector2): Vector2 {
        return new Vector2(this.x - another.x, this.y - another.y);
    }

    public length(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    public normalize(): Vector2 {
        const length = this.length();
        return new Vector2(this.x / length, this.y / length);
    }

    public mul(x: number): Vector2 {
        return new Vector2(this.x * x, this.y * x);
    }

    public div(x: number): Vector2 {
        return new Vector2(this.x / x, this.y / x);
    }

    public radian(): number {
        const x = this.x;
        const y = this.y;
        if (x > 0) {
            if (y > 0) {
                return Math.atan(y / x);
            } else if (y < 0) {
                return Math.atan(y / x);
            } else {
                return 0;
            }
        } else if (x < 0) {
            if (y > 0) {
                return Math.atan(y / x) + Math.PI;
            } else if (y < 0) {
                return Math.atan(y / x) + Math.PI;
            } else {
                return Math.PI;
            }
        } else {
            if (y > 0) {
                return Math.PI / 2;
            } else if (y < 0) {
                return Math.PI / 2 * 3;
            } else {
                return 0;
            }
        }
    }

    public distance(another: Vector2): number {
        return this.sub(another).length();
    }
}

class Line {
    private readonly point: Vector2;
    public readonly radian: number;
    private readonly k: number;
    private readonly b: number;

    public static createLineByPointAndRadian(point: Vector2, radian: number): Line {
        return new Line(point, radian);
    }

    public static createLineByTwoPoint(point0: Vector2, point1: Vector2): Line {
        const directionVector2 = point1.sub(point0);
        const radian = Math.atan(directionVector2.y / directionVector2.x);
        return Line.createLineByPointAndRadian(point0, radian);
    }

    private constructor(point: Vector2, radian: number) {
        this.point = point;
        this.radian = normalizeRadian(radian);
        if (this.radian % (Math.PI / 2) !== 0) {
            this.k = Math.tan(this.radian);
            this.b = this.point.y - this.point.x * this.k;
        } else if (this.radian % Math.PI === 0) {
            this.k = 0;
            this.b = this.point.y;
        }
    }

    private isVerticalLine(): boolean {
        return this.k === undefined;
    }

    private getLineIntersection(another: Line): Vector2 {
        if (this.isParallel(another)) {
            return null;
        }
        if (this.isVerticalLine()) {
            return new Vector2(this.point.x, another.getY(this.point.x));
        } else if (another.isVerticalLine()) {
            return new Vector2(another.point.x, this.getY(another.point.x));
        } else {
            const x = (another.b - this.b) / (this.k - another.k);
            const y = x * this.k + this.b;
            return new Vector2(x, y);
        }
    }

    public isParallel(line: Line): boolean {
        return this.k === line.k;
    }

    public calcPointDistanceFromLine(point: Vector2): number {
        const verticalLine = Line.createLineByPointAndRadian(point, this.radian + Math.PI / 2);
        const intersection = this.getLineIntersection(verticalLine);
        let sign;
        const linePoint2Point = point.sub(this.point);
        const linePoint2PointRadian = normalizeRadian(linePoint2Point.radian());
        const radian = normalizeRadian(linePoint2PointRadian - this.radian);
        if (radian % Math.PI === 0) {
            sign = 0;
        } else {
            sign = radian > Math.PI ? -1 : 1;
        }
        const length = intersection.distance(point);
        return length * sign;
    }

    public translationByPoint(point: Vector2): Line {
        return new Line(point, this.radian);
    }

    public getY(x: number): number {
        if (this.isVerticalLine()) {
            throw new Error("can't get y if line is vertical");
        }
        return this.k * x + this.b;
    }

    public getX(y: number): number {
        if (this.isVerticalLine()) {
            return this.point.x;
        } else {
            return (y - this.b) / this.k;
        }
    }
}

class Group {
    public units: Unit[] = [];

    public calcGroupCenter(): Vector2 {
        const sum = this.units.reduce((sum, unit) => sum.add(unit.position), new Vector2());
        return sum.div(this.units.length);
    }
}

class Unit {
    public id: number;

    get color(): number {
        return this._color;
    }

    set color(value: number) {
        this._color = value;
    }

    public lockedSrc: Unit[] = [];
    public lockedTarget: Unit;

    public get lockIndex(): number {
        return this.lockedTarget.lockedSrc.indexOf(this);
    }

    get destination(): Vector2 {
        return this._destination;
    }

    set destination(value: Vector2) {
        this._destination = value;
        this.display.tint = this.color;
    }

    get position(): Vector2 {
        return this._position;
    }

    set position(value: Vector2) {
        this._position = value;
        this.container.x = value.x;
        this.container.y = value.y;
    }

    public thickness: number;
    private _color: number;
    private _position: Vector2;
    public radius: number;
    private _destination: Vector2;
    public speed: number;
    public temp: any;

    public container: egret.DisplayObjectContainer = new egret.DisplayObjectContainer();
    public display: dragonBones.EgretArmatureDisplay;
    public textField: egret.TextField = new egret.TextField();

    public constructor(parent: egret.DisplayObjectContainer, display: dragonBones.EgretArmatureDisplay) {
        this.id = createId();
        this.display = display;
        parent.addChild(this.container);
        this.container.addChild(this.display);
        this.container.addChild(this.textField);
        this.textField.size = 10;
        this.updateTextField(this.id.toString());
        // this.display.visible = false;
    }

    private updateTextField(str: string) {
        this.textField.text = str;
        this.textField.x = -this.textField.width / 2;
        this.textField.y = -this.textField.height / 2;
    }

    public move() {
        this.updateTextField(`${this.id}-${this.lockedTarget ? this.lockedTarget.id : ''}`);
        if (!this._destination) return;
        const move = this._destination.sub(this._position);
        const distance = move.length();
        this.display.scaleX = move.x ? Math.sign(move.x) : 1;
        if (distance < 1) {
            this._destination = null;
            return;
        } else {
            let speed = this.speed;
            if (speed > distance) {
                speed = distance;
            }
            const direction = move.normalize();
            const velocity = direction.mul(speed);
            this.position = this.position.add(velocity);
        }
    }

    playAction(name: string) {
        if (this.display.animation.lastAnimationName !== name) {
            this.display.animation.play(name, 0);
        }
    }

    isArrivedDestination(): boolean {
        if (!this.destination) return true;
        const move = this._destination.sub(this._position);
        const distance = move.length();
        return distance < 1;
    }
}

function getLayout({
                       count = 0,
                       row = 0,
                       horizontalSpacing = 0,
                       verticalSpacing = 0,
                       slope = 0,
                   }): Vector2[] {
    const positions = [];
    const column = count / row;
    let width = 0;
    let height = 0;
    outerLoop : for (let c = 0; c < column; c++) {
        for (let r = 0; r < row; r++) {
            if (c * row + r >= count) {
                break outerLoop;
            }
            const x = c * horizontalSpacing + r * verticalSpacing * slope;
            const y = r * verticalSpacing;
            positions.push(new Vector2(x, y));
            if (x > width) {
                width = x;
            }
            if (y > height) {
                height = y;
            }
        }
    }
    positions.forEach(pos => {
        pos.x -= width / 2;
        pos.y -= height / 2;
    });
    return positions;
}

class Main extends egret.DisplayObjectContainer {
    private myGroup: Group;
    private enemyGroup: Group;
    private frame: number = 0;

    public constructor() {
        super();
        // this.scaleX = this.scaleY = 0.6;
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
        // const container = new egret.DisplayObjectContainer();
        // container.x = 400;
        // container.y = 400;
        // this.addChild(container);
        // for (let i = 0; i < 6; i++) {
        //     const pos = this.calcPositionAroundLockedTarget(i);
        //     const textField = new egret.TextField();
        //     container.addChild(textField);
        //     textField.text = i.toString();
        //     textField.x = pos.x * 30;
        //     textField.y = pos.y * 30;
        // }
    }

    private onAddToStage() {
        egret.lifecycle.addLifecycleListener((context) => {
            context.onUpdate = () => {
            };
        });

        egret.lifecycle.onPause = () => {
            egret.ticker.pause();
        };

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
        };

        this.runGame().catch(e => {
            console.error(e);
        });
    }

    private async loadResource() {
        try {
            await RES.loadConfig("resource/default.res.json", "resource/");
            await RES.loadGroup("preload", 0);
        } catch (e) {
            console.error(e);
        }
    }

    private parseDragonBones(name) {
        const skeletonData = RES.getRes(name + '_ske_json');
        const textureData = RES.getRes(name + '_tex_json');
        const texture = RES.getRes(name + '_tex_png');

        const egretFactory = dragonBones.EgretFactory.factory;
        egretFactory.parseDragonBonesData(skeletonData);
        egretFactory.parseTextureAtlasData(textureData, texture);
    }

    private createUnitDisplay(x: number, y: number) {
        const armatureDisplay = dragonBones.EgretFactory.factory.buildArmatureDisplay('Armature', unitArmatureName);
        this.addChild(armatureDisplay);
        armatureDisplay.animation.play('walk', 0);
        armatureDisplay.x = x;
        armatureDisplay.y = y;
        return armatureDisplay;
    }

    private async runGame() {
        await this.loadResource();

        this.parseDragonBones(unitArmatureName);
        this.parseDragonBones(`DF-${unitArmatureName}`);

        const sprite = new egret.Sprite();
        this.addChild(sprite);
        graphics = sprite.graphics;

        let x1, x2, y1, y2;
        const layoutType: number = 2;
        switch (layoutType) {
            case 0: {
                x1 = y1 = 100;
                x2 = y2 = 500;
                break;
            }
            // 垂直
            case 1: {
                x1 = x2 = 300;
                y1 = 100;
                y2 = 600;
                break;
            }
            // 水平
            case 2: {
                y1 = y2 = 300;
                x1 = 100;
                x2 = 600;
                break;
            }
        }

        const count = 25;
        if (window.location.href.indexOf('random') !== -1) {
            const size = 100;
            this.myGroup = this.createGroupByRandom({
                count: count,
                color: 0x00ff00,
                rect: {x: x1, y: y1, width: size, height: size},
            });
            this.enemyGroup = this.createGroupByRandom({
                count: count,
                color: 0xff0000,
                rect: {x: x2, y: y2, width: size, height: size},
            });
        } else {
            this.myGroup = this.createGroupByLayout({
                count: 10,
                color: 0x00ff00,
                groupPosition: new Vector2(x1, y1)
            });
            this.enemyGroup = this.createGroupByLayout({
                count: 10,
                color: 0xff0000,
                groupPosition: new Vector2(x2, y2)
            });
        }

        const selfSmaller = this.myGroup.units.length < this.enemyGroup.units.length;
        if (selfSmaller) {
            this.faceEnemy(this.myGroup, this.enemyGroup);
            this.groupArrangeUnitEnemy(this.enemyGroup, this.myGroup);
        } else {
            this.faceEnemy(this.enemyGroup, this.myGroup);
            this.groupArrangeUnitEnemy(this.myGroup, this.enemyGroup);
        }
        this.drawUnits();

        this.update();

        // 敌我军团寻找敌人 向敌人冲锋
        // 要碰到敌人时 进行散开
        // 合理分配敌人
        // 和敌人进行战斗
        // 杀死敌人之后寻找下一个目标 向目标靠近
        // 寻找下一个军团 向敌人冲锋
        // 在地图上根据一定规则 创建一堆小点
        // 获取军团中小队的布局
        // 获取小队中单位的布局
        // 群体移动 保持阵型移动
        // 不需要啥寻路算法
        // 单个单位每帧移动
        // 指定目标之后 在目标区域形成一个新的位置表 然后再使用新的位置去作为目标位置
        // todo
        // 靠近敌人之后 根据和敌人的相对位置 散开阵型

        // 今天还要补充哪些内容
        // 人数不对等的情况下
        // 不能这么僵硬站在原地等
        // 进入一定范围之后 就要根据一定规则冲到对方跟前进行战斗了
    }

    private createGroupByLayout({color = 0, groupPosition = new Vector2(), count}) {
        const group = new Group();
        group.units = getLayout({
            count,
            row: 5,
            horizontalSpacing: 30,
            verticalSpacing: 30,
            slope: 1,
        }).map(pos => {
            const unit = new Unit(this, this.createUnitDisplay(0, 0));
            unit.thickness = 1;
            unit.color = color;
            unit.position = pos.add(groupPosition);
            unit.radius = 5;
            unit.speed = 2;
            return unit;
        });
        return group;
    }

    private createGroupByRandom({color = 0, rect: {x, y, width, height}, count}) {
        const group = new Group();
        for (let i = 0; i < count; i++) {
            const unit = new Unit(this, this.createUnitDisplay(0, 0));
            unit.thickness = 1;
            unit.color = color;
            unit.position = new Vector2(Math.random() * width + x, Math.random() * height + y);
            unit.radius = 5;
            unit.speed = 2;
            group.units.push(unit);
        }
        return group;
    }

    private update() {
        this.frame++;
        // this.myGroup.units.forEach(unit => unit.destination = unit.position.add(new Vector2(1, 0)));
        // this.enemyGroup.units.forEach(unit => unit.destination = unit.position.add(new Vector2(-1, 0)));

        graphics.clear();

        // if (this.frame > 120) {
        //     this.groupArrangeUnitEnemy(this.myGroup, this.enemyGroup);
        //     this.groupArrangeUnitEnemy(this.enemyGroup, this.myGroup);
        // }

        this.myGroup.units.concat(this.enemyGroup.units).forEach(unit => {
            // if (unit.isArrivedDestination()) {
            //     return;
            // }
            if (unit.lockedTarget) {
                unit.destination = this.calcDestination(unit, unit.lockedTarget);
            }
            unit.move();
            // if (unit.isArrivedDestination()) {
            //     unit.arrivedEnemyFace = true;
            //     this.onArriveEnemyFace(unit, unit.lockedTarget);
            // }
        });

        this.drawUnits();
        // this.drawUnitFoundEnemy();
        this.$children.forEach((c) => {
            c.zIndex = c.y;
        });

        requestAnimationFrame(() => this.update());
    }

    private drawUnits() {
        this.myGroup.units.concat(this.enemyGroup.units).forEach(unit => {
            graphics.lineStyle(unit.thickness, unit.color);
            graphics.drawCircle(unit.position.x, unit.position.y, unit.radius);
            if (unit.destination) {
                drawLine(unit.position, unit.destination);
            }
        });
    }

    private getGroupConnectLine(myGroup: Group, enemyGroup: Group) {
        const myCenter = myGroup.calcGroupCenter();
        const enemyCenter = enemyGroup.calcGroupCenter();
        return Line.createLineByTwoPoint(myCenter, enemyCenter);
    }

    /**
     * 队伍中心点
     * 队伍中心点连线
     * 过连线中点做垂直于连线的垂线
     * 计算小兵和连线的距离 根据距离排序 然后平均分配在垂线上
     * @param myGroup
     * @param enemyGroup
     * @private
     */
    private faceEnemy(myGroup: Group, enemyGroup: Group) {
        // todo 现在刚好彻底反过来了 说明距离的测算刚好倒过来了
        graphics.lineStyle(1, 0x000000);
        const myCenter = myGroup.calcGroupCenter();
        graphics.drawCircle(myCenter.x, myCenter.y, 5);
        const enemyCenter = enemyGroup.calcGroupCenter();
        graphics.drawCircle(enemyCenter.x, enemyCenter.y, 5);
        const connectLine = Line.createLineByTwoPoint(myCenter, enemyCenter);
        drawLine(myCenter, enemyCenter);
        const center = myCenter.add(enemyCenter).div(2)
        // .sub(enemyCenter.sub(myCenter).normalize().mul(20));
        const verticalLine = Line.createLineByPointAndRadian(center, Math.PI / 2 + connectLine.radian);
        const isVerticalLine = verticalLine.radian === Math.PI / 2 || verticalLine.radian === Math.PI / 2 * 3;
        if (isVerticalLine) {
            graphics.moveTo(center.x, 0);
            graphics.lineTo(center.x, 720);
        } else {
            graphics.moveTo(center.x + 10, verticalLine.getY(center.x + 10));
            graphics.lineTo(center.x - 10, verticalLine.getY(center.x - 10));
        }
        myGroup.units.forEach(unit => {
            unit.temp = connectLine.calcPointDistanceFromLine(unit.position);
        });
        myGroup.units.sort((a, b) => {
            const diff = a.temp - b.temp;
            if (diff === 0) {
                const aa = Math.abs(verticalLine.calcPointDistanceFromLine(a.position));
                const bb = Math.abs(verticalLine.calcPointDistanceFromLine(b.position));
                if (a.temp > 0) {
                    return aa - bb;
                } else {
                    return bb - aa;
                }
            } else {
                return diff;
            }
        });
        const baseSpacing = 30;
        if (isVerticalLine) {
            const startY = center.y - (myGroup.units.length - 1) * baseSpacing / 2;
            myGroup.units.forEach((unit, index) => {
                const x = center.x;
                const y = startY + index * baseSpacing;
                unit.destination = new Vector2(x, y);
            });
        } else {
            const spacing = Math.cos(verticalLine.radian) * baseSpacing;
            const startX = center.x - (myGroup.units.length - 1) * spacing / 2;
            myGroup.units.forEach((unit, index) => {
                const x = startX + index * spacing;
                const y = verticalLine.getY(x);
                unit.destination = new Vector2(x, y);
            });
        }
    }

    private groupArrangeUnitEnemy(group: Group, enemyGroup: Group) {
        const enemyGroupPosition = enemyGroup.calcGroupCenter();
        group.units.forEach(unit => unit.temp = unit.position.distance(enemyGroupPosition));
        group.units.sort((a, b) => a.temp - b.temp);
        group.units.forEach(unit => this.unitFindEnemy(unit, enemyGroup.units, group, enemyGroup));
    }

    private unitFindEnemy(self: Unit, enemies: Unit[], group: Group, enemyGroup: Group) {
        if (self.lockedTarget) return;
        if (enemies.length === 0) return;

        if (self.lockedSrc.length) {
            self.lockedTarget = self.lockedSrc[0];
            return;
        }

        this.sortEnemiesByLineDistance(self, enemies, group, enemyGroup);

        const enemy = enemies[0];
        self.lockedTarget = enemy;
        enemy.lockedSrc.push(self);
    }

    private calcDestination(self: Unit, enemy: Unit): Vector2 {
        const baseVector = this.calcPositionAroundLockedTarget(self.lockIndex);
        baseVector.x *= 30;
        baseVector.y *= 10;
        return enemy.position.add(baseVector);
    }

    private sortEnemiesByLineDistance(self: Unit, enemies: Unit[], group: Group, enemyGroup: Group) {
        const connectLine = this.getGroupConnectLine(group, enemyGroup);
        const translationLine = connectLine.translationByPoint(self.position);
        enemies.forEach(unit => unit.temp = Math.abs(translationLine.calcPointDistanceFromLine(unit.position)));
        enemies.sort((a, b) => a.lockedSrc.length - b.lockedSrc.length || a.temp - b.temp);
    }

    private sortEnemiesByDirectlyDistance(self: Unit, enemies: Unit[]) {
        enemies.forEach(unit => unit.temp = unit.position.distance(self.position));
        enemies.sort((a, b) => {
            if (a.lockedSrc.length !== b.lockedSrc.length) {
                return a.lockedSrc.length - b.lockedSrc.length;
            } else {
                return a.temp - b.temp;
            }
        });
    }

    private drawUnitFoundEnemy() {
        this.myGroup.units.concat(this.enemyGroup.units).forEach((unit) => {
            if (unit.lockedTarget) {
                drawLine(unit.position, unit.lockedTarget.position, 1, unit.color);
            }
        });
    }

    private onArriveEnemyFace(unit: Unit, enemy: Unit) {
        if (enemy) {
            unit.playAction('attk');
        }
    }

    private calcPositionAroundLockedTarget(index: number): Vector2 {
        const sign = index % 2 === 0 ? 1 : -1;
        const halfIndex = Math.floor(index / 2);
        const halfSign = halfIndex % 2 === 0 ? -1 : 1;
        const quarterIndex = Math.floor((halfIndex + 1) / 2);
        return new Vector2(sign, halfSign * quarterIndex);
    }
}
