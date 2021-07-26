const unitArmatureName = 'gongjianshou1';

class Vector2 {
    public x: number;
    public y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Main extends egret.DisplayObjectContainer {
    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }

    private onAddToStage(event: egret.Event) {
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

    private async runGame() {
        // await this.loadResource();

        // this.scaleX = this.scaleY = 0.6;

        // const bg = new egret.Bitmap();
        // // bg.texture = RES.getRes('war_bg3_jpg');
        // bg.texture = RES.getRes('origin_game_jpg');
        // bg.scaleX = bg.scaleY = 1 / 0.6;
        // this.addChild(bg);

        // const sprite = new egret.Sprite();
        // this.addChild(sprite);
        // const width = 1280 / 0.6;
        // const sceneWidth = 1440 / 0.6;
        // const height = 720 / 0.6;
        // const x = (sceneWidth - width) / 2;
        // sprite.graphics.beginFill(0x000000, 0.1);
        // sprite.graphics.drawRect(x, 0, width, height);
        // sprite.graphics.endFill();

        // this.parseDragonBones(unitArmatureName);
        // this.parseDragonBones(`DF-${unitArmatureName}`);

        // this.createAllLegion();

        // const x = 100;
        // const y = 100;
        // const obj = this.createUnit(x, y);
        // let count = 0;
        // this.addEventListener(egret.Event.ENTER_FRAME, () => {
        //     if (count < 60) {
        //         obj.x += 5;
        //     } else if (count < 120) {
        //         obj.x += 1;
        //     } else if (count < 180) {
        //         obj.x += 3;
        //     } else {
        //         obj.x += 10;
        //     }
        //     count++;
        // }, this);
        this.createUnits();
    }

    // private parseDragonBones(name) {
    //     const skeletonData = RES.getRes(name + '_ske_json');
    //     const textureData = RES.getRes(name + '_tex_json');
    //     const texture = RES.getRes(name + '_tex_png');

    //     const egretFactory = dragonBones.EgretFactory.factory;
    //     egretFactory.parseDragonBonesData(skeletonData);
    //     egretFactory.parseTextureAtlasData(textureData, texture);
    // }

    // private async loadResource() {
    //     try {
    //         await RES.loadConfig("resource/default.res.json", "resource/");
    //         await RES.loadGroup("preload", 0);
    //     } catch (e) {
    //         console.error(e);
    //     }
    // }

    // private drawCircle(x, y, radius, color) {
    //     const sprite = new egret.Sprite();
    //     this.addChild(sprite);
    //     sprite.graphics.beginFill(color);
    //     sprite.graphics.drawCircle(x, y, radius);
    //     sprite.graphics.endFill();
    // }

    // private createAllLegion() {
    //     const centerX = 2400 / 2;
    //     const centerY = 650;
    //     this.drawCircle(centerX, centerY, 50, 0xff0000);

    //     this.createLegion(centerX - 650, centerY);
    //     this.createLegion(centerX + 800, centerY);
    // }

    // private createLegion(legionX: number, legionY: number) {
    //     this.drawCircle(legionX, legionY, 50, 0x0000ff);

    //     const matrixColumnDistance = 180;
    //     const matrixRowDistance = 180;
    //     const xielv = 100;

    //     const columnCount = 5;
    //     const rowCount = 5;

    //     legionX -= ((columnCount - 1) * matrixColumnDistance + (rowCount - 1) * xielv) / 2;
    //     legionY -= (rowCount - 1) * matrixRowDistance / 2;
    //     for (let column = 0; column < columnCount; column++) {
    //         for (let row = 0; row < rowCount; row++) {
    //             const unitX = legionX + column * matrixColumnDistance + row * xielv;
    //             const unitY = legionY + row * matrixRowDistance;
    //             this.createMatrix(unitX, unitY);
    //         }
    //     }
    // }

    // private createMatrix(matrixX: number, matrixY: number) {
    //     this.drawCircle(matrixX, matrixY, 50, 0xffffff);

    //     const unitColumnDistance = 30;
    //     const unitRowDistance = 30;
    //     const xielv = 15;

    //     const columnCount = 5;
    //     const rowCount = 5;

    //     matrixX -= ((columnCount - 1) * unitColumnDistance + (rowCount - 1) * xielv) / 2;
    //     matrixY -= (rowCount - 1) * unitRowDistance / 2;
    //     for (let column = 0; column < columnCount; column++) {
    //         for (let row = 0; row < rowCount; row++) {
    //             const unitX = matrixX + column * unitColumnDistance + row * xielv;
    //             const unitY = matrixY + row * unitRowDistance;
    //             this.createUnit(unitX, unitY);
    //         }
    //     }
    // }

    // private createUnit(x: number, y: number) {
    //     const armatureDisplay = dragonBones.EgretFactory.factory.buildArmatureDisplay('Armature', unitArmatureName);
    //     this.addChild(armatureDisplay);
    //     armatureDisplay.animation.play('walk', 0);
    //     armatureDisplay.x = x;
    //     armatureDisplay.y = y;
    //     return armatureDisplay;
    // }

    private createUnits() {
        const self = [];
        const enemies = [];
        const selfCount = 10;
        const enemyCount = 10;
        const selfColor = 0x00ff00;
        const enemiesColor = 0xff0000;
        for (let i = 0; i < selfCount; i++) {
            self.push([Math.random() * 250, Math.random() * 250]);
        }
        for (let i = 0; i < enemyCount; i++) {
            enemies.push([250 + Math.random() * 250, 250 + Math.random() * 250]);
        }
        const sprite = new egret.Sprite();
        this.addChild(sprite);
        const g = sprite.graphics;
        self.forEach(([x, y], i) => {
            g.beginFill(selfColor);
            g.drawCircle(x, y, 5);
            g.endFill();
        });
        enemies.forEach(([x, y], i) => {
            g.beginFill(enemiesColor);
            g.drawCircle(x, y, 5);
            g.endFill();
        });
        const [selfCenter, selfRadius] = this.findCenter(self);
        g.lineStyle(5, selfColor);
        g.drawCircle(selfCenter[0], selfCenter[1], selfRadius);
        const [enemiesCenter, emeiesRadius] = this.findCenter(enemies);
        g.lineStyle(5, enemiesColor);
        g.drawCircle(enemiesCenter[0], enemiesCenter[1], emeiesRadius);
        g.moveTo(selfCenter[0], selfCenter[1]);
        g.lineTo(enemiesCenter[0], enemiesCenter[1]);
        const groupsCenter = this.findCenterPoint(selfCenter, enemiesCenter);
        g.drawCircle(groupsCenter[0], groupsCenter[1], 5);
        const lineAngle = this.calcLineAngle(selfCenter, enemiesCenter);
        console.log('lineAngle', lineAngle / Math.PI * 180);
        const selfInfo = self.map((pos, i) => ({ pos, i, dis: this.calcPoint2LineDistance(pos, selfCenter, lineAngle, g) }));
        selfInfo.sort((a, b) => a.dis - b.dis);
        selfInfo.forEach(({ pos }, i) => {
            const label = new egret.TextField();
            label.text = i.toString();
            this.addChild(label);
            label.x = pos[0];
            label.y = pos[1];
        })
        console.log('selfInfo', selfInfo);
    }

    private findEnemy(self, enemies) {

    }

    private findCenter(units) {
        let max = 0;
        let maxBetween = [];
        for (let i = 0; i < units.length; i++) {
            for (let j = 0; j < units.length; j++) {
                if (i !== j) {
                    const length = this.calcPointLength(units[i], units[j]);
                    if (length > max) {
                        max = length;
                        maxBetween = [i, j];
                    }
                }
            }
        }
        return [this.findCenterPoint(units[maxBetween[0]], units[maxBetween[1]]), max / 2];
    }

    private calcPointLength(p1, p2) {
        return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
    }

    private findCenterPoint(p1, p2) {
        return [p1[0] + (p2[0] - p1[0]) / 2, p1[1] + (p2[1] - p1[1]) / 2];
    }

    private calcPoint2LineDistance(point, lineStartPoint, lineAngle, g?) {
        console.log('calcPoint2LineDistance', point, lineStartPoint, lineAngle);
        const x1 = point[0] - lineStartPoint[0];
        const y1 = Math.tan(lineAngle) * x1;
        const y2 = point[1] - lineStartPoint[1];
        const x2 = y2 / Math.tan(lineAngle);
        console.log(x1, y1, x2, y2);
        const length = this.calcPointLength([x1, y1], [x2, y2]);
        console.log(length);
        const width = x1 - x2;
        const height = y1 - y2;
        const mianji = width * height / 2
        console.log(length, width, height, mianji, mianji * 2 / length);
        if (g) {
            g.lineStyle(1, 0xfff000);
            g.drawCircle(point[0], lineStartPoint[1] + y1, 2);
            g.lineStyle(1, 0x000fff);
            g.drawCircle(lineStartPoint[0] + x2, point[1], 2);
            // g.drawCircle(lineStartPoint[0] + x2, point[1], 2);
        }
        return mianji * 2 / length;
    }

    private calcLineAngle(start, end) {
        return Math.atan((end[1] - start[1]) / (end[0] - start[0]));
    }
}