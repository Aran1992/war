const unitArmatureName = 'bubing1';
let graphics = null;

let id = 0;

function createId(): number {
    id++;
    return id;
}

function normalizeRadian(radian: number): number {
    radian %= Math.PI * 2;
    if (radian < 0) {
        radian += Math.PI * 2;
    }
    return radian;
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
        // 如果是各零向量 那角度就算作是0吧
        const length = this.length();
        if (length === 0) {
            return 0;
        } else {
            return Math.asin(this.y / length);
        }
    }

    public distance(another: Vector2): number {
        return this.sub(another).length();
    }
}

class Line {
    private readonly point: Vector2;
    private readonly radian: number;
    private readonly k: number;
    private readonly b: number;

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

    public static createLineByPointAndRadian(point: Vector2, radian: number): Line {
        return new Line(point, radian);
    }

    public static createLineByTwoPoint(point0: Vector2, point1: Vector2): Line {
        const directionVector2 = point1.sub(point0);
        const radian = Math.atan(directionVector2.y / directionVector2.x);
        return Line.createLineByPointAndRadian(point0, radian);
    }

    private getLineIntersection(another: Line): Vector2 {
        const x = (another.b - this.b) / (this.k - another.k);
        const y = x * this.k + this.b;
        return new Vector2(x, y);
    }

    public calcPointDistanceFromLine(point: Vector2): number {
        const verticalLine = Line.createLineByPointAndRadian(point, this.radian + Math.PI / 2);
        const intersection = this.getLineIntersection(verticalLine);
        const sign = Math.sign(point.sub(intersection).radian());
        return intersection.distance(point) * sign;
    }

    public translationByPoint(point: Vector2): Line {
        const b = point.y - this.k * point.x;
        return new Line(this.k, b);
    }

    public getY(x: number): number {
        return this.k * x + this.b;
    }

    public getX(y: number): number {
        return (y - this.b) / this.k;
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
        this.textField.text = this.id.toString();
        this.textField.x = -this.textField.width / 2;
        this.textField.y = -this.textField.height;
        this.container.visible = false;
    }

    public move() {
        if (!this._destination) return;
        const move = this._destination.sub(this._position);
        const distance = move.length();
        this.display.scaleX = Math.sign(move.x);
        if (distance < 5) {
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
    private graphics: egret.Graphics;
    private myGroup: Group;
    private enemyGroup: Group;
    private frame: number = 0;

    public constructor() {
        super();
        // this.scaleX = this.scaleY = 0.6;
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
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
            console.log(e);
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
        graphics = this.graphics = sprite.graphics;

        if (window.location.href.indexOf('random') !== -1) {
            const size = 100;
            this.myGroup = this.createGroupByRandom({
                color: 0x00ff00,
                rect: {x: 100, y: 100, width: size, height: size},
            });
            this.enemyGroup = this.createGroupByRandom({
                color: 0xff0000,
                rect: {x: 700, y: 700, width: size, height: size},
            });
        } else {
            this.myGroup = this.createGroupByLayout({
                color: 0x00ff00,
                groupPosition: new Vector2(500, 100)
            });
            this.enemyGroup = this.createGroupByLayout({
                color: 0xff0000,
                groupPosition: new Vector2(500, 600)
            });
        }


        this.faceEnemy(this.myGroup, this.enemyGroup);
        this.faceEnemy(this.enemyGroup, this.myGroup);
        this.drawUnits();

        // this.update();

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

    private createGroupByLayout({color = 0, groupPosition = new Vector2()}) {
        const group = new Group();
        group.units = getLayout({
            count: 25,
            row: 5,
            horizontalSpacing: 30,
            verticalSpacing: 30,
            slope: 0.5,
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

    private createGroupByRandom({color = 0, rect: {x, y, width, height}}) {
        const group = new Group();
        for (let i = 0; i < 25; i++) {
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

        this.graphics.clear();

        // if (this.frame > 120) {
        //     this.groupArrangeUnitEnemy(this.myGroup, this.enemyGroup);
        //     this.groupArrangeUnitEnemy(this.enemyGroup, this.myGroup);
        // }

        this.myGroup.units.concat(this.enemyGroup.units).forEach(unit => {
            if (unit.isArrivedDestination()) {
                return;
            }
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
        this.drawUnitFoundEnemy();
        this.$children.forEach((c) => {
            c.zIndex = c.y;
        });

        requestAnimationFrame(() => this.update());
    }

    private drawUnits() {
        this.myGroup.units.concat(this.enemyGroup.units).forEach(unit => {
            this.graphics.lineStyle(unit.thickness, unit.color);
            this.graphics.drawCircle(unit.position.x, unit.position.y, unit.radius);
            this.graphics.moveTo(unit.position.x, unit.position.y);
            if (unit.destination) {
                this.graphics.lineTo(unit.destination.x, unit.destination.y);
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
        this.graphics.lineStyle(1, 0x000000);
        const myCenter = myGroup.calcGroupCenter();
        this.graphics.drawCircle(myCenter.x, myCenter.y, 5);
        const enemyCenter = enemyGroup.calcGroupCenter();
        this.graphics.drawCircle(enemyCenter.x, enemyCenter.y, 5);
        const connectLine = Line.createLineByTwoPoint(myCenter, enemyCenter);
        this.graphics.moveTo(myCenter.x, myCenter.y);
        this.graphics.lineTo(enemyCenter.x, enemyCenter.y);
        const center = myCenter.add(enemyCenter).div(2).sub(enemyCenter.sub(myCenter).normalize().mul(20));
        const verticalLine = Line.createLineByPointAndRadian(center, Math.PI / 2 + connectLine.radian);
        const isVerticalLine = verticalLine.radian === Math.PI / 2 || verticalLine.radian === Math.PI / 2 * 3;
        if (isVerticalLine) {
            this.graphics.moveTo(center.x, 0);
            this.graphics.lineTo(center.x, 720);
        } else {
            this.graphics.moveTo(center.x + 10, verticalLine.getY(center.x + 10));
            this.graphics.lineTo(center.x - 10, verticalLine.getY(center.x - 10));
        }
        myGroup.units.forEach(unit => {
            unit.temp = connectLine.calcPointDistanceFromLine(unit.position);
            console.log('unit.temp', unit.id, unit.temp);
        });
        myGroup.units.sort((a, b) => {
            const diff = b.temp - a.temp;
            // if (diff === 0) {
            //     return verticalLine.calcPointDistanceFromLine(b.position) - verticalLine.calcPointDistanceFromLine(a.position);
            // } else {
            return diff;
            // }
        });
        console.log('myGroup.units.sort', myGroup.units.map(unit => unit.id));
        const baseSpacing = 15;
        if (isVerticalLine) {
            const startY = center.y + (myGroup.units.length - 1) * baseSpacing / 2;
            myGroup.units.forEach((unit, index) => {
                const x = center.x;
                const y = startY - index * baseSpacing;
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

    // 镜像寻敌？ 连线水平镜像寻敌
    // 突然感觉这么搞还是不行 因为根本上还是没有保证 小兵之间是分散站位的
    // 优先选择水平射线上的目标
    // 按照类似的感觉去寻找吗？
    // 还是得按照水平距离上最近的
    //

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
        const x = enemy.position.x + Math.sign(self.position.x - enemy.position.x) * 20;
        return new Vector2(x, enemy.position.y);
    }

    private sortEnemiesByLineDistance(self: Unit, enemies: Unit[], group: Group, enemyGroup: Group) {
        const connectLine = this.getGroupConnectLine(group, enemyGroup);
        const translationLine = connectLine.translationByPoint(self.position);
        enemies.forEach(unit => unit.temp = Math.abs(translationLine.calcPointDistanceFromLine(unit.position)));
        enemies.sort((a, b) => a.temp - b.temp);
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
                this.graphics.lineStyle(1, unit.color);
                this.graphics.moveTo(unit.position.x, unit.position.y);
                this.graphics.lineTo(unit.lockedTarget.position.x, unit.lockedTarget.position.y);
            }
        });
    }

    private onArriveEnemyFace(unit: Unit, enemy: Unit) {
        if (enemy) {
            unit.playAction('attk');
        }
    }
}
